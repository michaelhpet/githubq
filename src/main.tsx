import "@/assets/styles/global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import AppLayout from "./layouts";
import Home from "./pages/home";
import Profile from "./pages/profile";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
