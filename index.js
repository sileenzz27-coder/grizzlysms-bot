console.log('[INIT] Loading env...');
require('dotenv').config();
console.log('[INIT] Discord.js importing...');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
console.log('[INIT] Loading setup command...');
const setup = require('./src/commands/setup');
console.log('[INIT] Loading getnumber command...');
const getnumber = require('./src/commands/getnumber');
console.log('[INIT] Loading button handler...');
const { handleButtonClick } = require('./src/handlers/buttonHandler');
console.log('[INIT] All imports loaded');

console.log('[INIT] Creating client...');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

console.log('[INIT] Setting up commands...');
client.commands = new Collection();
client.commands.set(setup.data.name, setup);
client.commands.set(getnumber.data.name, getnumber);

console.log('[INIT] Creating REST client...');
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
console.log('[INIT] Token loaded:', process.env.DISCORD_TOKEN ? '✅' : '❌');

client.once('ready', async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  try {
    const commands = [setup.data, getnumber.data];
    console.log(`[DEBUG] Registering ${commands.length} commands:`, commands.map(c => c.name));
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registered');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error('Command error:', err);
      try {
        await interaction.reply({
          content: '❌ An error occurred.',
          ephemeral: true,
        });
      } catch (replyErr) {
        console.error('Failed to reply to command error:', replyErr);
      }
    }
  } else if (interaction.isButton()) {
    try {
      await handleButtonClick(interaction);
    } catch (err) {
      console.error('Button handler error:', err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ An error occurred processing your request.',
            ephemeral: true,
          });
        } else {
          await interaction.editReply({
            content: '❌ An error occurred processing your request.',
          });
        }
      } catch (replyErr) {
        console.error('Failed to reply to button error:', replyErr);
      }
    }
  }
});

console.log('[INIT] About to login to Discord...');
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('[ERROR] Login failed:', err.message);
  process.exit(1);
});
