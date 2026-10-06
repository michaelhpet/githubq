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

const BUSTER = "v2";

export const queryPersister = createSyncStoragePersister({
	storage: window.localStorage,
	key: "githubq-query-cache",
});

export async function clearPersistedCache(): Promise<void> {
	await queryPersister.removeClient();
}

export const persistBuster = BUSTER;
