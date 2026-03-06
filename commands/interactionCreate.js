if (interaction.isButton()) {

  if (interaction.customId === "create_ticket") {

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
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]
    });

    await channel.send(`👋 Witaj ${interaction.user}!  
Administracja wkrótce Ci pomoże.

🔒 Kliknij przycisk aby zamknąć ticket.`);
    
    await interaction.reply({ content: "Ticket utworzony!", ephemeral: true });
  }
}
