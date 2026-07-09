// SEO static-page manifest. Generated from the monitor data at build time by the
// `build-seo-pages` script — never hand-maintained, so it grows automatically as
// classes are added. Everything under src/seo/ is used ONLY by that script (it is
// not imported by the app), so it adds nothing to the app bundle.
import { CURVATURE_PRESETS, DEFAULT_PREFERENCES, DEFAULT_SIMULATOR, PRESETS } from '../constants'
import { MONITOR_CLASSES, type MonitorClass } from '../data'
import { aspectRatioLabel } from '../lib/geometry'
import { encodeState, type AppState } from '../lib/urlState'
import type { Monitor } from '../types'
import { curveName } from './curve'
import type { CurvatureConceptProps } from './CurvatureConcept'
import type { CurveExplainerProps } from './CurveExplainer'
import type { ResolutionExplainerProps } from './ResolutionExplainer'
import type { SizeExplainerProps } from './SizeExplainer'

interface BasePage {
  /** URL path segment → written to dist/<path>/index.html (single segment, so
   *  in-page links to the app can use "../"). */
  path: string
  title: string
  description: string
}

/** A generated page, discriminated by which explainer renders it. `render.tsx`
 *  switches on `kind` to pick the component; the build script and sitemap are
 *  kind-agnostic and pick up every page automatically. */
export type StaticPage =
  | (BasePage & { kind: 'resolution'; props: ResolutionExplainerProps })
  | (BasePage & { kind: 'size'; props: SizeExplainerProps })
  | (BasePage & { kind: 'curve'; props: CurveExplainerProps })
  | (BasePage & { kind: 'curve-concept'; props: CurvatureConceptProps })

const resKey = (w: number, h: number) => `${w}x${h}`

/** Marketing name per resolution, parsed from the preset labels ("QHD — 2560 × 1440" → "QHD"). */
const MARKETING_NAME: Record<string, string> = Object.fromEntries(
  PRESETS.map((p) => [resKey(p.resWidth, p.resHeight), p.label.split('—')[0].trim()]),
)

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** A shareable comparison-tool link that opens these classes in the interactive app. */
function compareHref(classes: MonitorClass[]): string {
  const monitors: Monitor[] = classes.map((c, i) => ({
    id: `seo-${i}`,
    name: `${c.diagonal}" ${c.resWidth}×${c.resHeight}`,
    resWidth: c.resWidth,
    resHeight: c.resHeight,
    diagonal: c.diagonal,
    curveRadius: c.curveRadius,
    visible: true,
    classId: c.id,
  }))
  const state: AppState = {
    tool: 'comparison',
    themeChoice: null,
    myMonitors: [],
    monitors,
    alignment: 'center',
    topViewAlign: 'front',
    preferences: DEFAULT_PREFERENCES,
    checkScreen: null,
    visibleFrame: null,
    simulator: DEFAULT_SIMULATOR,
  }
  // Pages live one directory deep (/slug/), so "../" reaches the app root on both
  // the custom domain and the project-pages base.
  return `../#${encodeState(state)}`
}

/** Every resolution shared by ≥2 distinct diagonals — "same pixels, different size". */
function getResolutionPages(): StaticPage[] {
  const byRes = new Map<string, MonitorClass[]>()
  for (const c of MONITOR_CLASSES) {
    const k = resKey(c.resWidth, c.resHeight)
    ;(byRes.get(k) ?? byRes.set(k, []).get(k)!).push(c)
  }

  const groups = [...byRes.entries()]
    .map(([k, classes]) => {
      // One class per distinct diagonal (a resolution may exist at several curve
      // variants of the same size), sorted by diagonal ascending.
      const seen = new Set<number>()
      const uniqueByDiag = [...classes]
        .sort((a, b) => a.diagonal - b.diagonal)
        .filter((c) => (seen.has(c.diagonal) ? false : (seen.add(c.diagonal), true)))
      return { k, classes: uniqueByDiag }
    })
    .filter(({ classes }) => classes.length >= 2)

  return groups.map(({ k, classes }) => {
    const { resWidth, resHeight } = classes[0]
    const name = MARKETING_NAME[k] ?? `${resWidth}×${resHeight}`
    const diagonals = [...new Set(classes.map((c) => c.diagonal))]
    const sizeList = diagonals.map((d) => `${d}″`).join(', ')
    const nameInSlug = MARKETING_NAME[k] ? `${slugify(name)}-` : ''

    return {
      kind: 'resolution' as const,
      path: `${nameInSlug}${resWidth}x${resHeight}`,
      title: `${name} (${resWidth}×${resHeight}) monitor sizes: ${sizeList} compared`,
      description: `The same ${resWidth}×${resHeight} (${name}) resolution at ${sizeList} — see how physical size, pixel density and sharpness change with the diagonal, drawn to scale.`,
      props: {
        resWidth,
        resHeight,
        marketingName: name,
        ratioLabel: aspectRatioLabel(resWidth, resHeight),
        classes,
        compareHref: compareHref(classes),
      },
    }
  })
}

/** Every diagonal offered at ≥2 distinct resolutions — "same size, different
 *  pixels". The flip side of the resolution pages: here the panel is one fixed
 *  physical size and only the pixel density changes. */
