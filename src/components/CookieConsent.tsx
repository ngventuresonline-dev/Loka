'use client'

import { useEffect, useMemo, useState } from 'react'
import Script from 'next/script'

type CookiePreferences = {
  analytics: boolean
  marketing: boolean
}

const STORAGE_KEY = 'lokazen-cookie-consent'
const FORM_INTERACTION_KEY = 'lokazen-form-interaction'

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

function hasFormInteraction(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(FORM_INTERACTION_KEY) === 'true'
  } catch {
    return false
  }
}

function markFormInteraction() {
  try {
    window.localStorage.setItem(FORM_INTERACTION_KEY, 'true')
  } catch {
    // ignore write failures
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
      // Only show banner if user has interacted with a form
      if (hasFormInteraction()) {
        setShowBanner(true)
      } else {
        // Listen for first form interaction
        const handleFormInteraction = () => {
          if (!hasFormInteraction()) {
            markFormInteraction()
            setShowBanner(true)
          }
        }

        // Listen for focus events on inputs, textareas, selects
        const formElements = document.querySelectorAll('input, textarea, select')
        formElements.forEach(el => {
          el.addEventListener('focus', handleFormInteraction, { once: true })
        })

        // Also listen for any new form elements added dynamically
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const element = node as Element
                const formEls = element.querySelectorAll?.('input, textarea, select')
                formEls?.forEach(el => {
                  el.addEventListener('focus', handleFormInteraction, { once: true })
                })
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
                  element.addEventListener('focus', handleFormInteraction, { once: true })
                }
              }
            })
          })
        })

        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
          formElements.forEach(el => {
            el.removeEventListener('focus', handleFormInteraction)
          })
          observer.disconnect()
        }
      }
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
      <div className="fixed inset-x-4 bottom-4 z-[9999] mx-auto max-w-lg rounded-xl border border-orange-200 bg-white shadow-2xl md:bottom-6 md:max-w-xl">
        <div className="p-3 md:p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 md:text-base">Cookie Preferences</p>
              <p className="mt-1 text-xs text-gray-600 md:text-sm">
                We use cookies to provide better and accurate results. Choose your preferences below.
              </p>
            </div>
          </div>
          <div className="mb-3 flex flex-col gap-2">
            <label className="flex items-start gap-2.5 text-xs text-gray-800 md:text-sm">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 h-3.5 w-3.5 cursor-not-allowed rounded border-gray-300 text-orange-500 focus:ring-orange-500 md:h-4 md:w-4"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Essential</p>
                <p className="text-[10px] text-gray-600 md:text-xs">Required for site functionality.</p>
              </div>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-gray-800 md:text-sm">
              <input
                type="checkbox"
                checked={current.analytics}
                onChange={e => setPreferences({ ...current, analytics: e.target.checked })}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 md:h-4 md:w-4"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-[10px] text-gray-600 md:text-xs">Helps us improve our services.</p>
              </div>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-gray-800 md:text-sm">
              <input
                type="checkbox"
                checked={current.marketing}
                onChange={e => setPreferences({ ...current, marketing: e.target.checked })}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 md:h-4 md:w-4"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Marketing</p>
                <p className="text-[10px] text-gray-600 md:text-xs">Personalized content and ads.</p>
              </div>
            </label>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[10px] text-gray-600 md:text-xs">
              <a href="/cookies" className="font-medium text-orange-600 hover:text-orange-700">
                Cookie policy
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 md:px-4 md:py-2 md:text-sm"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleSave(current)}
                className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 md:px-4 md:py-2 md:text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-lg bg-gradient-to-r from-[#FF5200] to-[#E4002B] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md md:px-4 md:py-2 md:text-sm"
              >
                Accept All
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
fbq('init', '881412714299889');
fbq('track', 'PageView');`,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src="https://www.facebook.com/tr?id=881412714299889&ev=PageView&noscript=1"
              alt=""
            />
          </noscript>
        </>
      )}

      {banner}
    </>
  )
}
