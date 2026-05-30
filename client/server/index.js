const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// --- AUTH SİSTEMİ ---
const fs = require('fs');
const path = require('path');

// --- KALICI VERİTABANI (JSON SİSTEMİ) ---
const dbPath = path.join(__dirname, 'users.json');

// Eğer users.json yoksa oluştur, varsa içindeki verileri oku
let users = [];
if (fs.existsSync(dbPath)) {
    users = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} else {
    fs.writeFileSync(dbPath, JSON.stringify([]));
}

// Veritabanını (Dosyayı) Güncelleme Fonksiyonu
const saveDatabase = () => {
    fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
};

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) return res.status(400).json({ message: "Kullanıcı mevcut" });
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    saveDatabase(); // Yeni kullanıcıyı dosyaya kaydet
    res.json({ success: true });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ success: true, username });
    } else {
        res.status(401).json({ message: "Hatalı giriş" });
    }
});

app.post('/update-profile', async (req, res) => {
    const { currentUsername, currentPassword, newUsername, newPassword } = req.body;
    const user = users.find(u => u.username === currentUsername);
    
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ success: false, message: "Mevcut şifreniz hatalı!" });
    }

    if (newUsername && newUsername !== currentUsername) {
        if (users.find(u => u.username === newUsername)) return res.status(400).json({ success: false, message: "Bu kullanıcı adı zaten alınmış!" });
        user.username = newUsername;
    }

    if (newPassword) user.password = await bcrypt.hash(newPassword, 10);
    
    saveDatabase(); // Değişiklikleri dosyaya kaydet
    res.json({ success: true, newUsername: user.username });
});

// --- OYUN MANTIĞI ---
const ASSET_KEYS = ['dolar', 'euro', 'altin', 'gumus', 'bitcoin', 'eth', 'nvidia', 'apple'];
const volatility = { dolar: 0.005, euro: 0.005, altin: 0.05, gumus: 0.05, bitcoin: 0.10, eth: 0.10, nvidia: 0.07, apple: 0.05 };

const getDynamicCards = () => {
  const strategyCards = [
    { id: 'halka_arz', title: 'Halka Arz (IPO)', desc: '500 ₺ yatır. %60 şansla 2x, %30 0x, %10 1x.', type: 'ipo', cost: 500 },
    { id: 'faiz_bagla', title: 'Banka Faizi', desc: 'Tüm nakit bakiyeni günlük faiz oranında değerlendir.', type: 'interest', cost: 0 },
    { id: 'ev_al', title: 'Ev Al & Kirala', desc: '1000 ₺ öde. 15 tur boyunca kasanıza her tur +100 ₺ yatsın.', type: 'passive', cost: 1000 },
    { id: 'tahvil_al', title: 'Devlet Tahvili', desc: '1500 ₺ öde. 20 tur boyunca garanti +100 ₺ pasif gelir elde et.', type: 'passive', cost: 1500 },
    { id: 'temettu', title: 'Temettü Günü', desc: 'Elindeki Apple ve Nvidia hisselerinin güncel değerinin %10\'unu nakit al.', type: 'dividend', cost: 0 },
    { id: 'blackjack', title: 'BlackJack Masası', desc: '500 ₺ ile oyna. (%10: 3x, %20: 2x, %30: 1x, %40: 0x)', type: 'gamble', cost: 500 }
  ];

  const assets = [
    { id: 'dolar', name: 'Dolar' }, { id: 'euro', name: 'Euro' }, { id: 'altin', name: 'Altın' }, { id: 'gumus', name: 'Gümüş' },
    { id: 'bitcoin', name: 'Bitcoin' }, { id: 'eth', name: 'Ethereum' }, { id: 'nvidia', name: 'Nvidia' }, { id: 'apple', name: 'Apple' }
  ];

  let buyCards = [];
  let otherAssetCards = [];

  assets.forEach(a => {
    buyCards.push({ id: `buy_${a.id}`, title: `${a.name} Al`, desc: `1000 ₺ karşılığında ${a.name} al.`, type: 'buy', asset: a.id, cost: 1000 });
    otherAssetCards.push({ id: `sell_${a.id}`, title: `${a.name} Bozdur (%50)`, desc: `Elindeki ${a.name} miktarının %50'sini sat.`, type: 'sell', asset: a.id, cost: 0 });
    otherAssetCards.push({ id: `sell_all_${a.id}`, title: `${a.name} Hepsini Sat`, desc: `Elindeki tüm ${a.name} miktarını sat.`, type: 'sell_all', asset: a.id, cost: 0 });
  });

  const randomStrategy = strategyCards[Math.floor(Math.random() * strategyCards.length)];
  const randomBuy = buyCards[Math.floor(Math.random() * buyCards.length)];
  const allRemainingAssets = [...buyCards.filter(c => c.id !== randomBuy.id), ...otherAssetCards];
  const randomSecondAsset = allRemainingAssets[Math.floor(Math.random() * allRemainingAssets.length)];

  return [randomStrategy, randomBuy, randomSecondAsset].sort(() => 0.5 - Math.random());
};

