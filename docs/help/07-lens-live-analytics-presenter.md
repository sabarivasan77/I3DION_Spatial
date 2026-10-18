# Lens — Live Analytics & Presenter Mode Guide

**I3DION Lens** delivers real-time spatial interaction telemetry, conversion funnels, 3D hotspot heatmaps, and synchronized presenter sessions.

---

## 1. Zero-Sample-Data Real Telemetry Ingestion

- **No Synthetic Numbers**: Lens metrics are calculated strictly from authoritative PostgreSQL database events (`analytics_events`).
- **Memory LRU + Database Deduplication**: Ingestion filters drop duplicate telemetry clicks received within a 10-second sliding window.
- **Privacy Masking**: IP addresses are automatically subnet-masked before analytical storage.

---

## 2. 5-Stage Spatial Conversion Funnel

Track user progression across the full spatial journey:
1. **Showcase Impressions**: Catalog page visits.
2. **Engaged Catalog Visits**: Dwell time $> 15\text{s}$ or page depth $> 2$.
3. **3D Spatial Interactions**: Orbit, zoom, explode, or hotspot clicks.
4. **Augmented Reality Intent**: Clicks on "View in AR" or USDZ/WebXR intent launches.
5. **Qualified Leads / RFQs**: Submitted quote inquiry forms.

---

## 3. 3D Hotspot Heatmap & Actionable Recommendations

- Visualize which machine parts or assemblies attract the highest attention.
- High-dwell hotspots ($\ge 30\%$ share) prompt: *"Promote this component to the hero showcase card"*.
- Low-dwell hotspots ($\le 15\%$ share) prompt: *"Consider repositioning 3D camera angle or increasing contrast"*.

---

## 4. Presenter Mode (Synchronized 3D Walkthroughs)

- **6-Character Session Code**: Host generates a temporary presentation code (`PR-XXXX`).
- **Real-Time Client Sync**: Remote sales prospects join without logging in. As the host orbits the 3D model, changes camera views, explodes assemblies, or toggles part variants, all connected clients follow in real-time.
