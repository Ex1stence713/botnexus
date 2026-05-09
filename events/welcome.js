import { EmbedBuilder } from 'discord.js';

export default {
  name: "guildMemberAdd",

  async execute(member) {
    const channelId = "1499838770365599941";
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const memberCount = member.guild.memberCount;
    const rulesChannel = member.guild.channels.cache.find(c => c.name.includes('regulamin'));
    const rulesMention = rulesChannel ? `📖 <#${rulesChannel.id}>` : '📖 Regulamin serwera';

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('👋 Witamy na serwerze!')
      .setDescription(`Cześć **${member.user.username}**! Miło Cię widzieć na naszym serwerze!\n\n${rulesMention} — zapoznaj się z zasadami, zanim zaczniesz korzystać z kanałów.`)
      .addFields(
        { name: '👥 Jesteś', value: `#${memberCount} członkiem serwera!`, inline: true },
        { name: '📅 Dołączył', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage('https://cdn.discordapp.com/attachments/1002801752290730094/1247366555843666011/welcomebanner.png?ex=6636e7bd&is=661fb0bd&hm=0f1e7a6f6b3c0b9c3c5f5a0e6c4d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2.png')
      .setFooter({ text: 'Zapraszamy do dyskusji i współpracy! 🤝' })
      .setTimestamp();

    try {
      await channel.send({ content: `<@${member.user.id}>`, embeds: [welcomeEmbed] });
    } catch (err) {
      console.error('Błąd wysyłania wiadomości powitalnej:', err);
    }

    // Wyślij wiadomość DM do nowego użytkownika
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`👋 Witaj na ${member.guild.name}!`)
        .setDescription(`Cześć **${member.user.username}**! Miło Cię widzieć na serwerze **${member.guild.name}**.\n\n📖 Pamiętaj, aby przeczytać regulamin serwera.\n💡 Jeśli potrzebujesz pomocy, nie wahaj się zapytać — nasz zespół moderatorów jest do Twojej dyspozycji.\n\nŻyczymy miłego pobytu! 🎉`)
        .setThumbnail(member.guild.iconURL({ dynamic: true, size: 256 }))
        .setFooter({ text: 'Nexus Bot • Serwer powitalny' })
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] });
    } catch (err) {
      // Użytkownik może mieć wyłączone DM — ignoruj błąd
      console.log(`Nie można wysłać DM do ${member.user.tag}`);
    }
  },
};