function getSizePages(): StaticPage[] {
  const byDiag = new Map<number, MonitorClass[]>()
  for (const c of MONITOR_CLASSES) {
    ;(byDiag.get(c.diagonal) ?? byDiag.set(c.diagonal, []).get(c.diagonal)!).push(c)
  }

  const groups = [...byDiag.entries()]
    .map(([diagonal, classes]) => {
      // One class per distinct resolution (a diagonal may list several curve
      // variants of the same resolution), sorted by pixel count ascending.
      const seen = new Set<string>()
      const uniqueByRes = [...classes]
        .sort((a, b) => a.resWidth * a.resHeight - b.resWidth * b.resHeight)
        .filter((c) => {
          const k = resKey(c.resWidth, c.resHeight)
          return seen.has(k) ? false : (seen.add(k), true)
        })
      return { diagonal, classes: uniqueByRes }
    })
    .filter(({ classes }) => classes.length >= 2)
    .sort((a, b) => a.diagonal - b.diagonal)

  return groups.map(({ diagonal, classes }) => {
    const resolutions = classes.map((c) => ({
      c,
      name: MARKETING_NAME[resKey(c.resWidth, c.resHeight)] ?? `${c.resWidth}×${c.resHeight}`,
    }))
    const nameList = resolutions.map((r) => r.name).join(' vs ')

    return {
      kind: 'size' as const,
      path: `${slugify(`${diagonal}`)}-inch-monitor`,
      title: `${diagonal}″ monitor resolutions compared: ${nameList} (PPI & sharpness)`,
      description: `How a ${diagonal}-inch monitor looks at ${nameList} — the same physical size at different pixel densities. Compare PPI, pixel pitch and sharpness, drawn to scale.`,
      props: {
        diagonal,
        resolutions,
        compareHref: compareHref(classes),
      },
    }
  })
}

/** Curvature radius, treating a flat panel as the straightest (largest radius),
 *  so sorting descending orders flat → gentle → tight. */
const curveRank = (c: MonitorClass) => c.curveRadius ?? Infinity

/** Every panel (a diagonal + resolution) offered at ≥2 distinct curvatures —
 *  "same panel, different curve". */
function getCurvePages(): StaticPage[] {
  const byPanel = new Map<string, MonitorClass[]>()
  for (const c of MONITOR_CLASSES) {
    const k = `${c.diagonal}-${resKey(c.resWidth, c.resHeight)}`
    ;(byPanel.get(k) ?? byPanel.set(k, []).get(k)!).push(c)
  }

  const groups = [...byPanel.values()]
    .map((classes) => {
      // One class per distinct curvature, flattest → tightest.
      const seen = new Set<number>()
      return [...classes]
        .sort((a, b) => curveRank(b) - curveRank(a))
        .filter((c) => {
          const k = c.curveRadius ?? 0
          return seen.has(k) ? false : (seen.add(k), true)
        })
    })
    .filter((variants) => variants.length >= 2)
    .sort((a, b) => a[0].diagonal - b[0].diagonal)

  return groups.map((classes) => {
    const { diagonal, resWidth, resHeight } = classes[0]
    const variants = classes.map((c) => ({ c, name: curveName(c.curveRadius) }))
    const nameList = variants.map((v) => v.name).join(' vs ')
    const curvedList = variants
      .filter((v) => v.c.curveRadius)
      .map((v) => v.name)
      .join(', ')

    return {
      kind: 'curve' as const,
      path: `${slugify(`${diagonal}`)}-inch-${resWidth}x${resHeight}-curvature`,
      title: `${diagonal}″ ${resWidth}×${resHeight} curvature compared: ${nameList}`,
      description: `The same ${diagonal}-inch ${resWidth}×${resHeight} panel flat and at ${curvedList} — see how curve depth, screen wrap and the ideal viewing distance change, drawn from above.`,
      props: {
        diagonal,
        resWidth,
        resHeight,
        variants,
        compareHref: compareHref(classes),
      },
    }
  })
}

/** A single, generic explainer of what curvature radii mean, illustrated on one
 *  representative ultrawide shown flat and at every common radius. */
function getCurvatureConceptPage(): StaticPage {
  // A representative wide panel (34″ 3440×1440); the numbers are illustrative, so
  // this is independent of what the catalogue happens to contain.
  const EXAMPLE = { diagonal: 34, resWidth: 3440, resHeight: 1440 }
  const radii: (number | null)[] = [null, ...[...CURVATURE_PRESETS].sort((a, b) => b - a)]
  const variants = radii.map((r) => ({
    c: {
      id: `concept-${r ?? 'flat'}`,
      curveRadius: r,
      ...EXAMPLE,
    } as MonitorClass,
    name: curveName(r),
  }))

  // The CTA loads a real flat-vs-curved pair from the catalogue.
  const ctaClasses = MONITOR_CLASSES.filter(
    (c) => c.diagonal === EXAMPLE.diagonal && c.resWidth === EXAMPLE.resWidth && c.resHeight === EXAMPLE.resHeight,
  ).sort((a, b) => curveRank(b) - curveRank(a))

  return {
    kind: 'curve-concept',
    path: 'monitor-curvature-explained',
    title: 'Monitor curvature explained: what 1000R, 1800R and 2300R mean',
    description:
      'A plain-English guide to monitor curvature: what the R number means, how curve depth and screen wrap change with the radius, the ideal viewing distance, and when a curve helps or hurts (documents and CAD vs. media and games).',
    props: {
      variants,
      exampleDiagonal: EXAMPLE.diagonal,
      compareHref: compareHref(ctaClasses.length ? ctaClasses : []),
    },
  }
}

/** Every generated static page — resolution, size, and curvature. */
export function getStaticPages(): StaticPage[] {
  return [...getResolutionPages(), ...getSizePages(), ...getCurvePages(), getCurvatureConceptPage()]
}
