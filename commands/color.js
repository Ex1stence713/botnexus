import { EmbedBuilder } from 'discord.js';

export const name = 'color';
export const description = 'Wyświetla informacje o kolorze';

export async function execute(message, args) {
    let colorInput = args[0];
    
    if (!colorInput) {
        // Generuj losowy kolor
        const randomColor = Math.floor(Math.random() * 16777215);
        colorInput = randomColor.toString(16).padStart(6, '0');
    }
    
    // Usuń # jeśli jest
    if (colorInput.startsWith('#')) {
        colorInput = colorInput.substring(1);
    }
    
    // Sprawdź czy to prawidłowy kolor hex
    if (!/^[0-9A-Fa-f]{6}$/.test(colorInput)) {
        return message.reply('Podaj prawidłowy kolor hex! Przykład: !color #FF5733 lub !color FF5733');
    }
    
    const r = parseInt(colorInput.substring(0, 2), 16);
    const g = parseInt(colorInput.substring(2, 4), 16);
    const b = parseInt(colorInput.substring(4, 6), 16);
    
    // Konwertuj na HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
            case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
            case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
        }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    // Określ nazwę koloru
    let colorName;
    if (l < 15) colorName = 'Czarny';
    else if (l > 85) colorName = 'Biały';
    else if (s < 10) colorName = 'Szary';
    else if (h < 15 || h >= 345) colorName = 'Czerwony';
    else if (h < 45) colorName = 'Pomarańczowy';
    else if (h < 75) colorName = 'Żółty';
    else if (h < 150) colorName = 'Zielony';
    else if (h < 210) colorName = 'Cyjan';
    else if (h < 270) colorName = 'Niebieski';
    else if (h < 315) colorName = 'Fioletowy';
    else colorName = 'Różowy';
    
    const embed = new EmbedBuilder()
        .setTitle(`🎨 Kolor #${colorInput.toUpperCase()}`)
        .setColor(parseInt(colorInput, 16))
        .addFields(
            { name: '📝 Nazwa', value: colorName, inline: true },
            { name: '🔢 HEX', value: `#${colorInput.toUpperCase()}`, inline: true },
            { name: '🔢 RGB', value: `rgb(${r}, ${g}, ${b})`, inline: true },
            { name: '🔢 HSL', value: `hsl(${h}, ${s}%, ${l}%)`, inline: true }
        )
        .setFooter({ text: 'BotNexus' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
