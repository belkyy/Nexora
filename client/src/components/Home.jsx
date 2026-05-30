import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';

export default function Home() {
  const { playerName, setPlayerName, gameState } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState('');

  // Auth State'leri
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // --- YENİ: SAYFA YENİLENDİĞİNDE OTURUMU HATIRLA ---
  useEffect(() => {
    const savedUser = localStorage.getItem('nexora_user');
    if (savedUser) {
      setPlayerName(savedUser);
      setIsLoggedIn(true);
    }
  }, [setPlayerName]);

  // Ortak CSS Stilleri
  const styles = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulseGlow { 0% { text-shadow: 0 0 10px rgba(250, 204, 21, 0.5); } 50% { text-shadow: 0 0 25px rgba(250, 204, 21, 1); } 100% { text-shadow: 0 0 10px rgba(250, 204, 21, 0.5); } }
    @keyframes backgroundPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    
    .glass-panel {
      background: rgba(22, 33, 62, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.6s ease-out;
    }

    .modern-input {
      width: 100%;
      padding: 1rem;
      margin-bottom: 1rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #374151;
      border-radius: 8px;
      color: white;
      font-size: 1rem;
      transition: all 0.3s;
      box-sizing: border-box;
    }
    .modern-input:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 10px rgba(96, 165, 250, 0.3); }

    .modern-btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .btn-primary { background: linear-gradient(90deg, #2563eb, #3b82f6); color: white; }
    .btn-primary:hover { background: linear-gradient(90deg, #1d4ed8, #2563eb); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4); }
    
    .btn-success { background: linear-gradient(90deg, #059669, #10b981); color: white; margin-bottom: 1rem; }
    .btn-success:hover { background: linear-gradient(90deg, #047857, #059669); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); }

    .btn-outline { background: transparent; border: 2px solid #3b82f6; color: #60a5fa; }
    .btn-outline:hover { background: rgba(59, 130, 246, 0.1); transform: translateY(-2px); }

    .btn-start { background: linear-gradient(90deg, #ca8a04, #eab308); color: #1e293b; font-size: 1.3rem; margin-top: 1.5rem; }
    .btn-start:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(234, 179, 8, 0.6); }

    .player-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid #374151;
      padding: 0.8rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: slideIn 0.3s ease-out forwards;
    }
  `;

  // Backend'e Giriş İsteği
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMessage('İşlem yapılıyor...');
    const url = isLoginMode ? 'http://localhost:3001/login' : 'http://localhost:3001/register';
    
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      
      if (data.success) {
        if (isLoginMode) {
          setPlayerName(data.username); 
          setIsLoggedIn(true); 
          setAuthMessage('');
          // --- YENİ: BAŞARILI GİRİŞTE TARAYICIYA KAYDET ---
          localStorage.setItem('nexora_user', data.username);
        } else {
          setAuthMessage('✅ Kayıt başarılı! Şimdi giriş yapabilirsiniz.'); 
          setIsLoginMode(true); 
          setPassword('');
        }
      } else { setAuthMessage(`❌ ${data.message || 'İşlem başarısız.'}`); }
    } catch (err) { setAuthMessage('❌ Sunucuya bağlanılamadı.'); }
  };

  // --- YENİ: ÇIKIŞ YAPMA FONKSİYONU ---
  const handleLogout = () => {
    localStorage.removeItem('nexora_user'); // Tarayıcıdan sil
    setIsLoggedIn(false);
    setPlayerName('');
    setUsername('');
    setPassword('');
  };

  const handleCreateGame = () => socket.emit('createGame', { playerName });
  
  const handleJoinGame = () => {
    if (!roomIdInput) return alert("Oda Kodu girin!");
    socket.emit('joinGame', { roomId: roomIdInput.toUpperCase(), playerName });
  };
  
  const handleStartGame = () => socket.emit('startGame', gameState.id);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameState.id);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- EKRAN 3: BEKLEME LOBİSİ ---
  if (gameState && gameState.status === 'waiting') {
    const isHost = gameState.host === socket.id;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #16213e, #0f172a)', backgroundSize: '400% 400%', animation: 'backgroundPan 15s ease infinite', fontFamily: 'sans-serif', color: 'white', padding: '2rem' }}>
        <style>{styles}</style>
        <div className="glass-panel" style={{ maxWidth: '500px' }}>
          <h2 style={{ textAlign: 'center', color: '#facc15', margin: '0 0 0.5rem 0', fontSize: '2rem' }}>OYUN LOBİSİ</h2>
          <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '2rem' }}>Rakiplerin gelmesini bekliyoruz...</p>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', marginBottom: '2rem', border: '1px dashed #60a5fa' }}>
            <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.5rem' }}>ODA KODU</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '5px', color: '#60a5fa' }}>{gameState.id}</span>
              <button onClick={copyToClipboard} style={{ background: copySuccess ? '#10b981' : '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.3s', fontWeight: 'bold' }}>
                {copySuccess ? 'Kopyalandı! ✅' : 'Kopyala 📋'}
              </button>
            </div>
          </div>

          <h3 style={{ color: '#e5e7eb', marginBottom: '1rem', borderBottom: '1px solid #374151', paddingBottom: '0.5rem' }}>Oyuncular ({gameState.players.length}/4)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {gameState.players.map((p, index) => (
              <div key={p.id} className="player-card">
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: p.id === gameState.host ? '#b45309' : '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {p.id === gameState.host ? '👑' : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: p.id === socket.id ? '#4ade80' : 'white', fontSize: '1.1rem' }}>
                    {p.name} {p.id === socket.id && '(Sen)'}
                  </div>
                </div>
                <div style={{ color: p.id === gameState.host ? '#fbbf24' : '#9ca3af', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {p.id === gameState.host ? 'KURUCU' : 'HAZIR'}
                </div>
              </div>
            ))}
            
            {/* Boş Slotlar */}
            {[...Array(4 - gameState.players.length)].map((_, i) => (
              <div key={`empty-${i}`} className="player-card" style={{ opacity: 0.5, border: '1px dashed #374151', background: 'transparent' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed #4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
                <div style={{ color: '#6b7280', fontStyle: 'italic' }}>Bekleniyor...</div>
              </div>
            ))}
          </div>

          {isHost ? (
            <button onClick={handleStartGame} className="modern-btn btn-start">🚀 OYUNU BAŞLAT</button>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#fbbf24', fontWeight: 'bold', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
              ⏳ Kurucunun oyunu başlatması bekleniyor...
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- EKRAN 1 VE 2: GİRİŞ YAPMA VE DASHBOARD ---
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #16213e, #0f172a)', backgroundSize: '400% 400%', animation: 'backgroundPan 15s ease infinite', fontFamily: 'sans-serif', color: 'white', padding: '2rem' }}>
      <style>{styles}</style>

      <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeIn 0.8s ease-out' }}>
        <h1 style={{ fontSize: '3.5rem', margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: '4px', animation: 'pulseGlow 3s infinite' }}>NEXORA</h1>
        <p style={{ color: '#9ca3af', fontSize: '1.2rem', marginTop: '0.5rem', letterSpacing: '2px' }}>Strateji & Borsa Oyunu</p>
      </div>

      <div className="glass-panel">
        {!isLoggedIn ? (
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#e5e7eb' }}>{isLoginMode ? 'Sisteme Giriş Yap' : 'Yeni Hesap Oluştur'}</h2>
            <input type="text" placeholder="Kullanıcı Adı" value={username} onChange={(e) => setUsername(e.target.value)} className="modern-input" required />
            <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} className="modern-input" required />
            {authMessage && <div style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', color: authMessage.includes('❌') ? '#ef4444' : '#10b981' }}>{authMessage}</div>}
            <button type="submit" className="modern-btn btn-primary">{isLoginMode ? 'GİRİŞ YAP' : 'KAYIT OL'}</button>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>
              {isLoginMode ? 'Hesabın yok mu? ' : 'Zaten bir hesabın var mı? '}
              <span onClick={() => { setIsLoginMode(!isLoginMode); setAuthMessage(''); setPassword(''); }} style={{ color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                {isLoginMode ? 'Hemen Kayıt Ol' : 'Giriş Yap'}
              </span>
            </p>
          </form>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👤</div>
              <h2 style={{ margin: 0, color: '#facc15' }}>Hoş Geldin, {playerName}!</h2>
            </div>
            <button onClick={handleCreateGame} className="modern-btn btn-success">🎮 YENİ OYUN KUR</button>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
              <span style={{ padding: '0 1rem', color: '#9ca3af', fontSize: '0.9rem' }}>VEYA KATIL</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input placeholder="Oda Kodu (Örn: A1B2C3)" value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value)} className="modern-input" style={{ marginBottom: 0, flex: 1 }} />
              <button onClick={handleJoinGame} className="modern-btn btn-outline" style={{ width: 'auto', padding: '0 1.5rem' }}>KATIL</button>
            </div>
            
            {/* --- YENİ: ÇIKIŞ YAP BUTONU --- */}
            <button onClick={handleLogout} style={{ width: '100%', marginTop: '2rem', padding: '0.8rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>🚪 Çıkış Yap</button>
          </div>
        )}
      </div>
    </div>
  );
}