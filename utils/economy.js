import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'economy.json');

// Domyślna struktura konta użytkownika
const defaultUser = {
    coins: 100,
    dailyStreak: 0,
    lastDaily: null,
    totalEarned: 0,
    totalSpent: 0,
    inventory: [],
    createdAt: Date.now()
};

// Załaduj dane ekonomii z pliku
function loadEconomy() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Błąd ładowania ekonomii:', err);
    }
    return {};
}

// Zapisz dane ekonomii do pliku
function saveEconomy(data) {
    try {
        // Upewnij się że katalog istnieje
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Błąd zapisywania ekonomii:', err);
    }
}

// Pobierz lub utwórz konto użytkownika
export function getUser(userId) {
    const economy = loadEconomy();
    if (!economy[userId]) {
        economy[userId] = { ...defaultUser };
        saveEconomy(economy);
    }
    return economy[userId];
}

// Zapisz dane użytkownika
export function setUser(userId, userData) {
    const economy = loadEconomy();
    economy[userId] = userData;
    saveEconomy(economy);
}

// Dodaj monety użytkownikowi
export function addCoins(userId, amount) {
    const economy = loadEconomy();
    if (!economy[userId]) {
        economy[userId] = { ...defaultUser };
    }
    economy[userId].coins += amount;
    economy[userId].totalEarned += amount;
    saveEconomy(economy);
    return economy[userId];
}

// Odejmij monety użytkownikowi
export function removeCoins(userId, amount) {
    const economy = loadEconomy();
    if (!economy[userId]) {
        economy[userId] = { ...defaultUser };
    }
    economy[userId].coins = Math.max(0, economy[userId].coins - amount);
    economy[userId].totalSpent += amount;
    saveEconomy(economy);
    return economy[userId];
}

// Sprawdź czy użytkownik może odebrać daily
export function canClaimDaily(userId) {
    const user = getUser(userId);
    if (!user.lastDaily) return true;
    
    const lastClaim = new Date(user.lastDaily);
    const now = new Date();
    const diffMs = now - lastClaim;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours >= 24;
}

// Aktualizuj streak daily
export function updateDailyStreak(userId) {
    const user = getUser(userId);
    const now = new Date();
    
    if (!user.lastDaily) {
        user.dailyStreak = 1;
    } else {
        const lastClaim = new Date(user.lastDaily);
        const diffMs = now - lastClaim;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours >= 24 && diffHours < 48) {
            user.dailyStreak += 1;
        } else if (diffHours >= 48) {
            user.dailyStreak = 1;
        }
    }
    
    user.lastDaily = now.toISOString();
    setUser(userId, user);
    return user;
}

// Dodaj przedmiot do ekwipunku
export function addItem(userId, item) {
    const user = getUser(userId);
    user.inventory.push(item);
    setUser(userId, user);
    return user;
}

// Pobierz wszystkich użytkowników posortowanych po monetach
export function getLeaderboard() {
    const economy = loadEconomy();
    return Object.entries(economy)
        .map(([id, data]) => ({ userId: id, ...data }))
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 10);
}

export default {
    getUser,
    setUser,
    addCoins,
    removeCoins,
    canClaimDaily,
    updateDailyStreak,
    addItem,
    getLeaderboard
};
