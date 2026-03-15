import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('control')
  .setDescription('Zarządzanie botem (restart, wyłączenie)')
  .addStringOption(option =>
    option.setName('akcja')
      .setDescription('Wybierz akcję')
      .setRequired(true)
      .addChoices(
        { name: 'Restart', value: 'restart' },
        { name: 'Wyłącz', value: 'stop' },
        { name: 'Włącz', value: 'start' }
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const action = interaction.options.getString('akcja');

  if (action === 'restart') {
    await interaction.reply({ content: '♻️ Restartuję bota...', ephemeral: true });
    
    setTimeout(async () => {
      try {
        await interaction.client.destroy();
      } catch (err) {
        console.error('Błąd przy zamykaniu klienta:', err);
      }
      process.exit(0);
    }, 1000);

  } else if (action === 'stop') {
    await interaction.reply({ content: '🛑 Wyłączam bota...', ephemeral: true });
    
    setTimeout(async () => {
      try {
        await interaction.client.destroy();
      } catch (err) {
        console.error('Błąd przy zamykaniu klienta:', err);
      }
      process.exit(0);
    }, 1000);

  } else if (action === 'start') {
    await interaction.reply({ content: '⚠️ Bot musi być uruchomiony zewnętrznie! Użyj swojego menedżera procesów (np. PM2, nodemon).', ephemeral: true });
  }
}
