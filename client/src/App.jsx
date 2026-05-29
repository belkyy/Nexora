import { useEffect } from 'react';
import { socket } from './socket';
import { useGameStore } from './store/useGameStore';
import Home from './components/Home';
import GameBoard from './components/GameBoard';

function App() {
  const { gameState, setGameState } = useGameStore();

  useEffect(() => {
    // Tüm oyun güncellemelerini artık tek bir event üzerinden dinliyoruz
    socket.on('gameCreated', (game) => setGameState(game));
    socket.on('updateGame', (game) => setGameState(game));
    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.off('gameCreated');
      socket.off('updateGame');
      socket.off('error');
    };
  }, [setGameState]);

  const handleStartGame = () => {
    socket.emit('startGame', gameState.id);
  };

  if (!gameState) return <Home />;

  if (gameState.status === 'playing' || gameState.status === 'finished') return <GameBoard />;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>Oda Kodu: <span style={{ color: 'red' }}>{gameState.id}</span></h2>
      <p>Bu kodu arkadaşlarınla paylaş!</p>
      
      <h3>Bekleme Odası ({gameState.players.length}/4)</h3>
      <ul>
        {gameState.players.map((p) => (
          <li key={p.id} style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>
            {p.name} {p.id === gameState.host && "(Kurucu)"}
          </li>
        ))}
      </ul>

      {socket.id === gameState.host && (
        <button onClick={handleStartGame} style={{ padding: '1rem 2rem', marginTop: '1rem', cursor: 'pointer' }}>
          Oyunu Başlat
        </button>
      )}
    </div>
  );
}

export default App;