const specialPowerPool = [
  { id: 'tesvik', icon: '💰', title: 'Teşvik (+1500 ₺)' },
  { id: 'sabotaj', icon: '🕵️', title: 'Liderden Çal' },
  { id: 'kalkan', icon: '🛡️', title: 'Pas Sayacını Sıfırla' }
];

const getNetWorth = (player, game) => {
  let total = player.balance;
  ASSET_KEYS.forEach(k => { total += (player.portfolio[k] || 0) * (game.market[k] || 0); });
  return total;
};

const games = {};
const intervals = {}; 

const executeTurn = (roomId) => {
  const game = games[roomId];
  if (!game) return;

  clearInterval(intervals[roomId]);
  const assetCounts = {};

  if (game.currentEvent % 30 === 0 && !game.isChaos) {
    game.isChaos = true; game.chaosDaysLeft = 3; game.preChaosInterest = game.market.faiz; game.market.faiz = 10; 
    game.chaosTrends = {};
    ASSET_KEYS.forEach(k => { game.chaosTrends[k] = Math.random() < 0.70 ? -1 : 1; });
    io.to(roomId).emit('notify', "🚨 KAOS BAŞLADI! Piyasalar 3 gün boyunca çalkalanacak!");
  }

  if (game.currentEvent % 5 === 0) {
    game.players.forEach(p => {
      if (!p.isBankrupt) p.specialPowers.push(specialPowerPool[Math.floor(Math.random() * specialPowerPool.length)]);
    });
    io.to(roomId).emit('notify', "🎁 5. Tur Hediyesi: Herkese Özel Güç verildi!");
  }

  game.players.forEach(p => {
    if (p.isBankrupt) return;

    if (p.loan.active) {
      p.balance -= p.loan.installment; p.loan.remaining -= p.loan.installment;
      if (p.loan.remaining <= 0) { p.loan.active = false; io.to(p.id).emit('notify', "Krediyi ödediğiniz için teşekkür ederiz!"); }
    }

    let turnPassiveIncome = 0;
    p.passiveIncomes = p.passiveIncomes.filter(inc => {
      p.balance += inc.amount; turnPassiveIncome += inc.amount; inc.remainingTurns -= 1;
      return inc.remainingTurns > 0;
    });
    if(turnPassiveIncome > 0) io.to(p.id).emit('notify', `💸 Pasif Gelir: Kasanıza +${turnPassiveIncome} ₺ yattı.`);

    if (!p.selectedCard) {
      const affordableCards = game.currentCards.filter(c => c.cost === 0 || p.balance >= c.cost);
      p.selectedCard = affordableCards.length > 0 ? affordableCards[Math.floor(Math.random() * affordableCards.length)] : { id: 'pass', type: 'pass' };
    }

    const c = p.selectedCard;

    if (c.type === 'pass') {
      p.passCount += 1;
      if (p.passCount >= 3) {
        let totalSoldValue = 0;
        ASSET_KEYS.forEach(asset => {
          const sellAmount = p.portfolio[asset] * 0.10; p.portfolio[asset] -= sellAmount; totalSoldValue += sellAmount * game.market[asset];
        });
        p.balance += totalSoldValue; p.balance -= (totalSoldValue / 2); 
        io.to(p.id).emit('notify', "⚠️ 3 Tur işlem yapmadığınız için varlıklarınızın %10'u satıldı ve vergi kesildi!");
        p.passCount = 0; 
      }
    } else {
      p.passCount = 0; 
      if ((c.type === 'buy' || c.type === 'ipo' || c.type === 'gamble' || c.type === 'passive') && p.balance >= c.cost) p.balance -= c.cost;

      if (c.type === 'interest') {
        const interestEarned = p.balance * (game.market.faiz / 100); p.balance += interestEarned;
        io.to(p.id).emit('notify', `Faiz getirisi: +${interestEarned.toFixed(2)} ₺`);
      } 
      else if (c.type === 'passive') {
        if(c.id === 'ev_al') {
          p.passiveIncomes.push({ type: 'ev', amount: 100, remainingTurns: 15 });
          io.to(p.id).emit('notify', '🏠 Ev alındı! 15 tur boyunca +100 ₺.');
        } else if (c.id === 'tahvil_al') {
          p.passiveIncomes.push({ type: 'tahvil', amount: 100, remainingTurns: 20 });
          io.to(p.id).emit('notify', '📜 Tahvil alındı! 20 tur boyunca +100 ₺.');
        }
      }
      else if (c.type === 'dividend') {
        const div = ((p.portfolio.nvidia || 0) * game.market.nvidia + (p.portfolio.apple || 0) * game.market.apple) * 0.10;
        p.balance += div;
        io.to(p.id).emit('notify', `📊 Temettü ödemesi: Kasanıza +${div.toFixed(2)} ₺ yattı.`);
      }
      else if (c.type === 'gamble') {
        const roll = Math.random();
        if (roll < 0.10) { p.balance += c.cost * 3; io.to(p.id).emit('notify', '🎰 JACKPOT! (3x)'); }
        else if (roll < 0.30) { p.balance += c.cost * 2; io.to(p.id).emit('notify', '🎲 İkiye katladın (2x).'); }
        else if (roll < 0.60) { p.balance += c.cost; io.to(p.id).emit('notify', '🃏 Paranı kurtardın (1x).'); }
        else { io.to(p.id).emit('notify', '💸 Kasa kazandı! (0x).'); }
      }
      else if (c.type === 'ipo') {
        const roll = Math.random();
        if (roll < 0.60) { p.balance += 1000; io.to(p.id).emit('notify', '🎉 Halka Arz tavan yaptı! (2x)'); } 
        else if (roll < 0.90) { io.to(p.id).emit('notify', '📉 Halka Arz çöktü! (0x)'); } 
        else { p.balance += 500; io.to(p.id).emit('notify', '⚖️ Halka Arz yatay seyretti (1x).'); }
      }
      else if (c.type === 'buy') {
        const amountObtained = c.cost / game.market[c.asset]; p.portfolio[c.asset] = (p.portfolio[c.asset] || 0) + amountObtained; assetCounts[c.asset] = (assetCounts[c.asset] || 0) + 1;
      } 
      else if (c.type.startsWith('sell')) {
        const fraction = c.type === 'sell_all' ? 1 : 0.5;
        const sellAmount = p.portfolio[c.asset] * fraction; 
        const revenue = sellAmount * game.market[c.asset]; 
        
        p.portfolio[c.asset] -= sellAmount; 
        p.balance += revenue;

        io.to(p.id).emit('notify', `💵 Satış Başarılı: +${revenue.toFixed(2)} ₺`);

        if (revenue >= 2000) {
          game.market[c.asset] = Math.max(0.01, +(game.market[c.asset] * 0.995).toFixed(2));
          io.to(roomId).emit('notify', `📉 PİYASA HABERİ: ${p.name} yüklü miktarda ${c.asset.toUpperCase()} sattı! Fiyat %0.5 düştü.`);
        }
      }
    }
    p.selectedCard = null;
    if (p.balance < 0) {
      p.bankruptcyCountdown -= 1; if (p.bankruptcyCountdown <= 0) { p.isBankrupt = true; io.to(p.id).emit('notify', "İFLAS ETTİNİZ!"); }
    } else { p.bankruptcyCountdown = 5; }
  });

  game.previousMarket = { ...game.market };

  if (game.isChaos) {
    game.market.dolar = +(game.market.dolar * (1 + (Math.random() * 0.03))).toFixed(2); 
    game.market.euro = +(game.market.euro * (1 + (Math.random() * 0.03))).toFixed(2); 
    ASSET_KEYS.forEach(asset => {
      if(asset !== 'dolar' && asset !== 'euro') {
        const move = Math.random() * 0.15 + 0.05; game.market[asset] = Math.max(0.01, +(game.market[asset] * (1 + (game.chaosTrends[asset] * move))).toFixed(2));
      }
    });
    game.chaosDaysLeft -= 1;
    if (game.chaosDaysLeft <= 0) { game.isChaos = false; game.market.faiz = game.preChaosInterest; io.to(roomId).emit('notify', "✅ Kaos sona erdi."); }
  } else {
    ASSET_KEYS.forEach(asset => {
      let maxChange = volatility[asset]; let change = (Math.random() * (maxChange * 2)) - maxChange; 
      if (assetCounts[asset] >= 2) change += (Math.random() * 0.02) + 0.005; 
      game.market[asset] = Math.max(0.01, +(game.market[asset] * (1 + change)).toFixed(2));
    });
    let fChange = (Math.random() * 0.1) - 0.05; 
    game.market.faiz = Math.max(0.7, Math.min(3.0, +(game.market.faiz + fChange).toFixed(2)));
  }

  game.currentEvent += 1; 

  const activeCount = game.players.filter(p => !p.isBankrupt).length;
  const isLastManStanding = game.players.length > 1 && activeCount <= 1;
  const isEveryoneDead = activeCount === 0;

  if (game.currentEvent > 150 || isLastManStanding || isEveryoneDead) {
    game.status = 'finished';
    io.to(roomId).emit('updateGame', game);
    return;
  }

  game.currentCards = getDynamicCards(); 
  io.to(roomId).emit('updateGame', game); 
  startTimer(roomId);
};

