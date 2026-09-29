import "@/assets/styles/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import {
	createBrowserRouter,
	Navigate,
	RouterProvider,
} from "react-router-dom";
import AppLayout from "./layouts";
import Home from "./pages/home";
import Profile from "./pages/profile";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider
				router={createBrowserRouter([
					{
						path: "/",
						element: <AppLayout />,
						children: [
							{ path: "/", element: <Home /> },
							{ path: "/:username", element: <Profile /> },
						],
					},
					{ path: "*", element: <Navigate to="/" /> },
				])}
			/>
		</QueryClientProvider>
	</React.StrictMode>,
);
