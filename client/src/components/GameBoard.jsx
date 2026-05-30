import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { socket } from '../socket';

export default function GameBoard() {
  const { gameState, playerName, setPlayerName } = useGameStore(); // setPlayerName eklendi
  const [timeLeft, setTimeLeft] = useState(30);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notification, setNotification] = useState('');
  
  // Ayarlar Modalı için State'ler
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');
  
  const myPlayer = gameState?.players?.find(p => p.id === socket.id);

  useEffect(() => {
    socket.on('timerUpdate', (time) => setTimeLeft(time));
    socket.on('notify', (msg) => { setNotification(msg); setTimeout(() => setNotification(''), 5000); });
    return () => { socket.off('timerUpdate'); socket.off('notify'); };
  }, []);

  const handleTakeLoan = (type) => { socket.emit('takeLoan', { roomId: gameState.id, type }); setShowLoanModal(false); };
  const handleUsePower = (powerId, index) => { if(!myPlayer.isBankrupt) socket.emit('useSpecialPower', { roomId: gameState.id, powerId, index }); };

  // Profil Güncelleme Fonksiyonu
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSettingsMsg('İşlem yapılıyor...');
    
    if (!currentPassword) {
      return setSettingsMsg('❌ Güvenlik için mevcut şifrenizi girmelisiniz!');
    }

    try {
      const res = await fetch('http://localhost:3001/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUsername: playerName, currentPassword, newUsername, newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        setSettingsMsg('✅ Başarıyla güncellendi!');
        if (newUsername && newUsername !== playerName) {
          setPlayerName(data.newUsername);
          // Oyundaki adımızı anında değiştirmek için sunucuya haber ver
          socket.emit('updatePlayerName', { roomId: gameState.id, newName: data.newUsername });
        }
        // Kutuları temizle
        setCurrentPassword(''); setNewUsername(''); setNewPassword('');
      } else {
        setSettingsMsg(`❌ ${data.message}`);
      }
    } catch (err) {
      setSettingsMsg('❌ Sunucuya ulaşılamadı.');
    }
  };

  if (!gameState || !gameState.players) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: 'white' }}><h1>Veriler yükleniyor...</h1></div>;
  }
  if (!myPlayer) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: 'white' }}><p>Kullanıcı bulunamadı, bekleniyor...</p></div>;

  const assetLabels = {
    dolar: { icon: '💵', name: 'Dolar', color: '#86efac' },
    euro: { icon: '💶', name: 'Euro', color: '#6ee7b7' },
    altin: { icon: '💰', name: 'Altın', color: '#fde047' },
    gumus: { icon: '🥈', name: 'Gümüş', color: '#e5e7eb' },
    bitcoin: { icon: '🪙', name: 'Bitcoin', color: '#f59e0b' },
    eth: { icon: '⟠', name: 'ETH', color: '#9ca3af' },
    nvidia: { icon: '🟩', name: 'Nvidia', color: '#4ade80' },
    apple: { icon: '🍎', name: 'Apple', color: '#f87171' }
  };

  const getNetWorth = (player) => {
    let total = player.balance;
    Object.keys(assetLabels).forEach(k => { total += (player.portfolio[k] || 0) * (gameState.market[k] || 0); });
    return total;
  };

  const estimatedBalance = getNetWorth(myPlayer);
  const profitPercentage = (((estimatedBalance - 10000) / 10000) * 100).toFixed(2);
  const sortedPlayers = [...gameState.players].sort((a, b) => getNetWorth(b) - getNetWorth(a));
  const totalPassiveIncome = myPlayer.passiveIncomes?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

  if (gameState.status === 'finished') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '4rem', color: '#facc15', marginBottom: '1rem', textShadow: '0 0 20px rgba(250, 204, 21, 0.5)' }}>🏆 OYUN BİTTİ! 🏆</h1>
        <p style={{ fontSize: '1.2rem', color: '#9ca3af', marginBottom: '3rem' }}>Son Kalan veya Süreyi Dolduran Şampiyon Belli Oldu!</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '500px' }}>
          {sortedPlayers.map((p, index) => {
            const isWinner = index === 0 && !p.isBankrupt;
            const bg = isWinner ? 'linear-gradient(90deg, #ca8a04, #eab308)' : (p.isBankrupt ? '#450a0a' : '#1e293b');
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bg, padding: '1.5rem 2rem', borderRadius: '12px', border: isWinner ? '2px solid #fef08a' : 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: p.isBankrupt ? '#fca5a5' : 'white' }}>
                  {index + 1}. {p.name} {isWinner && '👑'} {p.isBankrupt && '☠️'}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: p.isBankrupt ? '#ef4444' : '#fff' }}>
                  {getNetWorth(p).toFixed(0)} ₺
                </span>
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: '3rem', padding: '1rem 2rem', backgroundColor: '#fbbf24', color: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🏠 Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const renderChange = (asset) => {
    const current = gameState.market[asset]; const previous = gameState.previousMarket?.[asset] || current;
    if (current === previous) return null;
    const changePct = (((current - previous) / previous) * 100).toFixed(2); const isPositive = current > previous;
    return <span style={{ fontSize: '0.75rem', color: isPositive ? '#4ade80' : '#f87171' }}>{isPositive ? '▲' : '▼'} %{Math.abs(changePct)}</span>;
  };

  const handleCardSelect = (cardId, isPlayable) => { 
    if (!myPlayer.selectedCard && !myPlayer.isBankrupt && isPlayable) socket.emit('selectCard', { roomId: gameState.id, cardId }); 
  };

  if (myPlayer.isBankrupt) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#450a0a', color: 'white', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '4rem', color: '#f87171' }}>İFLAS ETTİNİZ!</h1>
        <p style={{ fontSize: '1.2rem', color: '#fca5a5', marginTop: '1rem' }}>Rakiplerinin de batmasını bekleyebilirsin...</p>
        <button 
          onClick={() => { if(window.confirm("Oyundan ayrılmak istiyor musunuz?")) window.location.reload(); }}
          style={{ marginTop: '2rem', padding: '0.8rem 1.5rem', backgroundColor: 'transparent', color: '#f87171', border: '2px solid #f87171', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Çıkış Yap
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', backgroundColor: '#1a1a2e', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <style>{`::-webkit-scrollbar { display: none; }`}</style>

      {/* SOL MENÜ */}
      <div style={{ width: '270px', backgroundColor: '#16213e', borderRight: '2px solid #0f3460', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '0.8rem', borderBottom: '2px solid #0f3460', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: '#16213e', zIndex: 10 }}>
          <h2 style={{ margin: 0, color: '#facc15', fontSize: '1.1rem' }}>PİYASA EKRANI</h2>
        </div>
        <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#1f2937', padding: '0.4rem 0.6rem', borderRadius: '6px', borderLeft: '4px solid #60a5fa' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#d1d5db' }}>🏦 Günlük Faiz</span>
            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#60a5fa', marginTop: '0.2rem' }}>%{gameState.market.faiz.toFixed(2)}</span>
          </div>

          {Object.entries(assetLabels).map(([key, info]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#1f2937', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>{info.icon} {info.name}</span>
                {renderChange(key)}
              </div>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: info.color }}>{gameState.market[key].toFixed(2)} ₺</span>
            </div>
          ))}
        </div>
      </div>

      {/* ANA EKRAN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* BİLDİRİMLER */}
        {notification && <div style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', zIndex: 100, fontWeight: 'bold', animation: 'fadeIn 0.5s' }}>🔔 {notification}</div>}
        
        {/* KREDİ MODALI */}
        {showLoanModal && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: '#1f2937', padding: '2rem', borderRadius: '16px', width: '450px', textAlign: 'center', border: '2px solid #fbbf24' }}>
              <h2 style={{ color: '#fbbf24', marginBottom: '1.5rem' }}>Banka Kredisi</h2>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <button onClick={() => handleTakeLoan('small')} style={{ flex: 1, padding: '1rem', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><p style={{ margin: '0.5rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>5.000 ₺</p><small>10 Tur: -550 ₺</small></button>
                <button onClick={() => handleTakeLoan('large')} style={{ flex: 1, padding: '1rem', backgroundColor: '#be123c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><p style={{ margin: '0.5rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>10.000 ₺</p><small>10 Tur: -1.300 ₺</small></button>
              </div>
              <button onClick={() => setShowLoanModal(false)} style={{ padding: '0.5rem 2rem', backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #9ca3af', borderRadius: '4px', cursor: 'pointer' }}>İptal</button>
            </div>
          </div>
        )}

        {/* AYARLAR MODALI (GÜNCELLENDİ) */}
        {showSettingsModal && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div style={{ backgroundColor: '#1f2937', padding: '2.5rem', borderRadius: '16px', width: '380px', border: '2px solid #60a5fa', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <h2 style={{ color: '#60a5fa', marginBottom: '1.5rem', textAlign: 'center' }}>⚙️ Profil Ayarları</h2>
              
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Yeni Kullanıcı Adı (İsteğe bağlı)</label>
                  <input type="text" placeholder="Yeni Kullanıcı Adı" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ width: '100%', padding: '0.8rem', marginTop: '0.3rem', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: 'white', boxSizing: 'border-box' }} />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Yeni Şifre (İsteğe bağlı)</label>
                  <input type="password" placeholder="Yeni Şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem', marginTop: '0.3rem', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: 'white', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #374151' }}>
                  <label style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 'bold' }}>Mevcut Şifre (Değişiklik için ZORUNLU)</label>
                  <input type="password" placeholder="Mevcut Şifreniz" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '0.8rem', marginTop: '0.3rem', borderRadius: '6px', border: '1px solid #b45309', background: '#111827', color: 'white', boxSizing: 'border-box' }} />
                </div>

                {settingsMsg && <div style={{ textAlign: 'center', fontSize: '0.9rem', color: settingsMsg.includes('❌') ? '#ef4444' : '#10b981', margin: '0.5rem 0' }}>{settingsMsg}</div>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => { setShowSettingsModal(false); setSettingsMsg(''); setCurrentPassword(''); }} style={{ flex: 1, padding: '0.8rem', backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #9ca3af', borderRadius: '8px', cursor: 'pointer' }}>İptal</button>
                  <button type="submit" style={{ flex: 1, padding: '0.8rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ÜST BAR: PROFİL VE ÇIKIŞ */}
        <div style={{ padding: '0.6rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👤 <span style={{ color: '#60a5fa' }}>{myPlayer.name}</span>
            </span>
            <button onClick={() => setShowSettingsModal(true)} style={{ padding: '0.3rem 0.8rem', backgroundColor: '#374151', color: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'background 0.2s' }}>
              ⚙️ Ayarlar
            </button>
          </div>
          <button 
            onClick={() => { 
              if(window.confirm("Oyundan ayrılıp ana sayfaya dönmek istediğinize emin misiniz? Oyun bağlantınız kesilecektir.")) {
                window.location.reload(); 
              }
            }} 
            style={{ padding: '0.4rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'background 0.2s' }}>
            🏠 Ana Sayfaya Dön
          </button>
        </div>

        {/* MEVCUT ÜST BAR: SÜRE VE BİLGİ */}
        <div style={{ padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151' }}>
          <div>
            {gameState.isChaos && <div style={{ backgroundColor: '#7c3aed', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', animation: 'pulse 1s infinite', fontSize: '0.9rem' }}>⚡ KAOS MODU! (Kalan: {gameState.chaosDaysLeft} Gün)</div>}
            {myPlayer.balance < 0 && <div style={{ backgroundColor: '#b91c1c', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', marginTop: '0.3rem', animation: 'pulse 0.5s infinite', fontSize: '0.9rem' }}>⚠️ EKSİ BAKİYE! İflasa Kalan: {myPlayer.bankruptcyCountdown}</div>}
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1.1rem', fontWeight: 'bold', alignItems: 'center' }}>
            <div style={{ color: timeLeft <= 10 ? '#ef4444' : '#fbbf24', fontSize: '1.4rem' }}>⏱️ {timeLeft} sn</div>
            <div>Tur: {gameState.currentEvent} / 150</div>
          </div>
        </div>

        {/* OYUN ALANI (KARTLAR) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: myPlayer.selectedCard ? '#9ca3af' : 'white' }}>
            {myPlayer.selectedCard ? "Diğer oyuncular bekleniyor..." : "Hamleni Seç veya Pas Geç"}
          </h2>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            {gameState.currentCards.map((card, index) => {
              const isSelected = myPlayer.selectedCard?.id === card.id; 
              const isWaiting = myPlayer.selectedCard !== null; 
              
              const isSellCard = card.type.startsWith('sell');
              const hasAsset = isSellCard ? (myPlayer.portfolio[card.asset] || 0) >= 0.0001 : true;
              const hasMoney = card.cost === 0 || myPlayer.balance >= card.cost;
              
              const isPlayable = hasMoney && hasAsset;

              return (
                <div key={index} onClick={() => handleCardSelect(card.id, isPlayable)}
                  style={{ width: '190px', height: '240px', backgroundColor: isSelected ? '#0f3460' : '#1f2937', border: isSelected ? '3px solid #4ade80' : '2px solid #374151', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: isWaiting || !isPlayable ? 'not-allowed' : 'pointer', opacity: isWaiting && !isSelected ? 0.3 : (!isPlayable ? 0.4 : 1), transition: 'transform 0.2s', boxShadow: '0 8px 12px -3px rgba(0, 0, 0, 0.5)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.6rem', color: '#facc15' }}>{card.title}</h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.3', color: '#d1d5db', flex: 1 }}>{card.desc}</p>
                  
                  {isSellCard && !hasAsset && !isWaiting && (
                    <div style={{ marginTop: '0.6rem', padding: '0.3rem 0.6rem', fontSize: '0.85rem', backgroundColor: '#4b5563', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>
                      Varlık Yok
                    </div>
                  )}

                  {card.cost > 0 && !isSellCard && (
                    <div style={{ marginTop: '0.6rem', padding: '0.3rem 0.6rem', fontSize: '0.85rem', backgroundColor: hasMoney ? '#b91c1c' : '#4b5563', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>
                      Maliyet: {card.cost} ₺ {(!hasMoney && !isWaiting) && "(Yetersiz)"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {myPlayer.specialPowers.length > 0 && (
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', padding: '0.4rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#9ca3af', fontWeight: 'bold', marginRight: '0.3rem' }}>Özel Güçler:</span>
              {myPlayer.specialPowers.map((power, index) => (
                <button key={index} onClick={() => handleUsePower(power.id, index)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', backgroundColor: '#4f46e5', color: 'white', border: '1px solid #818cf8', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', transition: 'background 0.2s' }}>
                  <span>{power.icon}</span> {power.title}
                </button>
              ))}
            </div>
          )}

          {!myPlayer.selectedCard && (
            <button onClick={() => handleCardSelect('pass', true)} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#4b5563', color: 'white', border: '2px solid #9ca3af', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
              🚫 İşlem Yapmadan Pas Geç (Cezaya: {3 - myPlayer.passCount} Tur)
            </button>
          )}
        </div>

        {/* ALT BAR */}
        <div style={{ padding: '1rem', backgroundColor: '#16213e', borderTop: '2px solid #0f3460', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ minWidth: '180px' }}>
            <h3 style={{ margin: 0, color: '#9ca3af', fontSize: '0.8rem' }}>Nakit Bakiye</h3>
            <p style={{ margin: '0.2rem 0', fontSize: '1.3rem', fontWeight: 'bold', color: myPlayer.balance < 0 ? '#ef4444' : '#4ade80' }}>{myPlayer.balance.toFixed(2)} ₺</p>
            <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.75rem', color: '#d1d5db', marginTop: '0.2rem' }}>
              <span>Tahmini: <strong style={{color: 'white'}}>{estimatedBalance.toFixed(0)} ₺</strong></span>
              {totalPassiveIncome > 0 && <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Pasif: +{totalPassiveIncome}₺/t</span>}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', margin: '0 1rem', padding: '0 1rem', borderLeft: '1px solid #374151', borderRight: '1px solid #374151' }}>
            {Object.entries(assetLabels).map(([key, info]) => {
              const amount = myPlayer.portfolio[key] || 0;
              return (
                <div key={key} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{info.name}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: amount > 0 ? info.color : '#6b7280' }}>
                    {amount > 0 ? amount.toFixed(amount < 1 ? 4 : 2) : '0'}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ minWidth: '140px', textAlign: 'right' }}>
            {myPlayer.loan.active && <div style={{ marginBottom: '0.3rem', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold' }}>Kalan Borç: {myPlayer.loan.remaining} ₺</div>}
            <button onClick={() => setShowLoanModal(true)} disabled={myPlayer.hasUsedLoan} style={{ padding: '0.5rem 1rem', backgroundColor: myPlayer.hasUsedLoan ? '#374151' : '#b91c1c', color: myPlayer.hasUsedLoan ? '#9ca3af' : 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: myPlayer.hasUsedLoan ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
              {myPlayer.hasUsedLoan ? (myPlayer.loan.active ? "Ödeniyor..." : "Kredi Bitti") : "Kredi Çek (1 Hak)"}
            </button>
          </div>
        </div>
      </div>

      {/* SAĞ MENÜ (LİDERLİK TABLOSU) */}
      <div style={{ width: '250px', backgroundColor: '#16213e', borderLeft: '2px solid #0f3460', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '0.8rem', borderBottom: '2px solid #0f3460', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: '#16213e', zIndex: 10 }}><h2 style={{ margin: 0, color: '#facc15', fontSize: '1.1rem' }}>RAKİPLER</h2></div>
        <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {sortedPlayers.map((p, index) => {
            const isMe = p.id === myPlayer.id; const netWorth = getNetWorth(p, gameState);
            let statusText = '⏳ Düşünüyor'; let statusColor = '#fbbf24'; 
            if (p.isBankrupt) { statusText = '☠️ İflas'; statusColor = '#ef4444'; } else if (p.selectedCard) { statusText = '✅ Hazır'; statusColor = '#4ade80'; }
            return (
              <div key={p.id} style={{ backgroundColor: isMe ? '#0f3460' : '#1f2937', padding: '0.6rem', borderRadius: '8px', border: isMe ? '2px solid #60a5fa' : '2px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isMe ? '#60a5fa' : 'white' }}>{index + 1}. {p.name} {index === 0 && !p.isBankrupt && '👑'}</span>
                  <span style={{ fontSize: '0.7rem', color: statusColor, fontWeight: 'bold' }}>{statusText}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#d1d5db' }}>
                  <span>Servet:</span><span style={{ fontWeight: 'bold', color: p.isBankrupt ? '#ef4444' : '#4ade80' }}>{netWorth.toFixed(0)} ₺</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}