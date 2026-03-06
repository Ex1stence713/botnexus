import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Nadaje ostrzeżenie użytkownikowi')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('Użytkownik do ostrzeżenia')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('powód')
      .setDescription('Powód ostrzeżenia')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('target');
  const reason = interaction.options.getString('powód');
  const warnsPath = './data/warns.json';

  let warns = {};
  if (fs.existsSync(warnsPath)) warns = JSON.parse(fs.readFileSync(warnsPath));

  if (!warns[user.id]) warns[user.id] = [];
  warns[user.id].push({ reason, date: new Date().toISOString() });

  fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));
  await interaction.reply(`⚠️ Użytkownik ${user.tag} został ostrzeżony. Powód: ${reason}`);
}
