import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('restart')
  .setDescription('Restartuje bota (wymaga uprawnień Administrator)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  // Potwierdź żądanie użytkownikowi
  await interaction.reply({ content: '♻️ Restartuję bota... (zaraz się wyłączę)', ephemeral: true });

  // Daj krótką przerwę, żeby odpowiedź mogła zostać wysłana
  setTimeout(async () => {
    try {
      // Zamknij klienta Discord (czyści połączenia websocket itp.)
      await interaction.client.destroy();
    } catch (err) {
      console.error('Błąd przy zamykaniu klienta przed restartem:', err);
    }

    // Zakończ proces. Jeśli korzystasz z procesu menedżera (pm2, systemd, docker, nodemon)
    // to on powinien usunąć proces i (opcjonalnie) go wznowić.
    process.exit(0);
  }, 1000);
}
