import type { SourceLink } from './types'

/**
 * Research sources per model id — the pages cross-checked when the model's specs
 * were catalogued (see the check-monitor skill). Keyed by MonitorModel.id; each
 * value is the list of sources actually used. Keys are validated against
 * MONITOR_MODELS in index.ts.
 */
export const MODEL_SOURCES: Record<string, SourceLink[]> = {
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
