import { create } from 'zustand';

export const useGameStore = create((set) => ({
  gameState: null,
  playerName: '',
  setPlayerName: (name) => set({ playerName: name }),
  setGameState: (state) => set({ gameState: state }),
}));