import { useContext } from "react";
import { AlertStoreContext } from "@/context/AlertStoreContext";
import type { Alert } from "@/context/AlertStoreContext";

export function useAlertStore() {
  const context = useContext(AlertStoreContext);
  if (!context) {
    throw new Error("useAlertStore must be used within an AlertStoreProvider");
  }
  return context;
}

export type { Alert };
