import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 2,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

/**
 * Persists successful query results to localStorage, keyed by each query's
 * key (which already includes username + metric). A refresh restores
 * cached responses instead of hitting GitHub again. Bump BUSTER when the
 * cached data shapes change incompatibly.
 */
const BUSTER = "v2";

export const queryPersister = createSyncStoragePersister({
	storage: window.localStorage,
	key: "githubq-query-cache",
});

/** Drop the persisted cache (used by "Audit again" before refetching). */
export async function clearPersistedCache(): Promise<void> {
	await queryPersister.removeClient();
}

export const persistBuster = BUSTER;