const startTimer = (roomId) => {
  const game = games[roomId]; if (!game || game.status === 'finished') return;
  clearInterval(intervals[roomId]); game.timeLeft = 30; io.to(roomId).emit('timerUpdate', game.timeLeft); 
  intervals[roomId] = setInterval(() => { game.timeLeft -= 1; io.to(roomId).emit('timerUpdate', game.timeLeft); if (game.timeLeft <= 0) executeTurn(roomId); }, 1000);
};

const initialMarket = { 
  faiz: 1.0, dolar: 45, euro: 55, altin: 6000, gumus: 100, 
  bitcoin: 70000, eth: 2100, nvidia: 200, apple: 450
};

io.on('connection', (socket) => {
  socket.on('createGame', (data) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    games[roomId] = {
      id: roomId, host: socket.id, status: 'waiting', currentEvent: 1, timeLeft: 30,
      isChaos: false, chaosDaysLeft: 0, preChaosInterest: 1, chaosTrends: {},
      market: { ...initialMarket }, previousMarket: { ...initialMarket }, currentCards: [], 
      players: [{ id: socket.id, name: data.playerName, balance: 10000, portfolio: { dolar: 0, euro: 0, altin: 0, gumus: 0, bitcoin: 0, eth: 0, nvidia: 0, apple: 0 }, selectedCard: null, loan: { active: false, remaining: 0, installment: 0 }, hasUsedLoan: false, bankruptcyCountdown: 5, isBankrupt: false, passCount: 0, specialPowers: [], passiveIncomes: [] }]
    };
    socket.join(roomId); socket.emit('gameCreated', games[roomId]);
  });

  socket.on('joinGame', (data) => {
    const { roomId, playerName } = data; 
    const game = games[roomId];
    
    // 1. Oyun yoksa hata ver
    if (!game) {
      return socket.emit('error', '❌ Hata: Böyle bir oda bulunamadı! Kodu kontrol edin.');
    }
    // 2. Oyun bekleme modunda değilse (çoktan başladıysa)
    if (game.status !== 'waiting') {
      return socket.emit('error', '❌ Hata: Bu oyun zaten başlamış veya bitmiş!');
    }
    // 3. Oda kontenjanı doluysa
    if (game.players.length >= 4) {
      return socket.emit('error', '❌ Hata: Bu oda tamamen dolu (4/4)!');
    }

    // 4. (YENİ) Eğer oyuncu bağlantısı kopup aynı isimle tekrar girmeye çalışıyorsa
    const existingPlayer = game.players.find(p => p.name === playerName);
    if (existingPlayer) {
      existingPlayer.id = socket.id; // Eski hesabın socket ID'sini yenisiyle güncelle
      socket.join(roomId);
      return io.to(roomId).emit('updateGame', game);
    }

    // 5. Her şey sorunsuzsa yeni oyuncuyu odaya ekle
    game.players.push({ 
      id: socket.id, 
      name: playerName, 
      balance: 10000, 
      portfolio: { dolar: 0, euro: 0, altin: 0, gumus: 0, bitcoin: 0, eth: 0, nvidia: 0, apple: 0 }, 
      selectedCard: null, 
      loan: { active: false, remaining: 0, installment: 0 }, 
      hasUsedLoan: false, 
      bankruptcyCountdown: 5, 
      isBankrupt: false, 
      passCount: 0, 
      specialPowers: [], 
      passiveIncomes: [] 
    });
    
    socket.join(roomId); 
    io.to(roomId).emit('updateGame', game);
  });

  socket.on('startGame', (roomId) => { const game = games[roomId]; if (game && game.host === socket.id) { game.status = 'playing'; game.currentCards = getDynamicCards(); io.to(roomId).emit('updateGame', game); startTimer(roomId); } });

  socket.on('takeLoan', ({ roomId, type }) => {
    const game = games[roomId]; if (!game) return; const player = game.players.find(p => p.id === socket.id);
    if (player && !player.hasUsedLoan && !player.isBankrupt) {
      player.hasUsedLoan = true; player.loan.active = true;
      if (type === 'small') { player.balance += 5000; player.loan.remaining = 5500; player.loan.installment = 550; } else if (type === 'large') { player.balance += 10000; player.loan.remaining = 13000; player.loan.installment = 1300; }
      io.to(roomId).emit('updateGame', game);
    }
  });

  socket.on('useSpecialPower', ({ roomId, powerId, index }) => {
    const game = games[roomId]; if (!game) return; const player = game.players.find(p => p.id === socket.id);
    if (player && !player.isBankrupt && player.specialPowers[index]?.id === powerId) {
      if (powerId === 'tesvik') { player.balance += 1500; socket.emit('notify', '💰 Teşvik! +1500 ₺'); } 
      else if (powerId === 'sabotaj') {
        const sorted = [...game.players].filter(p => !p.isBankrupt).sort((a, b) => getNetWorth(b, game) - getNetWorth(a, game));
        let t = sorted[0]; if (t.id === player.id && sorted.length > 1) t = sorted[1];
        if (t.id !== player.id) { const sAmount = Math.min(1000, t.balance); t.balance -= sAmount; player.balance += sAmount; socket.emit('notify', `🕵️ Sabotaj! ${t.name}'den ${sAmount.toFixed(2)} ₺ çaldın.`); io.to(t.id).emit('notify', `⚠️ Çalındı: ${sAmount.toFixed(2)} ₺`); }
      } 
      else if (powerId === 'kalkan') { player.passCount = 0; socket.emit('notify', '🛡️ Kalkan aktif! Pas cezan silindi.'); }
      player.specialPowers.splice(index, 1); io.to(roomId).emit('updateGame', game);
    }
  });

  socket.on('selectCard', ({ roomId, cardId }) => {
    const game = games[roomId]; if (!game) return; const player = game.players.find(p => p.id === socket.id);
    if (player && !player.selectedCard && !player.isBankrupt) {
      if (cardId === 'pass') { player.selectedCard = { id: 'pass', type: 'pass' }; } 
      else { 
        const card = game.currentCards.find(c => c.id === cardId); 
        if (!card) return;
        if (card.type.startsWith('sell')) {
          const owned = player.portfolio[card.asset] || 0;
          if (owned < 0.0001) { socket.emit('notify', `❌ Elinde hiç ${card.title.split(' ')[0]} yok!`); return; }
        }
        if (card.cost === 0 || player.balance >= card.cost) { player.selectedCard = card; } 
        else { socket.emit('notify', '❌ Yetersiz bakiye!'); return; } 
      }
      io.to(roomId).emit('updateGame', game);
      if (game.players.filter(p => !p.isBankrupt).every(p => p.selectedCard !== null)) executeTurn(roomId); 
    }
  });

  // YENİ: OYUN İÇİNDE İSİM GÜNCELLEMESİNİ YAKALAMA
  socket.on('updatePlayerName', ({ roomId, newName }) => {
    const game = games[roomId];
    if (game) {
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        player.name = newName;
        io.to(roomId).emit('updateGame', game); // Herkese yeni ismi gönder
      }
    }
  });

  // YENİ: OYUNDAN ÇIKANLARI LİSTEDEN SİLME VE LOBİ GÜNCELLEMESİ
  socket.on('disconnect', () => {
    for (const roomId in games) {
      const game = games[roomId];
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        // 1. Oyuncuyu listeden çıkar
        game.players.splice(playerIndex, 1);
        
        // 2. Eğer odada kimse kalmadıysa odayı komple sil (Sunucu belleği şişmesin)
        if (game.players.length === 0) {
          clearInterval(intervals[roomId]);
          delete games[roomId];
        } else {
          // 3. Çıkan kişi odanın "Kurucusu" ise, sıradaki ilk kişiyi yeni kurucu yap
          if (game.host === socket.id) {
            game.host = game.players[0].id;
          }

          // 4. Eğer oyun oynanıyorsa ve çıkan kişi yüzünden 1 kişi kaldıysa oyunu bitir
          const activeCount = game.players.filter(p => !p.isBankrupt).length;
          if (game.status === 'playing' && activeCount <= 1) {
            game.status = 'finished';
          }
          
          // 5. Kalan oyunculara odanın güncel (eksilmiş) halini gönder
          io.to(roomId).emit('updateGame', game);
          io.to(roomId).emit('notify', "⚠️ Bir oyuncu bağlantıyı kesti ve ayrıldı.");
        }
        break; // Oyuncuyu bulduğumuz için döngüden çık
      }
    }
  });
});

const PORT = 3001; server.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda çalışıyor...`); });