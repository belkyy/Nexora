import { useEffect } from 'react';
import { socket } from './socket';
import { useGameStore } from './store/useGameStore';
import Home from './components/Home';
import GameBoard from './components/GameBoard';

function App() {
  const { gameState, setGameState } = useGameStore();

  useEffect(() => {
    // Tüm oyun güncellemelerini dinliyoruz
    socket.on('gameCreated', (game) => setGameState(game));
    socket.on('updateGame', (game) => setGameState(game));
    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.off('gameCreated');
      socket.off('updateGame');
      socket.off('error');
    };
  }, [setGameState]);

  // EĞER Oyun oynanıyorsa VEYA bittiyse oyun tahtasını göster
  if (gameState && (gameState.status === 'playing' || gameState.status === 'finished')) {
    return <GameBoard />;
  }

  // EĞER Oyun yoksa (giriş ekranı) VEYA bekleme modundaysa (lobi) Home'u göster
  // Çünkü yeni animasyonlu giriş ve lobi tasarımımızın ikisi de Home.jsx'in içinde!
  return <Home />;
}

export default App;