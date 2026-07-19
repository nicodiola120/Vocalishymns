import { AdMob } from "@capacitor-community/admob"

// Google AdMob ad unit IDs for Android
const BANNER_AD_ID = "ca-app-pub-7269248806423425/6736650924"
const REWARDED_AD_ID = "ca-app-pub-7269248806423425/3001299908"

export const ADS_UNLOCK_KEY = "vocalis_unlocked_hymns"
export const ADS_REMOVED_KEY = "vocalis_ads_removed"

const adState = {
  isInitialized: false,
  isShowing: false,
  lastShownTimestamp: 0,
  coolDownMs: 30000,
  totalWatched: 0,
  dailyWatched: 0,
  maxDaily: 15,
  hasBanner: false,
}

const adDayKey = () => `${location.hostname}_ads_day`
const adCountKey = () => `${location.hostname}_ads_count`

const updateDaily = () => {
  const stored = localStorage.getItem(adDayKey())
  const today = new Date().toDateString()
  if (stored !== today) {
    localStorage.setItem(adDayKey(), today)
    localStorage.setItem(adCountKey(), "0")
    adState.dailyWatched = 0
  } else {
    adState.dailyWatched = parseInt(localStorage.getItem(adCountKey()) || "0", 10)
  }
}

const incrementDaily = () => {
  const count = parseInt(localStorage.getItem(adCountKey()) || "0", 10) + 1
  localStorage.setItem(adCountKey(), String(count))
  adState.totalWatched++
  adState.dailyWatched = count
}

updateDaily()

export function getWatchedCount(): { daily: number; total: number } {
  updateDaily()
  return { daily: adState.dailyWatched, total: adState.totalWatched }
}

export function getUnlockedHymns(): Set<string> {
  try {
    const raw = localStorage.getItem(ADS_UNLOCK_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function unlockHymn(name: string): void {
  const unlocked = getUnlockedHymns()
  unlocked.add(name)
  localStorage.setItem(ADS_UNLOCK_KEY, JSON.stringify(Array.from(unlocked)))
}

export function isHymnUnlocked(name: string): boolean {
  if (isAdsRemoved()) return true
  return getUnlockedHymns().has(name)
}

export function isAdsRemoved(): boolean {
  return localStorage.getItem(ADS_REMOVED_KEY) === "true"
}

export async function purchaseRemoveAds(): Promise<boolean> {
  await new Promise<void>((resolve) => setTimeout(resolve, 1500))
  localStorage.setItem(ADS_REMOVED_KEY, "true")
  return true
}

export async function initializeAds(): Promise<void> {
  if (adState.isInitialized) return
  try {
    await AdMob.initialize()
    adState.isInitialized = true
  } catch (err) {
    console.warn("[AdMob] Init failed, falling back to mock:", err)
    adState.isInitialized = true
  }
}

export async function showBanner(): Promise<void> {
  if (adState.hasBanner || isAdsRemoved()) return
  try {
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      isTesting: false,
      position: "BOTTOM_CENTER",
      adSize: "ADAPTIVE_BANNER",
      margin: 0,
    })
    adState.hasBanner = true
  } catch (err) {
    console.warn("[AdMob] Banner failed:", err)
  }
}

export async function hideBanner(): Promise<void> {
  if (!adState.hasBanner) return
  try {
    await AdMob.hideBanner()
  } catch (err) {
    console.warn("[AdMob] Hide banner failed:", err)
  }
}

export async function removeBanner(): Promise<void> {
  if (!adState.hasBanner) return
  try {
    await AdMob.removeBanner()
    adState.hasBanner = false
  } catch (err) {
    console.warn("[AdMob] Remove banner failed:", err)
  }
}

export async function showRewardedAd(): Promise<boolean> {
  if (!adState.isInitialized) return false
  if (adState.isShowing) return false
  updateDaily()
  if (adState.dailyWatched >= adState.maxDaily) return false
  if (Date.now() - adState.lastShownTimestamp < adState.coolDownMs) return false

  adState.isShowing = true
  try {
    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_ID,
      isTesting: false,
    })
    const reward = await AdMob.showRewardVideoAd()
    adState.lastShownTimestamp = Date.now()
    incrementDaily()
    return reward && reward.amount > 0
  } catch (err) {
    console.warn("[AdMob] Rewarded ad failed:", err)
    return false
  } finally {
    adState.isShowing = false
  }
}
