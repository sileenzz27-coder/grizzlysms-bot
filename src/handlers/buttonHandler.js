const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getNumber, setStatus, getErrorMessage, get5SimNumber, finish5SimOrder, cancel5SimOrder, getHeroSmsNumber, finishHeroSmsOrder, cancelHeroSmsOrder, getSmspinverifyNumber, rejectSmspinverifyNumber, getSmspinverifyNumber4, rejectSmspinverifyNumber4 } = require('../utils/grizzlyAPI');
const activationStore = require('../utils/activationStore');
const { startPolling, logToAdmin } = require('../utils/polling');
const { formatPhoneNumber } = require('../utils/formatPhone');

async function handleButtonClick(interaction) {
  const customId = interaction.customId;

  if (customId === 'ig_service_1_btn') {
    const user = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    console.log(`[${new Date().toISOString()}] 📱 Requesting number for ${user.username}...`);
    const result = await getNumber(process.env.GRIZZLY_API_KEY, 'ig', '187');
    console.log(`[${new Date().toISOString()}] Result:`, result);

    if (!result.success) {
      const errorMessage = getErrorMessage(result.error);
      console.error(`[${new Date().toISOString()}] ❌ Error: ${result.error}`);
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
        { name: '📝 Next Step', value: 'Enter this number on Instagram. The SMS code will arrive here automatically (up to 20 minutes).\n\n**Copy and paste the number above on Instagram.**', inline: false }
      )
      .setFooter({ text: 'Service 1' })
      .setTimestamp();

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`num_cancel_${activationId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false);

    const row = new ActionRowBuilder().addComponents(cancelBtn);

    await interaction.editReply({ embeds: [numberEmbed], components: [row] });

    await logToAdmin(interaction.client, `📱 **${user.username}** requested a number — \`${formattedPhone}\``);

    startPolling(interaction.client, interaction, activationId, user.id, user.username, phoneNumber, 'grizzly');
    return;
  }

  if (customId === 'ig_service_2_btn') {
    const user = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    console.log(`[${new Date().toISOString()}] 🔷 Requesting 5Sims number for ${user.username}...`);
    const result = await get5SimNumber(process.env.FIVESIM_API_KEY, 'instagram');
    console.log(`[${new Date().toISOString()}] Result:`, result);

    if (!result.success) {
      const errorMessage = getErrorMessage(result.error);
      console.error(`[${new Date().toISOString()}] ❌ Error: ${result.error}`);
      await interaction.editReply({
        content: `❌ **Error**: ${errorMessage}`,
      });
      return;
    }

    const { orderId, phoneNumber } = result;

    activationStore.set(orderId, {
      userId: user.id,
      username: user.username,
      phoneNumber,
      provider: '5sim',
    });

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const numberEmbed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('📱 Your Number is Ready!')
      .addFields(
        { name: '🇺🇸 Phone Number', value: `\`${formattedPhone}\``, inline: false },
        { name: '⏳ Status', value: 'Waiting for SMS code...', inline: false },
        { name: '📝 Next Step', value: 'Enter this number on Instagram. The SMS code will arrive here automatically (up to 20 minutes).\n\n**Copy and paste the number above on Instagram.**', inline: false }
      )
      .setFooter({ text: 'Service 2' })
      .setTimestamp();

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`num_cancel_${orderId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false);

    const row = new ActionRowBuilder().addComponents(cancelBtn);

    await interaction.editReply({ embeds: [numberEmbed], components: [row] });

    await logToAdmin(interaction.client, `📱 **${user.username}** requested a number — \`${formattedPhone}\``);

    activationStore.set(`${orderId}_time`, Date.now());

    startPolling(interaction.client, interaction, orderId, user.id, user.username, phoneNumber, '5sim');
    return;
  }

  if (customId === 'ig_service_3_btn') {
    const user = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    console.log(`[${new Date().toISOString()}] 🟢 Requesting HeroSMS number for ${user.username}...`);
    const result = await getHeroSmsNumber(process.env.HEROSMS_API_KEY, 'ig', '187');
    console.log(`[${new Date().toISOString()}] Result:`, result);

    if (!result.success) {
      const errorMessage = getErrorMessage(result.error);
      console.error(`[${new Date().toISOString()}] ❌ Error: ${result.error}`);
      await interaction.editReply({
        content: `❌ **Error**: ${errorMessage}`,
      });
      return;
    }

    const { activationId, phoneNumber } = result;

    activationStore.set(activationId, {
      userId: user.id,
      username: user.username,
      phoneNumber,
      provider: 'herosms',
    });

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const numberEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('📱 Your Number is Ready!')
      .addFields(
        { name: '🇺🇸 Phone Number', value: `\`${formattedPhone}\``, inline: false },
        { name: '⏳ Status', value: 'Waiting for SMS code...', inline: false },
        { name: '📝 Next Step', value: 'Enter this number on Instagram. The SMS code will arrive here automatically (up to 20 minutes).\n\n**Copy and paste the number above on Instagram.**', inline: false }
      )
      .setFooter({ text: 'Service 3' })
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

    startPolling(interaction.client, interaction, activationId, user.id, user.username, phoneNumber, 'herosms');
    return;
  }

  if (customId === 'ig_service_4_btn') {
    const user = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    console.log(`[${new Date().toISOString()}] 🟣 Requesting Smspinverify number for ${user.username}...`);
    const result = await getSmspinverifyNumber(process.env.SMSPINVERIFY_API_KEY, 'Instagram', 'USA');
    console.log(`[${new Date().toISOString()}] Result:`, result);

    if (!result.success) {
      const errorMessage = getErrorMessage(result.error);
      console.error(`[${new Date().toISOString()}] ❌ Error: ${result.error}`);
      await interaction.editReply({
        content: `❌ **Error**: ${errorMessage}`,
      });
      return;
    }

    const { numberId, phoneNumber } = result;

    activationStore.set(numberId, {
      userId: user.id,
      username: user.username,
      phoneNumber,
      provider: 'smspinverify',
    });

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const numberEmbed = new EmbedBuilder()
      .setColor('#9370DB')
      .setTitle('📱 Your Number is Ready!')
      .addFields(
        { name: '🇺🇸 Phone Number', value: `\`${formattedPhone}\``, inline: false },
        { name: '⏳ Status', value: 'Waiting for SMS code...', inline: false },
        { name: '📝 Next Step', value: 'Enter this number on Instagram. The SMS code will arrive here automatically (up to 20 minutes).\n\n**Copy and paste the number above on Instagram.**', inline: false }
      )
      .setFooter({ text: 'Service 4' })
      .setTimestamp();

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`num_cancel_${numberId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false);

    const row = new ActionRowBuilder().addComponents(cancelBtn);

    await interaction.editReply({ embeds: [numberEmbed], components: [row] });

    await logToAdmin(interaction.client, `📱 **${user.username}** requested a number — \`${formattedPhone}\``);

    activationStore.set(`${numberId}_time`, Date.now());

    startPolling(interaction.client, interaction, numberId, user.id, user.username, phoneNumber, 'smspinverify');
    return;
  }

  if (customId === 'ig_service_5_btn') {
    const user = interaction.user;

    await interaction.deferReply({ ephemeral: true });

    console.log(`[${new Date().toISOString()}] 🟠 Requesting Smspinverify Instagram 4 number for ${user.username}...`);
    const result = await getSmspinverifyNumber4(process.env.SMSPINVERIFY_API_KEY, 'USA');
    console.log(`[${new Date().toISOString()}] Result:`, result);

    if (!result.success) {
      const errorMessage = getErrorMessage(result.error);
      console.error(`[${new Date().toISOString()}] ❌ Error: ${result.error}`);
      await interaction.editReply({
        content: `❌ **Error**: ${errorMessage}`,
      });
      return;
    }

    const { numberId, phoneNumber } = result;

    activationStore.set(numberId, {
      userId: user.id,
      username: user.username,
      phoneNumber,
      provider: 'smspinverify4',
    });

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const numberEmbed = new EmbedBuilder()
      .setColor('#FF8C00')
      .setTitle('📱 Your Number is Ready!')
      .addFields(
        { name: '🇺🇸 Phone Number', value: `\`${formattedPhone}\``, inline: false },
        { name: '⏳ Status', value: 'Waiting for SMS code...', inline: false },
        { name: '📝 Next Step', value: 'Enter this number on Instagram. The SMS code will arrive here automatically (up to 20 minutes).\n\n**Copy and paste the number above on Instagram.**', inline: false }
      )
      .setFooter({ text: 'Service 5' })
      .setTimestamp();

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`num_cancel_${numberId}`)
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(false);

    const row = new ActionRowBuilder().addComponents(cancelBtn);

    await interaction.editReply({ embeds: [numberEmbed], components: [row] });

    await logToAdmin(interaction.client, `📱 **${user.username}** requested a number — \`${formattedPhone}\``);

    activationStore.set(`${numberId}_time`, Date.now());

    startPolling(interaction.client, interaction, numberId, user.id, user.username, phoneNumber, 'smspinverify4');
    return;
  }

  if (customId.startsWith('num_cancel_')) {
    const activationId = customId.replace('num_cancel_', '');
    const activation = activationStore.get(activationId);

    if (!activation) {
      await interaction.reply({
        content: '❌ Activation not found.',
        ephemeral: true,
      });
      return;
    }

    const startTime = activationStore.get(`${activationId}_time`);
    const elapsed = Date.now() - startTime;
    const secondsElapsed = Math.floor(elapsed / 1000);

    if (secondsElapsed < 120) {
      const secondsLeft = 120 - secondsElapsed;
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      await interaction.reply({
        content: `⏳ You must wait ${mins}:${secs.toString().padStart(2, '0')} before cancelling.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferUpdate();

    try {
      if (activation.provider === '5sim') {
        await cancel5SimOrder(process.env.FIVESIM_API_KEY, activationId);
      } else if (activation.provider === 'herosms') {
        await cancelHeroSmsOrder(process.env.HEROSMS_API_KEY, activationId);
      } else if (activation.provider === 'smspinverify') {
        await rejectSmspinverifyNumber(process.env.SMSPINVERIFY_API_KEY, activationId, activation.phoneNumber);
      } else if (activation.provider === 'smspinverify4') {
        await rejectSmspinverifyNumber4(process.env.SMSPINVERIFY_API_KEY, activationId, activation.phoneNumber);
      } else {
        await setStatus(process.env.GRIZZLY_API_KEY, activationId, -1);
      }

      const cancelEmbed = new EmbedBuilder()
        .setColor('#dc3545')
        .setTitle('❌ Number Released')
        .setDescription('No charges applied.')
        .setFooter({ text: 'Service' });

      await interaction.editReply({ embeds: [cancelEmbed], components: [] });

      activationStore.delete(activationId);
      await logToAdmin(interaction.client, `❌ **${activation.username}** cancelled number \`${activation.phoneNumber}\``);
    } catch (err) {
      console.error('Failed to cancel activation:', err);
      await interaction.editReply({
        content: '❌ Failed to cancel. Please try again.',
      });
    }
    return;
  }

  if (customId.startsWith('num_use_')) {
    const activationId = customId.replace('num_use_', '');
    const activation = activationStore.get(activationId);

    if (!activation) {
      await interaction.reply({
        content: '❌ Activation not found.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferUpdate();

    try {
      if (activation.provider === '5sim') {
        await finish5SimOrder(process.env.FIVESIM_API_KEY, activationId);
      } else if (activation.provider === 'herosms') {
        await finishHeroSmsOrder(process.env.HEROSMS_API_KEY, activationId);
      } else if (activation.provider === 'smspinverify') {
        // Smspinverify numbers auto-complete after code confirmation
      } else {
        await setStatus(process.env.GRIZZLY_API_KEY, activationId, 6);
      }

      const completeEmbed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Complete!')
        .setDescription('Registration successful.')
        .setFooter({ text: 'Service' });

      await interaction.editReply({ embeds: [completeEmbed], components: [] });

      activationStore.delete(activationId);
      await logToAdmin(interaction.client, `✅ **${activation.username}** successfully completed registration with \`${activation.phoneNumber}\``);
    } catch (err) {
      console.error('Failed to complete activation:', err);
      await interaction.editReply({
        content: '❌ Failed to complete. Please try again.',
      });
    }
  }
}

module.exports = { handleButtonClick };
