'use client'

import React from 'react'
import Script from 'next/script'
import { PublicStoreSettings } from '@/utils/settings'

interface TrackingScriptsProps {
  settings: PublicStoreSettings
}

function extractCleanPixelId(input?: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  const matchInit = trimmed.match(/fbq\(\s*['"]init['"]\s*,\s*['"](\d+)['"]\s*\)/i)
  if (matchInit && matchInit[1]) return matchInit[1]
  const matchTr = trimmed.match(/[?&]id=(\d+)/i)
  if (matchTr && matchTr[1]) return matchTr[1]
  return trimmed.replace(/[^0-9]/g, '') || trimmed
}

export default function TrackingScripts({ settings }: TrackingScriptsProps) {
  const { 
    meta_pixel_id, 
    google_analytics_id, 
    google_tag_manager_id, 
    tiktok_pixel_id, 
    custom_head_scripts 
  } = settings

  const cleanMetaPixelId = extractCleanPixelId(meta_pixel_id)

  return (
    <>
      {/* 1. GOOGLE TAG MANAGER (GTM) */}
      {google_tag_manager_id && google_tag_manager_id.trim() && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${google_tag_manager_id.trim()}');
              `
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${google_tag_manager_id.trim()}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* 2. META (FACEBOOK / INSTAGRAM) PIXEL */}
      {cleanMetaPixelId && (
        <>
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${cleanMetaPixelId}');
                fbq('track', 'PageView');
              `
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${cleanMetaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* 3. GOOGLE ANALYTICS 4 (GA4 / GTAG) */}
      {google_analytics_id && google_analytics_id.trim() && !google_tag_manager_id && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${google_analytics_id.trim()}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${google_analytics_id.trim()}', {
                  page_path: window.location.pathname,
                });
              `
            }}
          />
        </>
      )}

      {/* 4. TIKTOK PIXEL */}
      {tiktok_pixel_id && tiktok_pixel_id.trim() && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${tiktok_pixel_id.trim()}');
                ttq.page();
              }(window, document, 'ttq');
            `
          }}
        />
      )}

      {/* 5. CUSTOM HEAD SCRIPTS (Microsoft Clarity, Pinterest, Hotjar, etc.) */}
      {custom_head_scripts && custom_head_scripts.trim() && (
        <Script
          id="custom-head-scripts"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: custom_head_scripts.replace(/<\/?script[^>]*>/gi, '')
          }}
        />
      )}
    </>
  )
}
