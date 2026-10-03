import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { buildAuthorizeUrl } from "./oauth";

const TOKEN_KEY = "githubq:oauth-token";

interface Session {
	token: string | null;
	login: () => Promise<void>;
	logout: () => void;
	storeToken: (token: string) => void;
}

const SessionContext = createContext<Session>({
	token: null,
	login: () => Promise.resolve(),
	logout: () => {},
	storeToken: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(() =>
		localStorage.getItem(TOKEN_KEY),
	);

	const login = useCallback(async () => {
		const { url } = await buildAuthorizeUrl();
		window.location.href = url;
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY);
		setToken(null);
	}, []);

	const storeToken = useCallback((next: string) => {
		localStorage.setItem(TOKEN_KEY, next);
		setToken(next);
	}, []);

	const value = useMemo(
		() => ({ token, login, logout, storeToken }),
		[token, login, logout, storeToken],
	);
	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	);
}

export function useSession(): Session {
	return useContext(SessionContext);
}
