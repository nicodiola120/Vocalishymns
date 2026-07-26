import { Capacitor } from "@capacitor/core";
import { isAdsRemoved, removeBanner } from "./ads";

const PLUGIN_NAME = "Billing";

function getPlugin() {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.Plugins?.[PLUGIN_NAME]) return cap.Plugins[PLUGIN_NAME];
  } catch {}
  return null;
}

export function isNativePlatform(): boolean {
  try {
    const cap = (window as any).Capacitor;
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

export async function isBillingReady(): Promise<boolean> {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.isReady();
    return result?.ready ?? false;
  } catch {
    return false;
  }
}

export async function purchaseRemoveAds(): Promise<boolean> {
  if (isAdsRemoved()) return true;
  const plugin = getPlugin();
  if (!plugin) throw new Error("Billing not available");

  const result = await plugin.purchaseRemoveAds();
  if (result?.purchased) {
    localStorage.setItem("vocalis_ads_removed", "true");
    await removeBanner();
    return true;
  }
  return false;
}

export async function restorePurchases(): Promise<boolean> {
  if (isAdsRemoved()) return true;
  const plugin = getPlugin();
  if (!plugin) return false;

  try {
    const result = await plugin.restorePurchases();
    if (result?.purchased) {
      localStorage.setItem("vocalis_ads_removed", "true");
      await removeBanner();
      return true;
    }
  } catch {}
  return false;
}
