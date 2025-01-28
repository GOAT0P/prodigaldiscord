const { 
  Client, 
  GatewayIntentBits, 
  Events, 
  PermissionsBitField
} = require("discord.js");
const { registerCommands } = require("./commands");
const pool = require("../config/db");
const config = require("../config.json");

// Log the Discord token for debugging
console.log("Discord Token:", config.token);

// Initialize Discord Client with all necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ],
  allowedMentions: { parse: ['users', 'roles'] }
});

// Handle WebSocket errors
client.on(Events.ShardError, error => {
  console.error('A websocket connection encountered an error:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Add error event handler
client.on('error', error => {
  console.error('Discord client error:', error);
});

// Add debug event handler
client.on('debug', info => {
  console.log('Debug:', info);
});

// Add warning event handler
client.on('warn', warning => {
  console.warn('Warning:', warning);
});

// Register commands and interactions
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Verify intents
  const requiredIntents = [
    'Guilds',
    'GuildMembers',
    'GuildPresences',
    'MessageContent',
    'GuildMessages'
  ];
  
  const missingIntents = requiredIntents.filter(intent => 
    !client.options.intents.has(GatewayIntentBits[intent])
  );

  if (missingIntents.length > 0) {
    console.error('Missing required intents:', missingIntents);
    process.exit(1);
  }

  try {
    await registerCommands(client);
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() || interaction.commandName !== "getaccess") return;

  // Check if the command is used in the specific channel
  const allowedChannelId = "1317751243682091038";
  if (interaction.channelId !== allowedChannelId) {
    await interaction.reply({
      content: `❌ This command can only be used in <#${allowedChannelId}>.`,
      ephemeral: true
    });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    // Check bot permissions first
    const requiredPermissions = [
      PermissionsBitField.Flags.ManageNicknames,
      PermissionsBitField.Flags.ManageRoles
    ];

    const botMember = interaction.guild?.members?.me;
    if (!botMember || !botMember.permissions.has(requiredPermissions)) {
      await interaction.editReply({
        content: "I don't have the required permissions. Please ensure I have 'Manage Nicknames' and 'Manage Roles' permissions."
      });
      return;
    }

    const referenceCode = interaction.options.getString("reference_code");
    const userId = interaction.user.id;
    const guild = interaction.guild;

    // First check if the user already has access
    const userCheckQuery = "SELECT discord_id FROM members WHERE discord_id = $1";
    const userCheck = await pool.query(userCheckQuery, [userId]);
    
    if (userCheck.rows.length > 0) {
      await interaction.editReply({
        content: "❌ You have already received your role as an internal team member."
      });
      return;
    }

    // Check reference code and if it's already used
    const query = `
      SELECT first_name, last_name, internal_role, discord_id 
      FROM members 
      WHERE reference_code = $1
    `;
    const result = await pool.query(query, [referenceCode]);

    if (result.rows.length === 0) {
      await interaction.editReply({
        content: "❌ Invalid reference code. Please try again."
      });
      return;
    }

    const { first_name, last_name, internal_role, discord_id } = result.rows[0];

    // Check if reference code has already been used by someone else
    if (discord_id) {
      await interaction.editReply({
        content: "❌ This reference code is already in use by another internal team member."
      });
      return;
    }

    try {
      const member = await guild.members.fetch(userId);

      // Update nickname
      await member.setNickname(`${first_name} ${last_name}`);

      // Add role if specified
      if (internal_role) {
        const role = guild.roles.cache.get(internal_role);
        if (role) {
          await member.roles.add(role);
        }
      }

      // Update database with Discord ID
      await pool.query(
        "UPDATE members SET discord_id = $1 WHERE reference_code = $2",
        [userId, referenceCode]
      );

      await interaction.editReply({
        content: "✅ Successfully approved as internal team member! Your nickname and role have been updated."
      });

    } catch (updateError) {
      console.error('Error updating member:', updateError);
      await interaction.editReply({
        content: "❌ Failed to update your settings. Please contact an administrator."
      });
    }
  } catch (error) {
    console.error('Interaction error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "An error occurred while processing your request.",
        ephemeral: true
      });
    } else {
      await interaction.editReply({
        content: "❌ An error occurred while processing your request."
      });
    }
  }
});

// Login with error handling
client.login(config.token).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});

const fetchRoles = async () => {
  try {
    const guild = client.guilds.cache.get(config.guildId); // Use your guild ID
    if (!guild) throw new Error("Guild not found");

    const roles = guild.roles.cache.map((role) => ({
      id: role.id,
      name: role.name,
    }));

    console.log("Fetched Roles:", roles); // Debug log to ensure roles are fetched
    return roles; // Return roles
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
};

module.exports = { fetchRoles };
