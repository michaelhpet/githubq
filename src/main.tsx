import "@/assets/styles/global.css";
import { hydrate } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import ReactDOM from "react-dom/client";
import {
	createBrowserRouter,
	Navigate,
	RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/lib/auth/session";
import { persistBuster, queryClient, queryPersister } from "@/lib/query-client";
import { AppLayout } from "./layouts";
import { Callback } from "./pages/callback";
import { Home } from "./pages/home";
import { Profile } from "./pages/profile";

const ReactQueryDevtools = React.lazy(() =>
	import("@tanstack/react-query-devtools").then((m) => ({
		default: m.ReactQueryDevtools,
	})),
);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = ReactDOM.createRoot(rootElement);

async function boot(): Promise<void> {
	try {
		const persisted = await queryPersister.restoreClient();
		if (
			persisted &&
			persisted.buster === persistBuster &&
			Date.now() - persisted.timestamp < 1000 * 60 * 60
		) {
			hydrate(queryClient, persisted.clientState);
		}
	} catch {
		await queryPersister.removeClient();
	}
	root.render(
		<React.StrictMode>
			<ErrorBoundary>
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister: queryPersister,
					buster: persistBuster,
					maxAge: 1000 * 60 * 60,
				}}
			>
				<AuthProvider>
					<RouterProvider
						router={createBrowserRouter([
							{
								path: "/",
								element: <AppLayout />,
								children: [
									{ path: "/", element: <Home /> },
									{ path: "/callback", element: <Callback /> },
									{ path: "/:username", element: <Profile /> },
								],
							},
							{ path: "*", element: <Navigate to="/" /> },
						])}
					/>
				</AuthProvider>
			{!!import.meta.env.DEV && (
				<React.Suspense fallback={null}>
					<ReactQueryDevtools initialIsOpen={false} />
				</React.Suspense>
			)}
		</PersistQueryClientProvider>
		</ErrorBoundary>
	</React.StrictMode>,
	);
}

void boot();
