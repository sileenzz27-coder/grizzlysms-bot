const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const setup = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the GrizzlySMS button in this channel (admin only)'),

  async execute(interaction) {

    const setupEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📱 Get a Temporary Phone Number')
      .setDescription('Click a button below to request a temporary USA phone number for Instagram verification.')
      .setFooter({ text: 'GrizzlySMS Bot' })
      .setTimestamp();

    const service1Btn = new ButtonBuilder()
      .setCustomId('ig_service_1_btn')
      .setLabel('📱 Service 1')
      .setStyle(ButtonStyle.Primary);

    const service2Btn = new ButtonBuilder()
      .setCustomId('ig_service_2_btn')
      .setLabel('📱 Service 2')
      .setStyle(ButtonStyle.Secondary);

    const service3Btn = new ButtonBuilder()
      .setCustomId('ig_service_3_btn')
      .setLabel('📱 Service 3')
      .setStyle(ButtonStyle.Secondary);

    const service4Btn = new ButtonBuilder()
      .setCustomId('ig_service_4_btn')
      .setLabel('📱 Service 4')
      .setStyle(ButtonStyle.Secondary);

    const service5Btn = new ButtonBuilder()
      .setCustomId('ig_service_5_btn')
      .setLabel('📱 Service 5')
      .setStyle(ButtonStyle.Secondary);

    const service6Btn = new ButtonBuilder()
      .setCustomId('ig_service_6_btn')
      .setLabel('📱 Service 6')
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(service1Btn, service2Btn, service3Btn, service4Btn, service5Btn);
    const row2 = new ActionRowBuilder().addComponents(service6Btn);

    await interaction.reply({
      embeds: [setupEmbed],
      components: [row1, row2],
    });

    try {
      await interaction.message.pin();
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  },
};

module.exports = setup;
