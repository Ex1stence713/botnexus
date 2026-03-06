import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionsBitField 
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Panel ticketów');

export async function execute(interaction) {

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('🎫 Utwórz Ticket')
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    content: "Kliknij przycisk aby utworzyć ticket:",
    components: [row]
  });
}
