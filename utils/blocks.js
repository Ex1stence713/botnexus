import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blocksFile = path.join(__dirname, '../data/blocks.json');
const inventoryFile = path.join(__dirname, '../data/inventory.json');

// Załaduj dane bloków
function loadBlocksData() {
    try {
        if (fs.existsSync(blocksFile)) {
            return JSON.parse(fs.readFileSync(blocksFile, 'utf8'));
        }
    } catch (err) {
        console.error('Błąd ładowania danych bloków:', err);
    }
    return { blocks: [], pickaxes: [], settings: {} };
}

// Załaduj ekwipunek
function loadInventory() {
    try {
        if (fs.existsSync(inventoryFile)) {
            return JSON.parse(fs.readFileSync(inventoryFile, 'utf8'));
        }
    } catch (err) {
        console.error('Błąd ładowania ekwipunku:', err);
    }
    return {};
}

// Zapisz ekwipunek
function saveInventory(inventory) {
    try {
        const dir = path.dirname(inventoryFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(inventoryFile, JSON.stringify(inventory, null, 2));
    } catch (err) {
        console.error('Błąd zapisywania ekwipunku:', err);
    }
}

// Pobierz informacje o bloku
export function getBlock(blockId) {
    const data = loadBlocksData();
    return data.blocks.find(b => b.id === blockId);
}

// Pobierz wszystkie bloki
export function getAllBlocks() {
    const data = loadBlocksData();
    return data.blocks;
}

// Pobierz wszystkie kilofy
export function getAllPickaxes() {
    const data = loadBlocksData();
    return data.pickaxes;
}

// Pobierz ustawienia
export function getSettings() {
    const data = loadBlocksData();
    return data.settings;
}

// Pobierz ekwipunek użytkownika
export function getUserInventory(userId) {
    const inventory = loadInventory();
    if (!inventory[userId]) {
        inventory[userId] = {
            blocks: {},
            pickaxe: 'wooden_pickaxe',
            totalMined: 0,
            lastMine: null
        };
        saveInventory(inventory);
    }
    return inventory[userId];
}

// Zapisz ekwipunek użytkownika
export function setUserInventory(userId, userInventory) {
    const inventory = loadInventory();
    inventory[userId] = userInventory;
    saveInventory(inventory);
}

// Dodaj blok do ekwipunku
export function addBlock(userId, blockId, amount = 1) {
    const inventory = loadInventory();
    if (!inventory[userId]) {
        inventory[userId] = {
            blocks: {},
            pickaxe: 'wooden_pickaxe',
            totalMined: 0,
            lastMine: null
        };
    }
    if (!inventory[userId].blocks[blockId]) {
        inventory[userId].blocks[blockId] = 0;
    }
    inventory[userId].blocks[blockId] += amount;
    saveInventory(inventory);
    return inventory[userId];
}

// Usuń blok z ekwipunku
export function removeBlock(userId, blockId, amount = 1) {
    const inventory = loadInventory();
    if (inventory[userId] && inventory[userId].blocks[blockId]) {
        inventory[userId].blocks[blockId] = Math.max(0, inventory[userId].blocks[blockId] - amount);
        if (inventory[userId].blocks[blockId] === 0) {
            delete inventory[userId].blocks[blockId];
        }
        saveInventory(inventory);
    }
    return inventory[userId];
}

// Sprawdź czy użytkownik ma blok
export function hasBlock(userId, blockId, amount = 1) {
    const inventory = loadInventory();
    return inventory[userId] && inventory[userId].blocks[blockId] >= amount;
}

// Wydobądź blok (losowanie)
export function mineBlock(userId) {
    const inventory = loadInventory();
    const data = loadBlocksData();
    const settings = data.settings;
    
    // Sprawdź cooldown
    if (inventory[userId] && inventory[userId].lastMine) {
        const now = Date.now();
        const lastMine = new Date(inventory[userId].lastMine).getTime();
        const cooldown = settings.mineCooldown || 5000;
        
        if (now - lastMine < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastMine)) / 1000);
            return { success: false, message: `Musisz poczekać ${remaining} sekund przed następnym kopaniem!` };
        }
    }
    
    // Pobierz aktualny kilof
    const currentPickaxeId = inventory[userId]?.pickaxe || 'wooden_pickaxe';
    const pickaxe = data.pickaxes.find(p => p.id === currentPickaxeId);
    const multiplier = pickaxe ? pickaxe.multiplier : 1;
    
    // Generowanie wag na podstawie rzadkości i mnożnika
    const blocks = data.blocks;
    const weightedBlocks = [];
    
    blocks.forEach(block => {
        // Waga = (11 - rzadkość) * mnożnik
        const weight = Math.max(1, (11 - block.rarity) * multiplier);
        for (let i = 0; i < weight; i++) {
            weightedBlocks.push(block);
        }
    });
    
    // Losuj blok
    const randomIndex = Math.floor(Math.random() * weightedBlocks.length);
    const selectedBlock = weightedBlocks[randomIndex];
    
    // Dodaj blok do ekwipunku
    const amount = settings.baseBlocksPerMine || 1;
    
    if (!inventory[userId]) {
        inventory[userId] = {
            blocks: {},
            pickaxe: 'wooden_pickaxe',
            totalMined: 0,
            lastMine: null
        };
    }
    
    if (!inventory[userId].blocks[selectedBlock.id]) {
        inventory[userId].blocks[selectedBlock.id] = 0;
    }
    inventory[userId].blocks[selectedBlock.id] += amount;
    inventory[userId].totalMined = (inventory[userId].totalMined || 0) + amount;
    inventory[userId].lastMine = new Date().toISOString();
    
    saveInventory(inventory);
    
    return {
        success: true,
        block: selectedBlock,
        amount: amount,
        pickaxe: pickaxe,
        message: `Wykopałeś ${amount}x ${selectedBlock.icon} **${selectedBlock.name}**!`
    };
}

