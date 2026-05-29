import { useState } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';

export default function Home() {
  const { playerName, setPlayerName } = useGameStore();
  const [roomIdInput, setRoomIdInput] = useState('');

  const handleCreateGame = () => {
    if (!playerName) return alert("Lütfen bir isim girin!");
    socket.emit('createGame', { playerName });
  };

  const handleJoinGame = () => {
    if (!playerName || !roomIdInput) return alert("İsim ve Oda Kodu zorunludur!");
    socket.emit('joinGame', { roomId: roomIdInput.toUpperCase(), playerName });
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Borsa & Strateji Oyunu</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <input 
          placeholder="Kullanıcı Adınız" 
          value={playerName} 
          onChange={(e) => setPlayerName(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '0.5rem', fontSize: '1rem' }}
        />
      </div>

      <div style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', display: 'inline-block' }}>
        <h3>Yeni Oyun</h3>
        <button onClick={handleCreateGame} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Oyun Oluştur</button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '1rem', display: 'inline-block', marginLeft: '1rem' }}>
        <h3>Oyuna Katıl</h3>
        <input 
          placeholder="Oda Kodu" 
          value={roomIdInput} 
          onChange={(e) => setRoomIdInput(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <button onClick={handleJoinGame} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Katıl</button>
      </div>
    </div>
  );
}