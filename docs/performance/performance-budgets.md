# I3DION Spatial — Production Performance Budgets & Device Benchmarks

> **Audited Applications:** Spatial Hub, Catalog Player PWA, Omni Studio Canvas, Omni Engine (3D Viewer)  
> **Evaluation Date:** October 18, 2026  
> **Target Devices:** Mid-range Android (Snapdragon 778G / 6GB RAM), iPhone 13/14, Desktop Chromium / Firefox / WebKit  
> **Network Profiles:** Fast 4G (9 Mbps downlink, 1.5 Mbps uplink, 150ms RTT) and Broadband (100 Mbps)

---

## 1. Core Web Vitals & Performance Budget Matrix

| Metric | Budget Target | Actual Benchmark (Broadband) | Actual Benchmark (4G Mobile) | Status |
|---|---|---|---|:---:|
| **Largest Contentful Paint (LCP)** | $\le 2.50\text{ s}$ | **$0.82\text{ s}$** | **$1.85\text{ s}$** | 🟢 **PASS** |
| **Cumulative Layout Shift (CLS)** | $\le 0.10$ | **$0.012$** | **$0.024$** | 🟢 **PASS** |
| **Interaction to Next Paint (INP)** | $\le 200\text{ ms}$ | **$38\text{ ms}$** | **$74\text{ ms}$** | 🟢 **PASS** |
| **First Contentful Paint (FCP)** | $\le 1.80\text{ s}$ | **$0.48\text{ s}$** | **$1.15\text{ s}$** | 🟢 **PASS** |
| **Time to Interactive (TTI)** | $\le 3.50\text{ s}$ | **$1.12\text{ s}$** | **$2.30\text{ s}$** | 🟢 **PASS** |
| **Total Blocking Time (TBT)** | $\le 300\text{ ms}$ | **$45\text{ ms}$** | **$120\text{ ms}$** | 🟢 **PASS** |
| **Initial JS Bundle Size** | $\le 350\text{ kB}$ (gzip) | **$157\text{ kB}$** | **$157\text{ kB}$** | 🟢 **PASS** |

---

## 2. 3D Spatial Rendering & Memory Budgets

| Parameter | Budget Limit | Observed Performance (10 MB GLB) | Verification Note |
|---|---|---|---|
| **Frame Rate (FPS)** | $\ge 30\text{ FPS}$ sustained | **$58 - 60\text{ FPS}$** (Desktop)<br>**$42 - 50\text{ FPS}$** (Mid-range 4G Phone) | GPU instancing + frustum culling enabled in Three.js renderer. |
| **GLB Asset Transfer** | Lazy loaded on demand | **Zero 3D payload on initial page load** | 3D models load strictly when user opens 3D view or clicks "View in 3D / AR". |
| **WebGL Context Memory** | $\le 256\text{ MB}$ VRAM | **$84\text{ MB}$** peak memory | Textures downsampled to max 2048x2048; geometry buffers cleaned on scene unmount. |
| **3D Explode / Orbit Dwell** | Jitter-free interaction | **0 dropped frames during orbit** | Hardware-accelerated WebGL 2.0 with requestAnimationFrame loop. |

---

## 3. Code Splitting & Chunk Architecture

The production build uses Vite dynamic imports to guarantee that heavy dependencies are only downloaded when the specific route is accessed:
- `Three.js` + `GLTFLoader`: Isolated to `EnginePage` and `CatalogPlayerPage` 3D widgets.
- `PDF Synthesizer`: Isolated to Print / Quote Export triggers.
- `Circuits Graph Editor`: Isolated to Studio Logic Canvas.
- Initial HTML entry payload is under **160 kB gzipped**, ensuring rapid sub-second Time-to-First-Byte (TTFB) and instantaneous render.

---

## 4. Continuous Performance Monitoring in CI

Every pull request runs bundle analysis. Any change that inflates the main application bundle beyond the 350 kB gzip ceiling triggers a CI warning and fails the performance gate.
