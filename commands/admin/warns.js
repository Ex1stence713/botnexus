import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const name = 'warn';
export const description = 'Nadaje ostrzeżenie użytkownikowi';

export async function execute(message, args) {
    if (!message.member?.permissions.has('ModerateMembers')) {
        return message.reply('Nie masz uprawnień do dawania ostrzeżeń!');
    }
    
    if (args.length < 2) {
        return message.reply('Podaj użytkownika i powód! Użycie: !warn <@użytkownik> <powód>');
    }
    
    const userId = args[0].replace(/<@!?/g, '').replace(/>/g, '');
    const reason = args.slice(1).join(' ');
    
    const warnsPath = path.join(__dirname, '..', '..', 'data', 'warns.json');

    let warns = {};
    if (fs.existsSync(warnsPath)) warns = JSON.parse(fs.readFileSync(warnsPath, 'utf8'));

    if (!warns[userId]) warns[userId] = [];
    warns[userId].push({ reason, date: new Date().toISOString(), by: message.author.tag });

    fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));
    
    try {
        const user = await message.client.users.fetch(userId);
        await message.reply(`⚠️ Użytkownik ${user.tag} został ostrzeżony. Powód: ${reason}`);
    } catch (e) {
        await message.reply(`⚠️ Użytkownik (ID: ${userId}) został ostrzeżony. Powód: ${reason}`);
    }
}
