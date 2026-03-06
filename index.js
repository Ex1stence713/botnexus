import { Client, Collection, GatewayIntentBits, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

client.commands = new Collection();

// Ticket button handling
client.on('interactionCreate', async (interaction) => {

  if (interaction.isButton()) {

    if (interaction.customId === 'create_ticket') {

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Zamknij Ticket')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `👋 Witaj ${interaction.user}`,
        components: [row]
      });

      await interaction.reply({ content: 'Ticket utworzony!', ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.channel.delete().catch(() => {});
    }
  }

});

client.login(token);
