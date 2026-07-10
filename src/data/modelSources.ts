import type { SourceLink } from './types'

/**
 * Research sources per model id — the pages cross-checked when the model's specs
 * were catalogued (see the check-monitor skill). Keyed by MonitorModel.id; each
 * value is the list of sources actually used. Keys are validated against
 * MONITOR_MODELS in index.ts.
 */
export const MODEL_SOURCES: Record<string, SourceLink[]> = {
  'samsung-odyssey-3d-g90xh': [
    { name: 'Samsung Global Newsroom — Odyssey CES 2026 lineup', url: 'https://news.samsung.com/global/samsung-unveils-new-odyssey-gaming-monitor-lineup-featuring-world-first-6k-3d-and-ultra-high-resolution-displays' },
    { name: 'TFTCentral — Samsung Odyssey CES 2026 lineup', url: 'https://tftcentral.co.uk/news/samsung-unveil-their-exciting-line-up-of-new-odyssey-monitors-for-ces-2026' },
    { name: 'Engadget — 32-inch 6K glasses-free 3D Odyssey', url: 'https://www.engadget.com/computing/accessories/samsungs-latest-odyssey-gaming-monitor-has-a-32-inch-6k-screen-with-glasses-free-3d-130051748.html' },
    { name: 'TechRadar — Odyssey 3D glasses-free 6K', url: 'https://www.techradar.com/pro/samsung-aims-to-beat-apples-usd5000-display-xdr-monitor-with-6k-3d-monitor-and-it-doesnt-even-need-glasses' },
    { name: 'PC Gamer — Samsung 6K 3D + 1,040 Hz monitors', url: 'https://www.pcgamer.com/hardware/gaming-monitors/samsung-outs-worlds-first-1-040-hz-and-6k-3d-gaming-monitors-ahead-of-ces/' },
  ],
  'samsung-odyssey-g6-g60h': [
    { name: 'Samsung Global Newsroom — Odyssey CES 2026 lineup', url: 'https://news.samsung.com/global/samsung-unveils-new-odyssey-gaming-monitor-lineup-featuring-world-first-6k-3d-and-ultra-high-resolution-displays' },
    { name: 'CES 2026 Innovation Awards — Samsung Odyssey G60H', url: 'https://www.ces.tech/ces-innovation-awards/2026/samsung-odyssey-g60h/' },
    { name: "Tom's Hardware — Samsung CES monitor lineup (dual-mode 1040Hz)", url: 'https://www.tomshardware.com/monitors/gaming-monitors/samsungs-ces-monitor-lineup-includes-6k-3d-display-with-eye-tracking-plus-a-dual-mode-qhd-panel-with-a-blistering-1080p-1040hz-option' },
    { name: 'VideoCardz — 27" Odyssey G6 with 1040Hz mode', url: 'https://videocardz.com/newz/samsung-reveals-32-odyssey-3d-6k-monitor-and-27-odyssey-g6-with-1040-hz-mode' },
    { name: 'Neowin — World-first 1040Hz Odyssey monitors', url: 'https://www.neowin.net/news/worlds-first-1040hz-and-6k-3d-odyssey-gaming-monitors-unveiled-by-samsung/' },
  ],
  'samsung-odyssey-g8-g80hs': [
    { name: 'Samsung Newsroom — Next-Gen Odyssey launch (first 6K gaming monitor)', url: 'https://news.samsung.com/global/samsung-launches-next-gen-odyssey-gaming-and-viewfinity-monitors-including-industrys-first-6k-gaming-monitor' },
    { name: 'Samsung US — 32" Odyssey G8 G80HS product page', url: 'https://www.samsung.com/us/monitors/gaming/32-inch-odyssey-g8-g80hs-6k-gaming-monitor-sku-ls32hg802esxza/' },
    { name: 'TFTCentral — G80HS world\'s first 6K gaming monitor', url: 'https://tftcentral.co.uk/news/samsung-odyssey-g80hs-the-worlds-first-6k-gaming-monitor-officially-arrives-with-32-165-330hz-dual-mode-panel' },
    { name: 'Amazon — Samsung 32" Odyssey G8 (G80HS)', url: 'https://www.amazon.com/Samsung-Odyssey-G80HS-Gaming-Monitor/dp/B0GWG3W5MZ' },
    { name: 'Trusted Reviews — Samsung 32G80HS', url: 'https://www.trustedreviews.com/reviews/samsung-32g80hs' },
  ],
  'lg-52g930b': [
    { name: 'LG USA — 52G930B-B product page', url: 'https://www.lg.com/us/monitors/lg-52g930b-b-gaming-monitor' },
    { name: 'LG Canada — 52G930B-B product page', url: 'https://www.lg.com/ca_en/monitors/gaming/52g930b-b/' },
    { name: 'TFTCentral — official launch, VA 5K2K panel', url: 'https://tftcentral.co.uk/news/lg-officially-launch-the-52g930b-as-the-52-va-5k2k-panel-appears-for-pre-order' },
    { name: "Tom's Hardware — 52G930B review", url: 'https://www.tomshardware.com/monitors/gaming-monitors/lg-ultragear-52g930b-52-inch-5k-gaming-monitor-review-extreme-in-every-respect' },
    { name: 'B&H Photo — UltraGear evo 51.6" 52G930B-B', url: 'https://www.bhphotovideo.com/c/product/1951122-REG/lg_ultragear_evo_52g930b_52.html' },
  ],
  'lg-39gx950b': [
    { name: 'LG USA — 39GX950B-B product page', url: 'https://www.lg.com/us/monitors/lg-39gx950b-b-gaming-monitor' },
    { name: 'LG Canada — 39GX950B-B product page', url: 'https://www.lg.com/ca_en/monitors/gaming/39gx950b-b/' },
    { name: 'TFTCentral — 39GX950B specs unveiled', url: 'https://tftcentral.co.uk/news/the-lg-39gx950b-appears-on-lg-com-with-more-information-and-specs-unveiled' },
    { name: 'VideoCardz — 39GX950B 4th Gen Tandem OLED specs', url: 'https://videocardz.com/newz/lg-details-39gx950b-4th-gen-tandem-oled-monitor-specs-worlds-first-5k-ai-upscaling-without-gpu' },
    { name: 'PCMonitors — 39GX950B-B (Evo GX9)', url: 'https://pcmonitors.info/lg/lg-ultragear-39gx950b-b-evo-gx9-165hz-oled/' },
  ],
  'lg-27gm950b': [
    { name: 'LG USA — 27GM950B-B product page', url: 'https://www.lg.com/us/monitors/lg-27gm950b-b-gaming-monitor' },
    { name: 'TFTCentral — 27GM950B 5K Mini-LED announcement', url: 'https://tftcentral.co.uk/news/lg-27gm950b-5k-monitor-announced-with-a-2304-zone-mini-led-backlight' },
    { name: 'displayspecifications.com — LG 27GM950B', url: 'https://www.displayspecifications.com/en/model/4c064617' },
    { name: 'Amazon — LG 27GM950B-B', url: 'https://www.amazon.com/LG-27GM950B-B-Ultragear-Mini-LED-DisplayHDR1000/dp/B0GVPJ1DHG' },
    { name: 'RTINGS — LG 27GM950B-B review', url: 'https://www.rtings.com/monitor/reviews/lg/27gm950b-b' },
  ],
  'asus-rog-swift-oled-pg27ucwm': [
    { name: 'Asus ROG — RGB Stripe Pixel OLED tech (PG34WCDN, XG34WCDMS, PG27UCWM)', url: 'https://rog.asus.com/articles/gaming-monitors/rgb-stripe-pixel-oled-tech-debuts-in-the-rog-swift-pg34wcdn-xg34wcdms-pg27ucwm/' },
    { name: 'Asus Pressroom — Next-Gen RGB OLED at CES 2026', url: 'https://press.asus.com/news/press-releases/rog-rgb-oled-ces-2026/' },
    { name: 'TFTCentral — ROG Swift PG27UCWM (27" 4K Tandem WOLED)', url: 'https://tftcentral.co.uk/news/asus-unveil-the-rog-swift-pg27ucwm-with-a-27-4k-tandem-woled-panel-and-rgb-stripe-pixel-layout' },
    { name: 'Notebookcheck — ROG Swift OLED PG27UCWM', url: 'https://www.notebookcheck.net/Asus-ROG-Swift-OLED-PG27UCWM-rears-its-head-as-new-Tandem-OLED-gaming-monitor-with-improved-text-clarity.1196598.0.html' },
    { name: 'VideoCardz — ROG Swift 4th Gen Tandem OLED PG27UCWM', url: 'https://videocardz.com/newz/asus-launches-rog-swift-4th-gen-tandem-oled-pg27ucwm-and-qd-oled-pg34wcdn-monitors' },
  ],
  'asus-rog-swift-pg34wcdn': [
    { name: 'Asus ROG — PG34WCDN spec page', url: 'https://rog.asus.com/monitors/32-to-34-inches/rog-swift-oled-pg34wcdn/spec/' },
    { name: "Tom's Hardware — PG34WCDN review", url: 'https://www.tomshardware.com/monitors/gaming-monitors/asus-rog-swift-pg34wcdn-34-inch-qd-oled-360-hz-gaming-monitor-review' },
    { name: 'RTINGS — PG34WCDN review', url: 'https://www.rtings.com/monitor/reviews/asus/rog-swift-oled-pg34wcdn' },
    { name: 'TFTCentral — PG34WCDN unveiled (1800R, 5th-gen QD-OLED)', url: 'https://tftcentral.co.uk/news/asus-rog-swift-pg34wcdn-unveiled-with-34-360hz-5th-gen-qd-oled-panel' },
    { name: 'DisplaySpecifications — active area 800.06 × 337.06 mm', url: 'https://www.displayspecifications.com/en/model/7fdb461a' },
  ],
  'acer-predator-xb273u-f6': [
    { name: 'Acer Newsroom — Predator XB273U F6 press release', url: 'https://news.acer.com/acer-unleashes-the-predator-xb273u-f6-gaming-monitor-a-1000-hz-powerhouse-pushing-performance-boundaries' },
    { name: 'TFTCentral — XB273U F6 announced (1000Hz)', url: 'https://tftcentral.co.uk/news/acer-predator-xb273u-f6-announced-with-1000hz-refresh-rate' },
    { name: 'displayspecifications.com — Acer XB273U F6', url: 'https://www.displayspecifications.com/en/news/2fe0f28' },
    { name: "Tom's Hardware — Acer CES 2026 monitor trio", url: 'https://www.tomshardware.com/monitors/gaming-monitors/acer-brings-trio-of-predator-and-nitro-gaming-monitors-to-ces-1-000-hz-dual-mode-5k-165-hz-and-360hz-wqhd-qd-oled' },
    { name: 'NotebookCheck — 27-inch 1440p, 1000 Hz mode', url: 'https://www.notebookcheck.net/Acer-shows-off-the-Predator-XB273U-F6-with-27-inch-1440p-panel-and-1-000-Hz-mode.1196902.0.html' },
  ],
  'acer-prodesigner-pe320qx': [
    { name: 'Acer — ProDesigner PE320QX product page', url: 'https://www.acer.com/acer-prodesigner-pe320qx' },
    { name: 'TechRadar — Acer PE320QX true 6K announcement', url: 'https://www.techradar.com/pro/the-era-of-6k-monitors-has-come-after-dell-acer-launches-another-20-megapixel-screen-32-inch-pe320qx-has-7-ports-and-a-webcam-but-no-kvm' },
    { name: 'Notebookcheck — ProDesigner PE320QX', url: 'https://www.notebookcheck.net/ProDesigner-PE320QX-Acer-reveals-new-6K-professional-monitor-as-Asus-ProArt-and-LG-UltraFine-rival.1196988.0.html' },
    { name: 'DisplaySpecifications — 6K Acer ProDesigner PE320QX', url: 'https://www.displayspecifications.com/en/news/410df2b' },
    { name: 'Portrait Displays — PE320QX Calman Verified (CES 2026)', url: 'https://www.portrait.com/acer-prodesigner-pe320qx-a-new-benchmark-for-professional-displays-now-calman-verified-and-debuting-at-ces-2026/' },
  ],
  'dell-u5226kw': [
    { name: 'Dell — UltraSharp 52 Thunderbolt Hub U5226KW product page', url: 'https://www.dell.com/en-us/shop/dell-ultrasharp-52-thunderbolt-hub-monitor-u5226kw/apd/210-bthw/monitors-monitor-accessories' },
    { name: 'Micro Center — U5226KW 51.5" 6K (6144×2560) 120Hz', url: 'https://www.microcenter.com/product/706410/dell-ultrasharp-u5226kw-515-6k-(6144-x-2560)-120hz-curved-screen-ultrawide-monitor' },
    { name: 'TFTCentral — U5226KW announcement', url: 'https://tftcentral.co.uk/news/dell-announce-the-ultrasharp-u5226kw-a-massive-52-ultrawide-monitor-with-6k-resolution' },
    { name: 'RTINGS — Dell U5226KW review', url: 'https://www.rtings.com/monitor/reviews/dell/u5226kw' },
    { name: 'StorageReview — Dell UltraSharp U5226KW review', url: 'https://www.storagereview.com/review/dell-ultrasharp-u5226kw-review-a-massive-52-inch-6k-display-for-your-entire-workflow' },
  ],
  'dell-u3226q': [
    { name: 'Dell — UltraSharp 32 4K QD-OLED U3226Q product page', url: 'https://www.dell.com/en-us/shop/dell-ultrasharp-32-4k-qd-oled-monitor-u3226q/apd/210-bvkd/monitors-monitor-accessories' },
    { name: 'displayspecifications.com — Dell U3226Q', url: 'https://www.displayspecifications.com/en/model/fdd047bb' },
    { name: "Tom's Hardware — Dell UltraSharp U3226Q review", url: 'https://www.tomshardware.com/monitors/dell-ultrasharp-u3226q-4k-32-inch-qd-oled-monitor-review' },
    { name: 'PCWorld — Dell UltraSharp 32 U3226Q review', url: 'https://www.pcworld.com/article/3100082/dell-ultrasharp-32-u3226q-review.html' },
    { name: 'CES 2026 Innovation Awards — Dell U3226Q', url: 'https://www.ces.tech/ces-innovation-awards/2026/dell-ultrasharp-32-4k-qd-oled-monitor-u3226q/' },
  ],
  'msi-mpg-341cqr-x36': [
    { name: 'MSI — MPG 341CQR QD-OLED X36 product page', url: 'https://us.msi.com/Monitor/MPG-341CQR-QD-OLED-X36' },
    { name: 'TFTCentral — MPG 341CQR X36 (34" 360Hz 5th-Gen QD-OLED)', url: 'https://tftcentral.co.uk/news/msi-announce-the-mpg-341cqr-x36-with-34-ultrawide-360hz-5th-gen-qd-oled-panel' },
    { name: 'RTINGS — MSI MPG 341CQR QD-OLED X36 review', url: 'https://www.rtings.com/monitor/reviews/msi/mpg-341cqr-qd-oled-x36' },
    { name: 'TechPowerUp — MSI MPG 341CQR QD-OLED X36 review', url: 'https://www.techpowerup.com/review/msi-mpg-341cqr-qd-oled-x36/' },
    { name: 'B&H Photo — MSI MPG 341CQR QD-OLED X36', url: 'https://www.bhphotovideo.com/c/product/1959492-REG/msi_mpg_341cqr_qd_oled_x36_34_uwqhd_360hz_curved.html' },
  ],
  'msi-mpg-oled-322urdx36': [
    { name: 'MSI — MPG OLED 322URDX36 announcement (triple-mode 4K 360Hz)', url: 'https://www.msi.com/news/detail/The-World-s-First-Triple-Mode-QD-OLED-Gaming-Monitor--MPG-OLED-322URDX36-31-5-Inch-4K-360Hz-Debuts-at-COMPUTEX-2026-148961' },
    { name: 'displayspecifications.com — MPG OLED 322URDX36', url: 'https://www.displayspecifications.com/en/model/dcd24a1a' },
    { name: "Tom's Hardware — MSI 32\" triple-mode 4K 360Hz", url: 'https://www.tomshardware.com/monitors/gaming-monitors/msis-new-32-oled-monitor-can-switch-between-4k-360-hz-1440p-520-hz-and-1080p-680-hz-featuring-a-penta-tandem-qd-oled-panel-with-rgb-stripe-subpixels' },
    { name: 'PCWorld — MPG OLED 322URDX36 three display modes', url: 'https://www.pcworld.com/article/3154523/msi-mpg-oled-322urdx36-has-a-wild-trick-three-display-modes.html' },
    { name: 'FlatpanelsHD — MSI V-Stripe QD-OLED 2026 monitors', url: 'https://www.flatpanelshd.com/news.php?subaction=showfull&id=1780314150' },
  ],
  'hyperx-omen-oled-34': [
    { name: 'HP support — HyperX Omen OLED 34 product specs', url: 'https://support.hp.com/us-en/product/product-specs/hyperx-omen-oled-34-inch-wqhd-360hz-gaming-monitor-omen-oled-34/2103309870' },
    { name: "Tom's Hardware — HyperX Omen 34 V-Stripe QD-OLED", url: 'https://www.tomshardware.com/monitors/gaming-monitors/hps-hyperx-omen-34-gaming-monitor-delivers-v-stripe-qd-oled-tech-hyperx-branded-screen-boasts-360-hz-qhd-panel-kvm-and-100-watt-usb-c-pd' },
    { name: 'displayspecifications.com — HyperX Omen OLED 34', url: 'https://www.displayspecifications.com/en/news/8c091034' },
    { name: 'Notebookcheck — HyperX Omen 34-inch OLED', url: 'https://www.notebookcheck.net/HyperX-Omen-34-inch-OLED-gaming-monitor-debuts-with-360-Hz-refresh-rate-and-100-W-USB-C-port.1196932.0.html' },
    { name: 'TFTCentral — HP HyperX Omen OLED models (CES 2026)', url: 'https://tftcentral.co.uk/news/various-new-hp-hyperx-omen-oled-models-leaked-ahead-of-ces-2026' },
  ],
  'gigabyte-aorus-mo34wqc36': [
    { name: 'GIGABYTE — MO34WQC36 product page', url: 'https://www.gigabyte.com/Monitor/MO34WQC36' },
    { name: 'TFTCentral — MO34WQC36 (34" 360Hz 5th-Gen QD-OLED)', url: 'https://tftcentral.co.uk/news/gigabyte-unveil-the-mo34wqc36-with-a-34-360hz-ultrawide-5th-gen-qd-oled-panel' },
    { name: 'PC Monitors — MO34WQC36 360Hz QD-OLED Ultrawide', url: 'https://pcmonitors.info/gigabyte/gigabyte-mo34wqc36-360hz-qd-oled-ultrawide/' },
    { name: 'DisplaySpecifications — Gigabyte MO34WQC36', url: 'https://www.displayspecifications.com/en/model/5f7b462d' },
    { name: 'FlatpanelsHD — Gigabyte V-Stripe QD-OLED 2026 monitors', url: 'https://flatpanelshd.com/news.php?id=1767774706&subaction=showfull' },
  ],
  'dell-u2725qe': [
    {
      name: 'Dell UltraSharp 27 4K Thunderbolt Hub Monitor U2725QE — Dell (US)',
      url: 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-thunderbolt-hub-monitor-u2725qe/apd/210-bqhr/monitors-monitor-accessories',
    },
    { name: 'Dell U2725QE — displayspecifications', url: 'https://www.displayspecifications.com/en/model/4bbf3fd6' },
    { name: 'Dell UltraSharp U2725QE — Amazon', url: 'https://www.amazon.com/Dell-UltraSharp-U2725QE-Black-Monitor/dp/B0F18Q2GPN' },
    {
      name: 'Dell UltraSharp 27" 4K HDR 120Hz Monitor U2725QE — B&H Photo',
      url: 'https://www.bhphotovideo.com/c/product/1889853-REG/dell_u2725qe_ultrasharp_27_4k_uhd.html',
    },
    { name: 'Dell U2725QE review — RTINGS', url: 'https://www.rtings.com/monitor/reviews/dell/u2725qe' },
    {
      name: 'Dell UltraSharp U2725QE review — Expert Reviews',
      url: 'https://www.expertreviews.co.uk/technology/monitors/dell-ultrasharp-u2725qe-review',
    },
  ],
  'asus-pa278cgv': [
    {
      name: 'Asus ProArt Display PA278CGV — Tech Specs',
      url: 'https://www.asus.com/displays-desktops/monitors/proart/proart-display-pa278cgv/techspec/',
    },
    { name: 'Asus PA278CGV — displayspecifications', url: 'https://www.displayspecifications.com/en/model/53fc33b6' },
    {
      name: 'Asus ProArt PA278CGV — Amazon',
      url: 'https://www.amazon.com/ASUS-Display-Professional-Monitor-PA278CGV/dp/B0BQPYD97X',
    },
    {
      name: 'Asus ProArt PA278CGV — Newegg',
      url: 'https://www.newegg.com/asus-pa278cgv-27-0-qhd-144-hz-proart-ips-silver/p/N82E16824281263',
    },
    {
      name: 'Asus ProArt Display PA278CGV 144Hz QHD IPS with USB-C — PC Monitors',
      url: 'https://pcmonitors.info/asus/asus-proart-display-pa278cgv-144hz-qhd-ips-with-usb-c/',
    },
  ],
  'benq-gw2486tc': [
    { name: 'BenQ GW2486TC — Specifications (BenQ US)', url: 'https://www.benq.com/en-us/monitor/home/gw2486tc/spec.html' },
    { name: 'BenQ GW2486TC — displayspecifications', url: 'https://www.displayspecifications.com/en/model/d5a13c9f' },
    {
      name: 'BenQ GW2486TC — Best Buy',
      url: 'https://www.bestbuy.com/product/benq-gw2486tc-23-8-ips-led-1080p-fhd-100hz-usb-c-monitor-hdmi-dp-usb-c-white/J39QZT53WT',
    },
    {
      name: 'BenQ GW2486TC — B&H Photo',
      url: 'https://www.bhphotovideo.com/c/product/1839130-REG/benq_essential_gw2486tc_23_8_16_9.html',
    },
    { name: 'BenQ GW2486TC review — TechRadar', url: 'https://www.techradar.com/computing/monitors/benq-gw2486tc-eye-care-monitor-review' },
  ],
  'alienware-aw2726dm': [
    {
      name: 'Alienware 27 240Hz QD-OLED Gaming Monitor AW2726DM — Dell (US)',
      url: 'https://www.dell.com/en-us/shop/alienware-27-240hz-qd-oled-gaming-monitor-aw2726dm/apd/210-bvrc/monitors-monitor-accessories',
    },
    { name: 'Alienware AW2726DM — displayspecifications', url: 'https://www.displayspecifications.com/en/model/3c6f485c' },
    {
      name: 'Alienware AW2726DM — Best Buy',
      url: 'https://www.bestbuy.com/product/alienware-aw2726dm-27-qd-oled-qhd-240hz-0-03ms-freesync-premium-pro-gaming-monitor-with-hdr-hdmi-displayport-black/J3K4L6WZQ6',
    },
    {
      name: "Alienware AW2726DM review — Tom's Hardware",
      url: 'https://www.tomshardware.com/monitors/gaming-monitors/alienware-aw2726dm-27-inch-qhd-240-hz-qd-oled-gaming-monitor-review',
    },
    {
      name: 'Dell Alienware AW2726DM announced — TFTCentral',
      url: 'https://tftcentral.co.uk/news/dell-alienware-aw2726dm-announced-offering-a-new-affordable-qd-oled-option',
    },
    { name: 'Alienware AW2726DM review — RTINGS', url: 'https://www.rtings.com/monitor/reviews/dell/alienware-aw2726dm' },
  ],
  'asus-rog-strix-xg27jcg': [
    { name: 'Asus ROG Strix 5K XG27JCG — product page', url: 'https://rog.asus.com/us/monitors/27-to-31-5-inches/rog-strix-5k-xg27jcg/' },
    { name: 'Asus ROG Strix 5K XG27JCG — specifications', url: 'https://rog.asus.com/us/monitors/27-to-31-5-inches/rog-strix-5k-xg27jcg/spec/' },
    { name: 'Asus ROG Strix 5K XG27JCG — displayspecifications', url: 'https://www.displayspecifications.com/en/model/b71745cb' },
    {
      name: 'Asus ROG Strix 5K XG27JCG announced — TFTCentral',
      url: 'https://tftcentral.co.uk/news/asus-rog-strix-5k-xg27jcg-announced-with-a-27-5k-180hz-fast-ips-panel-and-dual-mode',
    },
    {
      name: "Asus ROG Strix XG27JCG review — Tom's Hardware",
      url: 'https://www.tomshardware.com/monitors/gaming-monitors/asus-rog-strix-xg27jcg-27-inch-5k-gaming-monitor-review',
    },
    { name: 'Asus ROG Strix 5K XG27JCG review — RTINGS', url: 'https://www.rtings.com/monitor/reviews/asus/rog-strix-5k-xg27jcg' },
    { name: 'Asus ROG Strix 5K XG27JCG — Amazon', url: 'https://www.amazon.com/ASUS-Strix-Gaming-Monitor-XG27JCG/dp/B0G31RDCMP' },
  ],
  'dell-ultrasharp-u3425we': [
    {
      name: 'Dell UltraSharp 34 Curved Thunderbolt Hub Monitor U3425WE — Dell (US)',
      url: 'https://www.dell.com/en-us/shop/dell-ultrasharp-34-curved-thunderbolt-hub-monitor-u3425we/apd/210-bmds',
    },
    {
      name: 'Dell U3425WE datasheet (PDF)',
      url: 'https://www.delltechnologies.com/asset/en-gb/products/electronics-and-accessories/technical-support/dell-ultrasharp-34-curved-thunderbolt-hub-monitor-u3425we-datasheet.pdf',
    },
    { name: 'Dell U3425WE — displayspecifications', url: 'https://www.displayspecifications.com/en/model/6180376b' },
    {
      name: 'Dell UltraSharp U3425WE — CDW',
      url: 'https://www.cdw.com/product/dell-ultrasharp-34-curved-thunderbolttm-hub-monitor-u3425we/7835414',
    },
    { name: 'Dell U3425WE review — RTINGS', url: 'https://www.rtings.com/monitor/reviews/dell/u3425we' },
    {
      name: 'Dell UltraSharp 34 Curved U3425WE review — HotHardware',
      url: 'https://hothardware.com/reviews/dell-u3425we-34-inch-ips-black-monitor-review',
    },
  ],
  'asus-proart-pa248crv': [
    {
      name: 'Asus ProArt PA248CRV — Tech Specs',
      url: 'https://www.asus.com/displays-desktops/monitors/proart/proart-display-pa248crv/techspec/',
    },
    { name: 'Asus ProArt PA248CRV — Amazon', url: 'https://www.amazon.com/ASUS-ProArt-Display-24-1-viewable/dp/B0BQPRWS8M' },
    {
      name: 'Asus ProArt PA248CRV — Walmart',
      url: 'https://www.walmart.com/ip/ASUS-MN-24-1-IPS-1920x1200-16-10-5ms-75Hz-USB-C-2xDP-2xHDMI-Speaker-PA248CRV/2567484350',
    },
    { name: 'Asus PA248CRV — displayspecifications', url: 'https://www.displayspecifications.com/en/model/562b2f7e' },
    {
      name: 'Asus ProArt PA248CRV — B&H Photo',
      url: 'https://www.bhphotovideo.com/c/product/1758200-REG/asus_proart_display_pa248crv_24.html',
    },
  ],
  'dell-s3425dw': [
    {
      name: 'Dell 34 Plus S3425DW — Dell (US)',
      url: 'https://www.dell.com/en-us/shop/dell-34-plus-usb-c-monitor-s3425dw/apd/210-brmv/monitors-monitor-accessories',
    },
    { name: 'Dell S3425DW — displayspecifications', url: 'https://www.displayspecifications.com/en/model/c5374173' },
    { name: 'Dell S3425DW — Amazon', url: 'https://www.amazon.com/Dell-Plus-USB-C-Curved-Monitor/dp/B0F1H325FN' },
    {
      name: 'Dell 34 Plus S3425DW review — Digital Camera World',
      url: 'https://www.digitalcameraworld.com/tech/monitors/dell-34-plus-s3425dw-curved-ultrawide-monitor-review',
    },
    {
      name: 'Dell 34 Plus S3425DW review — EFTM',
      url: 'https://eftm.com/2025/09/review-dell-34-plus-usb-c-monitor-s3425dw-the-jack-of-all-trades-monitor-266181',
    },
  ],
  'viewsonic-vg3820c': [
    {
      name: 'ViewSonic VG3820C — ViewSonic (US)',
      url: 'https://www.viewsonic.com/us/38-wqhd-21-9-ips-curved-monitor-with-96w-usb-c-vg3820c.html',
    },
    { name: 'ViewSonic VG3820C — ViewSonic (global)', url: 'https://www.viewsonic.com/global/products/lcd/VG3820C' },
    { name: 'ViewSonic VG3820C — displayspecifications', url: 'https://www.displayspecifications.com/en/model/acbf43df' },
    {
      name: 'ViewSonic VG3820C — Newegg',
      url: 'https://www.newegg.com/viewsonic-vg3820c-38-wqhd-75hz-ips-panel-black/p/0JC-0015-009T4',
    },
    {
      name: 'ViewSonic VG3820C — Amazon',
      url: 'https://www.amazon.com/ViewSonic-Productive-Multi-Tasking-Ergonomics-DisplayPort/dp/B0FP1FQL1D',
    },
  ],
  'lg-32g620b-b': [
    { name: 'LG 32G620B-B — LG (US)', url: 'https://www.lg.com/us/monitors/lg-32g620b-b-gaming-monitor' },
    { name: 'LG 32G620B-B — LG (UK)', url: 'https://www.lg.com/uk/monitors/gaming-monitor/32g620b-b/' },
    { name: 'LG 32G620B — displayspecifications', url: 'https://www.displayspecifications.com/en/model/5485484a' },
    {
      name: 'LG UltraGear G6 32G620B-B — B&H',
      url: 'https://www.bhphotovideo.com/c/product/1957519-REG/lg_32g620b_b_ausq_32_ultragear_qhd_1440p.html',
    },
    {
      name: 'LG UltraGear G6 32G620B-B — Micro Center',
      url: 'https://www.microcenter.com/product/709705/lg-ultragear-g6-32g620b-bausq-315-2k-qhd-(2560-x-1440)-200hz-gaming-monitor',
    },
  ],
  'viewsonic-vx3276-2k-mhd': [
    {
      name: 'ViewSonic VX3276-2K-mhd — ViewSonic (US)',
      url: 'https://www.viewsonic.com/us/vx3276-2k-mhd-32-1440p-thin-bezel-ips-monitor-with-hdmi-dp-and-mini-dp.html',
    },
    { name: 'ViewSonic VX3276-2K-mhd — ViewSonic (global)', url: 'https://www.viewsonic.com/global/products/lcd/VX3276-2K-mhd' },
    { name: 'ViewSonic VX3276-2K-mhd — displayspecifications', url: 'https://www.displayspecifications.com/en/model/c835107f' },
    {
      name: 'ViewSonic VX3276-2K-MHD — Amazon',
      url: 'https://www.amazon.com/ViewSonic-VX3276-2K-MHD-Frameless-Widescreen-DisplayPort/dp/B0787XMLZQ',
    },
    {
      name: 'ViewSonic VX3276-2K-MHD — B&H',
      url: 'https://www.bhphotovideo.com/c/product/1435955-REG/viewsonic_vx3276_2k_mhd_32_ips_qhd_ultra_slim.html',
    },
  ],
  'lg-34gx900a-b': [
    { name: 'LG 34GX900A-B — LG (US)', url: 'https://www.lg.com/us/monitors/lg-34gx900a-b-gaming-monitor' },
    {
      name: 'LG UltraGear 34GX900A (34" OLED, 800R) — TFTCentral',
      url: 'https://tftcentral.co.uk/news/lg-ultragear-34gx900a-launched-with-a-34-ultrawide-oled-panel-and-240hz-refresh-rate',
    },
    {
      name: 'LG 34GX900A-B — Amazon',
      url: 'https://www.amazon.com/LG-34GX900A-B-Ultragear-DisplayHDR-DisplayPort/dp/B0FDC2JBYG',
    },
    {
      name: 'UltraGear OLED 34GX900A — Notebookcheck',
      url: 'https://www.notebookcheck.net/UltraGear-OLED-34GX900A-LG-refreshes-34-inch-OLED-gaming-monitor-with-new-release.1083170.0.html',
    },
    {
      name: 'LG UltraGear GX9 34GX900A — Guru3D',
      url: 'https://www.guru3d.com/story/lg-ultragear-gx9-oled-curved-gaming-monitor-34gx900a/',
    },
  ],
  'lg-27gl83a-b': [
    { name: 'LG 27GL83A-B — LG (US)', url: 'https://www.lg.com/us/monitors/lg-27gl83a-b-gaming-monitor' },
    { name: 'LG 27GL83A-B — displayspecifications', url: 'https://www.displayspecifications.com/en/model/3d1d1b57' },
    {
      name: 'LG 27GL850-B / 27GL83A-B review — RTINGS',
      url: 'https://www.rtings.com/monitor/reviews/lg/27gl850-b-27gl83a-b',
    },
    {
      name: 'LG 27GL83A-B — Amazon',
      url: 'https://www.amazon.com/LG-27GL83A-B-Ultragear-Compatible-Monitor/dp/B07YGZL8XF',
    },
    { name: 'LG 27GL83A-B — Newegg', url: 'https://www.newegg.com/lg-27gl83a-b-27-qhd-144-hz-ultragear-ips/p/N82E16824026281' },
  ],
  'samsung-s32d850t': [
    {
      name: 'Samsung SD850 S32D850T — Samsung (US)',
      url: 'https://www.samsung.com/us/computing/monitors/wqhd/s32d850t-samsung-wqhd-32-led-monitor-ls32d85ktsr-za/',
    },
    { name: 'Samsung S32D850T — displayspecifications (32", AMVA)', url: 'https://www.displayspecifications.com/en/model/30fe6ba' },
    {
      name: 'Samsung S27D850T & S32D850T — PC Monitors',
      url: 'https://pcmonitors.info/samsung/samsung-s27d850t-and-s32d850t/',
    },
    {
      name: 'S27D850T (S-PLS) & S32D850T (A-MVA) — [H]ardForum',
      url: 'https://hardforum.com/threads/samsung-s27d850t-1440p-s-pls-s32d850t-1440p-a-mva.1822366/',
    },
    {
      name: 'Samsung S32D850T (31.5" viewable listing) — Newegg',
      url: 'https://www.newegg.com/samsung-s32d850t-32-wqhd/p/N82E16824001971',
    },
  ],
  'aoc-q32g11zne': [
    { name: 'AOC Q32G11ZNE — Amazon', url: 'https://www.amazon.com/AOC-Q32G11ZNE-Frameless-Response-Guarantee/dp/B0DF9SKLL2' },
    { name: 'AOC Q32G11ZNE — displayspecifications', url: 'https://www.displayspecifications.com/en/model/7ab7393f' },
    {
      name: 'AOC Q32G11ZNE — Slickdeals',
      url: 'https://slickdeals.net/f/18043866-32-aoc-q32g11zne-frameless-qhd-240hz-1ms-va-panel-hdr400-gaming-monitor-199-99-f-s',
    },
    {
      name: 'AOC Q32G11ZNE — eDealinfo',
      url: 'https://www.edealinfo.com/d/00685417738182/AOC-Q32G11ZNE-32-inch-Widescreen-WQHD-1440p-2560-x-1440-240Hz',
    },
  ],
}
