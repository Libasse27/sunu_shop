declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type MetricName = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
type Rating = 'good' | 'needs-improvement' | 'poor';

interface Metric {
  name:   MetricName;
  value:  number;
  rating: Rating;
}

// Seuils Google Core Web Vitals (ms, sauf CLS sans unité)
const THRESHOLDS: Record<MetricName, [good: number, poor: number]> = {
  LCP:  [2500, 4000],
  CLS:  [0.1,  0.25],
  INP:  [200,  500],
  FCP:  [1800, 3000],
  TTFB: [800,  1800],
};

function rate(name: MetricName, value: number): Rating {
  const [good, poor] = THRESHOLDS[name];
  return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
}

function send(metric: Metric): void {
  if (import.meta.env.DEV) {
    const icon = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.info(`[Vitals] ${icon} ${metric.name}: ${metric.value.toFixed(1)} — ${metric.rating}`);
  }
  // GA4 — envoi uniquement si GTM est chargé
  window.gtag?.('event', metric.name, {
    event_category:  'Web Vitals',
    value:           Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label:     metric.rating,
    non_interaction: true,
  });
}

export function reportWebVitals(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  // LCP — Largest Contentful Paint
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      send({ name: 'LCP', value: last.startTime, rating: rate('LCP', last.startTime) });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* non supporté */ }

  // CLS — Cumulative Layout Shift (cumulé, rapporté à visibilitychange)
  try {
    let cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!e.hadRecentInput) cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        send({ name: 'CLS', value: cls, rating: rate('CLS', cls) });
      }
    }, { once: true });
  } catch { /* non supporté */ }

  // FCP — First Contentful Paint
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          send({ name: 'FCP', value: entry.startTime, rating: rate('FCP', entry.startTime) });
        }
      }
    }).observe({ type: 'paint', buffered: true });
  } catch { /* non supporté */ }

  // TTFB — Time to First Byte
  try {
    new PerformanceObserver((list) => {
      const nav = list.getEntries()[0] as PerformanceNavigationTiming;
      const ttfb = nav.responseStart - nav.requestStart;
      if (ttfb > 0) send({ name: 'TTFB', value: ttfb, rating: rate('TTFB', ttfb) });
    }).observe({ type: 'navigation', buffered: true });
  } catch { /* non supporté */ }

  // INP — Interaction to Next Paint
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { processingStart: number; startTime: number };
        const inp = e.processingStart - e.startTime;
        if (inp > 0) send({ name: 'INP', value: inp, rating: rate('INP', inp) });
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
  } catch { /* non supporté */ }
}
