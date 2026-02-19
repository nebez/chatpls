import { getContext, setContext } from 'svelte';
import type { GameSessionStore } from './session-store';

const GAME_SESSION_CONTEXT_KEY = Symbol('game-session');

export function setGameSessionContext(store: GameSessionStore): void {
	setContext(GAME_SESSION_CONTEXT_KEY, store);
}

export function getGameSessionContext(): GameSessionStore {
	const store = getContext<GameSessionStore | undefined>(GAME_SESSION_CONTEXT_KEY);
	if (!store) {
		throw new Error('Game session context is not set');
	}

	return store;
}
