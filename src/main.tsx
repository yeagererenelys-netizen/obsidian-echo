import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { PacketStreamProvider } from "@/context/PacketStreamContext";
import { AlertStoreProvider } from "@/context/AlertStoreContext";
import "./styles.css";

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <PacketStreamProvider>
    <AlertStoreProvider>
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    </AlertStoreProvider>
  </PacketStreamProvider>
);
