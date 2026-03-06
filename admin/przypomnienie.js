import { SlashCommandBuilder } from "discord.js";

const ADMIN_ROLE_ID = "1429200328275791945"; // ID rangi administracji

export const data = new SlashCommandBuilder()
  .setName("przypomnij-admin")
  .setDescription("Przypomnienie o spotkaniu na PV do całej administracji")
  .addStringOption(option =>
    option
      .setName("data")
      .setDescription("Data spotkania (DD.MM.RRRR)")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("godzina")
      .setDescription("Godzina spotkania (HH:MM)")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("tresc")
      .setDescription("Treść przypomnienia")
      .setRequired(true)
  );

export async function execute(interaction) {
  const dateStr = interaction.options.getString("data");
  const timeStr = interaction.options.getString("godzina");
  const content = interaction.options.getString("tresc");

  const role = interaction.guild.roles.cache.get(ADMIN_ROLE_ID);
  if (!role) {
    return interaction.reply({
      content: "Nie znaleziono rangi administracji.",
      ephemeral: true
    });
  }

  const [day, month, year] = dateStr.split(".");
  const [hour, minute] = timeStr.split(":");

  const remindDate = new Date(year, month - 1, day, hour, minute);
  const delay = remindDate.getTime() - Date.now();

  if (isNaN(delay) || delay <= 0) {
    return interaction.reply({
      content: "Podano nieprawidłową datę lub godzinę.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content: `Przypomnienie dla administracji ustawione na ${dateStr} ${timeStr}.`,
    ephemeral: true
  });

  setTimeout(async () => {
    for (const member of role.members.values()) {
      try {
        await member.send(
          `📅 Przypomnienie o spotkaniu\n` +
          `🕒 ${dateStr} ${timeStr}\n\n` +
          content
        );
      } catch {
        console.log(`Nie można wysłać DM do ${member.user.tag}`);
      }
    }
  }, delay);
}
