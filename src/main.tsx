import "@/assets/styles/global.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import ReactDOM from "react-dom/client";
import {
	createBrowserRouter,
	Navigate,
	RouterProvider,
} from "react-router-dom";
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

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
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
	</React.StrictMode>,
);
