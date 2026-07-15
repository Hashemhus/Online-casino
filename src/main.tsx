import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { ChipsProvider } from "./context/ChipsContext";
import { Lobby } from "./pages/Lobby";
import { Blackjack } from "./pages/Blackjack";
import { Roulette } from "./pages/Roulette";
import { Slots } from "./pages/Slots";
import "./index.css";

// Hash router keeps this deployable as-is on GitHub Pages with no server config.
const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Lobby /> },
      { path: "blackjack", element: <Blackjack /> },
      { path: "roulette", element: <Roulette /> },
      { path: "slots", element: <Slots /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChipsProvider>
      <RouterProvider router={router} />
    </ChipsProvider>
  </StrictMode>,
);