// Kup kilof
export function buyPickaxe(userId, pickaxeId) {
    const data = loadBlocksData();
    const pickaxe = data.pickaxes.find(p => p.id === pickaxeId);
    
    if (!pickaxe) {
        return { success: false, message: 'Ten kilof nie istnieje!' };
    }
    
    const economy = require('./economy.js');
    const user = economy.getUser(userId);
    
    if (user.coins < pickaxe.price) {
        return { success: false, message: `Nie masz wystarczająco monet! Potrzebujesz ${pickaxe.price} 🪙` };
    }
    
    // Odejmij monety
    economy.removeCoins(userId, pickaxe.price);
    
    // Ustaw nowy kilof
    const inventory = loadInventory();
    if (!inventory[userId]) {
        inventory[userId] = {
            blocks: {},
            pickaxe: 'wooden_pickaxe',
            totalMined: 0,
            lastMine: null
        };
    }
    inventory[userId].pickaxe = pickaxeId;
    saveInventory(inventory);
    
    return {
        success: true,
        pickaxe: pickaxe,
        message: `Kupiłeś **${pickaxe.name}** za ${pickaxe.price} 🪙!`
    };
}

// Sprzedaj blok
export function sellBlock(userId, blockId, amount) {
    const block = getBlock(blockId);
    
    if (!block) {
        return { success: false, message: 'Ten blok nie istnieje!' };
    }
    
    if (!hasBlock(userId, blockId, amount)) {
        return { success: false, message: `Nie masz ${amount}x ${block.icon} ${block.name}!` };
    }
    
    const totalValue = block.sellPrice * amount;
    
    // Usuń blok z ekwipunku
    removeBlock(userId, blockId, amount);
    
    // Dodaj monety
    const economy = require('./economy.js');
    economy.addCoins(userId, totalValue);
    
    return {
        success: true,
        block: block,
        amount: amount,
        totalValue: totalValue,
        message: `Sprzedałeś ${amount}x ${block.icon} **${block.name}** za ${totalValue} 🪙!`
    };
}

// Kup blok
export function buyBlock(userId, blockId, amount) {
    const block = getBlock(blockId);
    
    if (!block) {
        return { success: false, message: 'Ten blok nie istnieje!' };
    }
    
    const totalCost = block.buyPrice * amount;
    
    const economy = require('./economy.js');
    const user = economy.getUser(userId);
    
    if (user.coins < totalCost) {
        return { success: false, message: `Nie masz wystarczająco monet! Potrzebujesz ${totalCost} 🪙` };
    }
    
    // Odejmij monety
    economy.removeCoins(userId, totalCost);
    
    // Dodaj blok do ekwipunku
    addBlock(userId, blockId, amount);
    
    return {
        success: true,
        block: block,
        amount: amount,
        totalCost: totalCost,
        message: `Kupiłeś ${amount}x ${block.icon} **${block.name}** za ${totalCost} 🪙!`
    };
}

// Pobierz aktualny kilof użytkownika
export function getUserPickaxe(userId) {
    const inventory = loadInventory();
    const data = loadBlocksData();
    const pickaxeId = inventory[userId]?.pickaxe || 'wooden_pickaxe';
    return data.pickaxes.find(p => p.id === pickaxeId) || data.pickaxes[0];
}

// Pobierz wartość wszystkich bloków użytkownika
export function getInventoryValue(userId) {
    const inventory = loadInventory();
    const data = loadBlocksData();
    let totalValue = 0;
    
    if (inventory[userId] && inventory[userId].blocks) {
        for (const [blockId, amount] of Object.entries(inventory[userId].blocks)) {
            const block = data.blocks.find(b => b.id === blockId);
            if (block) {
                totalValue += block.sellPrice * amount;
            }
        }
    }
    
    return totalValue;
}

export default {
    getBlock,
    getAllBlocks,
    getAllPickaxes,
    getSettings,
    getUserInventory,
    setUserInventory,
    addBlock,
    removeBlock,
    hasBlock,
    mineBlock,
    buyPickaxe,
    sellBlock,
    buyBlock,
    getUserPickaxe,
    getInventoryValue
};
