const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const setup = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the GrizzlySMS button in this channel (admin only)'),

  async execute(interaction) {

    const setupEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📱 Get a Temporary Phone Number')
      .setDescription('Click the button below to request a temporary USA phone number for Instagram verification.')
      .setFooter({ text: 'GrizzlySMS Bot' })
      .setTimestamp();

    const getNumberBtn = new ButtonBuilder()
      .setCustomId('ig_get_number_btn')
      .setLabel('📱 Get a Number')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(getNumberBtn);

    await interaction.reply({
      embeds: [setupEmbed],
      components: [row],
    });

    try {
      await interaction.message.pin();
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  },
};

module.exports = setup;
