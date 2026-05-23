const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getStatus, setStatus, get5SimStatus, cancel5SimOrder, getHeroSmsStatus, cancelHeroSmsOrder } = require('./grizzlyAPI');
const activationStore = require('./activationStore');
const { formatPhoneNumber } = require('./formatPhone');

const POLLING_INTERVAL = 10000;
const MAX_POLLS = 120;

async function logToAdmin(client, message) {
  const adminChannelId = process.env.ADMIN_LOG_CHANNEL_ID || '1507695666896568351';
  try {
    const channel = await client.channels.fetch(adminChannelId);
    if (channel) {
      await channel.send(message);
    }
  } catch (err) {
    console.error('Failed to log to admin channel:', err);
  }
}

function startPolling(client, interaction, activationId, userId, username, phoneNumber, provider = 'grizzly') {
  let pollCount = 0;

  const poll = async () => {
    pollCount++;

    try {
      let statusResult;
      if (provider === '5sim') {
        statusResult = await get5SimStatus(process.env.FIVESIM_API_KEY, activationId);
      } else if (provider === 'herosms') {
        statusResult = await getHeroSmsStatus(process.env.HEROSMS_API_KEY, activationId);
      } else {
        statusResult = await getStatus(process.env.GRIZZLY_API_KEY, activationId);
      }

      if (statusResult.error) {
        if (pollCount < MAX_POLLS) {
          setTimeout(poll, POLLING_INTERVAL);
        }
        return;
      }

      if (statusResult.status === 'STATUS_OK' && statusResult.code) {
        const code = statusResult.code;
        const formattedPhone = formatPhoneNumber(phoneNumber);

        const codeEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('💬 SMS Code Received!')
          .addFields(
            { name: '🇺🇸 Phone Number', value: `\`${formattedPhone}\``, inline: false },
            { name: '🔐 Your Code', value: `\`${code}\``, inline: false },
            { name: '✅ Next Step', value: 'Enter this code on Instagram to complete registration.\n\nOnce you\'ve entered it, click "Complete".', inline: false }
          )
          .setFooter({ text: 'GrizzlySMS Bot' })
          .setTimestamp();

        const completeBtn = new ButtonBuilder()
          .setCustomId(`num_use_${activationId}`)
          .setLabel('✅ Complete')
          .setStyle(ButtonStyle.Success);

        const cancelBtn = new ButtonBuilder()
          .setCustomId(`num_cancel_${activationId}`)
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(completeBtn, cancelBtn);

        try {
          await interaction.editReply({ embeds: [codeEmbed], components: [row] });
        } catch (err) {
          console.error('Failed to edit reply:', err);
        }

        await logToAdmin(client, `💬 **${username}** received a code on \`${phoneNumber}\``);
        return;
      }

      if (statusResult.status === 'STATUS_CANCEL') {
        const cancelEmbed = new EmbedBuilder()
          .setColor('#dc3545')
          .setTitle('🚫 Activation Cancelled')
          .setDescription('The provider cancelled this activation.')
          .setFooter({ text: 'GrizzlySMS Bot' });

        try {
          await interaction.editReply({ embeds: [cancelEmbed], components: [] });
        } catch (err) {
          console.error('Failed to edit reply:', err);
        }

        activationStore.delete(activationId);
        await logToAdmin(client, `🚫 Provider cancelled activation for **${username}** — \`${phoneNumber}\``);
        return;
      }

      if (pollCount < MAX_POLLS) {
        setTimeout(poll, POLLING_INTERVAL);
      } else {
        if (provider === '5sim') {
          await cancel5SimOrder(process.env.FIVESIM_API_KEY, activationId);
        } else if (provider === 'herosms') {
          await cancelHeroSmsOrder(process.env.HEROSMS_API_KEY, activationId);
        } else {
          await setStatus(process.env.GRIZZLY_API_KEY, activationId, -1);
        }

        const timeoutEmbed = new EmbedBuilder()
          .setColor('#ffc107')
          .setTitle('⏰ Request Timed Out')
          .setDescription('No SMS received after 20 minutes. The number has been released and you won\'t be charged.')
          .setFooter({ text: 'GrizzlySMS Bot' });

        try {
          await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        } catch (err) {
          console.error('Failed to edit reply:', err);
        }

        activationStore.delete(activationId);
        await logToAdmin(client, `⏰ **${username}** — activation timed out. Number \`${phoneNumber}\` refunded automatically.`);
      }
    } catch (err) {
      console.error('Polling error:', err);
      if (pollCount < MAX_POLLS) {
        setTimeout(poll, POLLING_INTERVAL);
      }
    }
  };

  setTimeout(poll, POLLING_INTERVAL);
}

module.exports = { startPolling, logToAdmin };
