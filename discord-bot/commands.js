const {
  REST,
  Routes,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionsBitField
} = require("discord.js");
const config = require("../config.json");

// Define commands with proper structure and types
const commands = [
  {
    type: ApplicationCommandType.ChatInput,
    name: "getaccess",
    description: "Get access to the server by providing a reference code",
    defaultMemberPermissions: "0", // Use string instead of BigInt
    dmPermission: false,
    options: [
      {
        type: 3, // Use raw number instead of ApplicationCommandOptionType
        name: "reference_code",
        description: "Your reference code",
        required: true,
      },
    ],
  },
];

// Create REST instance
const rest = new REST({ version: "10" }).setToken(config.token);

const registerCommands = async (client) => {
  try {
    if (!config.token || !config.clientId || !config.guildId) {
      throw new Error("Missing required configuration");
    }

    // Convert BigInt values to strings before JSON stringify
    const commandData = commands.map(command => ({
      ...command,
      defaultMemberPermissions: String(command.defaultMemberPermissions)
    }));

    console.log("Command structure:", JSON.stringify(commandData, null, 2));

    const response = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandData }
    );

    console.log("Successfully registered commands");
    return response;
  } catch (error) {
    console.error("Error registering commands:", error);
    throw error;
  }
};

module.exports = { registerCommands };
