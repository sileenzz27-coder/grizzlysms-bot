console.log('[getnumber.js] 1. Loading discord.js...');
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
console.log('[getnumber.js] 2. Loading grizzlyAPI...');
const { getNumber, getErrorMessage } = require('../utils/grizzlyAPI');
console.log('[getnumber.js] 3. Loading activationStore...');
const activationStore = require('../utils/activationStore');
console.log('[getnumber.js] 4. Loading polling...');
const { startPolling, logToAdmin } = require('../utils/polling');
console.log('[getnumber.js] 5. Loading formatPhone...');
const { formatPhoneNumber } = require('../utils/formatPhone');
console.log('[getnumber.js] ✅ All imports loaded');

const getnumber = {
  data: new SlashCommandBuilder()
    .setName('getnumber')
    .setDescription('Get a temporary USA phone number for Instagram'),

  async execute(interaction) {
    const user = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    const result = await getNumber(process.env.GRIZZLY_API_KEY, 'ig', '187');

    if (!result.success) {
      const errorMessage = getErrorMessage(result.error);
      await interaction.editReply({
        content: `❌ **Error**: ${errorMessage}`,
      });
      return;
    }

    const { activationId, phoneNumber, activationCost } = result;

    activationStore.set(activationId, {
      userId: user.id,
      username: user.username,
      phoneNumber,
      activationCost,
    });

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const numberEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📱 Your Number is Ready!')
      .addFields(
        { name: '🇺🇸 Phone Number', value: `\`${formattedPhone}\``, inline: false },
        { name: '⏳ Status', value: 'Waiting for SMS code...', inline: false },
        { name: '📝 Next Step', value: 'Enter this number on Instagram. The SMS code will arrive here automatically (up to 10 minutes).\n\n**Copy and paste the number above on Instagram.**', inline: false }
      )
      .setFooter({ text: 'GrizzlySMS Bot' })
      .setTimestamp();

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`num_cancel_${activationId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false);

    const row = new ActionRowBuilder().addComponents(cancelBtn);
    await interaction.editReply({ embeds: [numberEmbed], components: [row] });

    await logToAdmin(interaction.client, `📱 **${user.username}** requested a number — \`${formattedPhone}\``);

    activationStore.set(`${activationId}_time`, Date.now());

    startPolling(interaction.client, interaction, activationId, user.id, user.username, phoneNumber);
  },
};

module.exports = getnumber;
