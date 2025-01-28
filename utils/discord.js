const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages
  ]
});

client.login(process.env.DISCORD_TOKEN);

const fetchDiscordRoles = async () => {
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const roles = await guild.roles.fetch();

    return roles.map((role) => ({ id: role.id, name: role.name }));
  } catch (error) {
    console.error("Error fetching Discord roles:", error);
    throw error;
  }
};

module.exports = { fetchDiscordRoles };
