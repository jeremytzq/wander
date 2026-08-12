const EMPHASIZED_FILL = "#2563eb"; // blue-600, focused day
const MUTED_FILL = "#9ca3af"; // gray-400, other days

function buildPinSvg(number: number, fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 25 17 25s17-12.25 17-25C34 7.611 26.389 0 17 0z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="17" cy="17" r="10.5" fill="#ffffff"/>
    <text x="17" y="21.5" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="13" font-weight="700" fill="${fill}" text-anchor="middle" dominant-baseline="middle">${number}</text>
  </svg>`;
}

/**
 * A pin icon with the stop's number in a badge at the top, anchored so the
 * pin's tip (not the number) points at the exact coordinate. Focused-day
 * pins render larger/blue; other days render smaller/gray for contrast.
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
