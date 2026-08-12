const EMPHASIZED_FILL = "#2563eb"; // blue-600, focused day
const MUTED_FILL = "#9ca3af"; // gray-400, other days
const ACCOMMODATION_EMPHASIZED_FILL = "#4f46e5"; // indigo-600, focused day
const ACCOMMODATION_MUTED_FILL = "#a5b4fc"; // indigo-300, other days

function buildPinSvg(number: number, fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 25 17 25s17-12.25 17-25C34 7.611 26.389 0 17 0z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="17" cy="17" r="10.5" fill="#ffffff"/>
    <text x="17" y="21.5" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="13" font-weight="700" fill="${fill}" text-anchor="middle" dominant-baseline="middle">${number}</text>
  </svg>`;
}

// A small bed glyph (headboard + mattress + legs), drawn as plain shapes
// rather than an emoji/icon font so it renders consistently as a map overlay.
function buildBedGlyph(fill: string): string {
  return `<g transform="translate(10.5, 11.5)">
    <path d="M0 9.5V2.2a1 1 0 0 1 1-1h2.6a1 1 0 0 1 1 1V6h4V2.2a1 1 0 0 1 1-1H12a1 1 0 0 1 1 1v7.3" fill="none" stroke="${fill}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M0 6.8h13" stroke="${fill}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M0 9.5v1.6M13 9.5v1.6" stroke="${fill}" stroke-width="1.4" stroke-linecap="round"/>
  </g>`;
}

function buildAccommodationPinSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 25 17 25s17-12.25 17-25C34 7.611 26.389 0 17 0z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="17" cy="17" r="10.5" fill="#ffffff"/>
    ${buildBedGlyph(fill)}
  </svg>`;
}

/**
 * A pin icon with the stop's number in a badge at the top, anchored so the
 * pin's tip (not the number) points at the exact coordinate. Focused-day
 * pins render larger/blue; other days render smaller/gray for contrast.
 * (Country colors are shown in the list — stop badges, day dots, legend —
 * rather than on the map pins, to keep the map itself uncluttered.)
 */
export function createNumberedPinIcon(
  number: number,
  emphasized: boolean
): google.maps.Icon {
  const fill = emphasized ? EMPHASIZED_FILL : MUTED_FILL;
  const svg = buildPinSvg(number, fill);
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const width = emphasized ? 34 : 24;
  const height = emphasized ? 42 : 30;
  return {
    url,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
}

/**
 * A distinct indigo/bed-icon pin marking where a day's accommodation is
 * located, so it stands out from the numbered stop pins on the map.
 */
export function createAccommodationPinIcon(
  emphasized: boolean
): google.maps.Icon {
  const fill = emphasized
    ? ACCOMMODATION_EMPHASIZED_FILL
    : ACCOMMODATION_MUTED_FILL;
  const svg = buildAccommodationPinSvg(fill);
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const width = emphasized ? 34 : 24;
  const height = emphasized ? 42 : 30;
  return {
    url,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
}
