import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <>
      <head>Header</head>
      <Outlet />
      <footer>Footer</footer>
    </>
  );
}
