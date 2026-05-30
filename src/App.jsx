import { useEffect } from 'react';
import { socket } from './socket';
import { useGameStore } from './store/useGameStore';
import Home from './components/Home';
import GameBoard from './components/GameBoard';

function App() {
  const isMaintenanceMode = true; // Sadece burayı 'true' yapıp push'la

  if (isMaintenanceMode) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
        <h1>🛠️ Nexora Bakımda!</h1>
      </div>
    );
  }
  
  const { gameState, setGameState } = useGameStore();

  useEffect(() => {
    socket.on('gameCreated', (game) => setGameState(game));
    socket.on('updateGame', (game) => setGameState(game));
    socket.on('error', (msg) => alert(msg));
    return () => {
      socket.off('gameCreated');
      socket.off('updateGame');
      socket.off('error');
    };
  }, [setGameState]);

  if (gameState && (gameState.status === 'playing' || gameState.status === 'finished')) {
    return <GameBoard />;
  }
  return <Home />;
}
export default App;