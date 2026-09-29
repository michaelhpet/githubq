import "@/assets/styles/global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

ReactDOM.createRoot(document.getElementById("root")!).render(
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
  </React.StrictMode>
);
