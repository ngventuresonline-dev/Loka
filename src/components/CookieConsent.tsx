'use client'

import { useEffect, useMemo, useState } from 'react'
import Script from 'next/script'

type CookiePreferences = {
  analytics: boolean
  marketing: boolean
}

const STORAGE_KEY = 'lokazen-cookie-consent'

function loadStoredPreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookiePreferences
    if (typeof parsed.analytics === 'boolean' && typeof parsed.marketing === 'boolean') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function persistPreferences(prefs: CookiePreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore write failures (e.g., in private mode)
  }
}

function applyConsent(prefs: CookiePreferences) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
    })
  }
  if (typeof window.fbq === 'function' && !prefs.marketing) {
    // Basic opt-out for marketing if pixel already initialized
    window.fbq('consent', 'revoke')
  }
}

export default function CookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const stored = loadStoredPreferences()
    if (stored) {
      setPreferences(stored)
      applyConsent(stored)
    } else {
      setShowBanner(true)
    }
  }, [])

  const handleSave = (prefs: CookiePreferences) => {
    setPreferences(prefs)
    persistPreferences(prefs)
    applyConsent(prefs)
    setShowBanner(false)
  }

  const handleAcceptAll = () => {
    handleSave({ analytics: true, marketing: true })
  }

  const handleRejectNonEssential = () => {
    handleSave({ analytics: false, marketing: false })
  }

  const current = preferences ?? { analytics: true, marketing: true }
  const shouldLoadAnalytics = preferences?.analytics
  const shouldLoadMarketing = preferences?.marketing

  const banner = useMemo(() => {
    if (!showBanner) return null
    return (
      <div className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-gray-900">Cookies & tracking preferences</p>
              <p className="text-sm text-gray-700">
                We use cookies to improve experience, measure analytics, and personalize marketing. Choose what you want
                to allow.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-1 h-4 w-4 cursor-not-allowed rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <p className="font-medium text-gray-900">Essential</p>
                <p className="text-xs text-gray-600">Required for site functionality and security.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={current.analytics}
                onChange={e => setPreferences({ ...current, analytics: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-xs text-gray-600">Helps us measure performance (Google Analytics).</p>
              </div>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={current.marketing}
                onChange={e => setPreferences({ ...current, marketing: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <p className="font-medium text-gray-900">Marketing</p>
                <p className="text-xs text-gray-600">Enables ad personalization (Meta Pixel).</p>
              </div>
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-600">
              Read our{' '}
              <a href="/cookies" className="font-medium text-orange-600 hover:text-orange-700">
                cookie policy
              </a>
              .
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => handleSave(current)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Save preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }, [current, showBanner])

  return (
    <>
      {shouldLoadAnalytics && (
        <>
          <Script
            id="gtm-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TQ3RGK37');`,
            }}
          />
          <Script
            id="ga-src"
            strategy="afterInteractive"
            src="https://www.googletagmanager.com/gtag/js?id=G-GFTJMV4G59"
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-GFTJMV4G59');
              `,
            }}
          />
        </>
      )}

      {shouldLoadMarketing && (
        <>
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '25821305420838603');
fbq('track', 'PageView');`,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src="https://www.facebook.com/tr?id=25821305420838603&ev=PageView&noscript=1"
              alt=""
            />
          </noscript>
        </>
      )}

      {banner}
    </>
  )
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

