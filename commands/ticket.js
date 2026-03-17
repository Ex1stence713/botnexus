import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const name = 'ticket';
export const description = 'Panel ticketów';

export async function execute(message, args) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('🎫 Utwórz Ticket')
            .setStyle(ButtonStyle.Primary)
    );

    await message.reply({
        content: "Kliknij przycisk aby utworzyć ticket:",
        components: [row]
    });
}
