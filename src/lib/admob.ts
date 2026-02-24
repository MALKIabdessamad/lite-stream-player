import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdmobConsentStatus, InterstitialAdPluginEvents, AdLoadInfo } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Replace these with your real AdMob unit IDs before publishing
const BANNER_AD_ID = Capacitor.getPlatform() === 'android'
  ? 'ca-app-pub-3940256099942544/6300978111'   // Test banner
  : 'ca-app-pub-3940256099942544/2934735716';

const INTERSTITIAL_AD_ID = Capacitor.getPlatform() === 'android'
  ? 'ca-app-pub-3940256099942544/1033173712'   // Test interstitial
  : 'ca-app-pub-3940256099942544/4411468910';

let admobInitialized = false;
let interstitialLoaded = false;

export async function initializeAdMob(): Promise<void> {
  if (admobInitialized || !Capacitor.isNativePlatform()) return;

  try {
    await AdMob.initialize({
      initializeForTesting: true, // Set to false in production
    });

    const consentInfo = await AdMob.requestConsentInfo();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }

    admobInitialized = true;
    console.log('[IPLAY] AdMob initialized');
  } catch (e) {
    console.warn('[IPLAY] AdMob init failed:', e);
  }
}

export async function showBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const options: BannerAdOptions = {
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true, // Set to false in production
    };
    await AdMob.showBanner(options);
    console.log('[IPLAY] Banner ad shown');
  } catch (e) {
    console.warn('[IPLAY] Banner ad failed:', e);
  }
}

export async function hideBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    // ignore
  }
}

export async function prepareInterstitial(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (_info: AdLoadInfo) => {
      interstitialLoaded = true;
      console.log('[IPLAY] Interstitial loaded');
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
      interstitialLoaded = false;
      console.warn('[IPLAY] Interstitial failed to load');
    });

    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_ID,
      isTesting: true, // Set to false in production
    });
  } catch (e) {
    console.warn('[IPLAY] Interstitial prep failed:', e);
  }
}

/**
 * Shows interstitial ad. Returns a promise that resolves when the ad is
 * closed or immediately if ad is not available.
 */
export async function showInterstitialAd(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !interstitialLoaded) {
    return;
  }

  return new Promise<void>((resolve) => {
    const dismissListener = AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      () => {
        dismissListener.then(h => h.remove());
        interstitialLoaded = false;
        // Preload next one
        prepareInterstitial();
        resolve();
      }
    );

    const failListener = AdMob.addListener(
      InterstitialAdPluginEvents.FailedToShow,
      () => {
        failListener.then(h => h.remove());
        interstitialLoaded = false;
        prepareInterstitial();
        resolve();
      }
    );

    AdMob.showInterstitial().catch(() => {
      resolve();
    });
  });
}
