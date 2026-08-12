function buildPinSvg(number: number, fill: string, opacity: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42" opacity="${opacity}">
    <path d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 25 17 25s17-12.25 17-25C34 7.611 26.389 0 17 0z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="17" cy="17" r="10.5" fill="#ffffff"/>
    <text x="17" y="21.5" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="13" font-weight="700" fill="${fill}" text-anchor="middle" dominant-baseline="middle">${number}</text>
  </svg>`;
}

/**
 * A pin icon with the stop's number in a badge at the top, anchored so the
 * pin's tip (not the number) points at the exact coordinate. `color` is the
 * stop's country color (see lib/country-colors.ts); focused-day pins render
 * larger and at full opacity, other days render smaller and faded so the
 * hue (and therefore country) still reads at a glance.
 */
export function createNumberedPinIcon(
  number: number,
  emphasized: boolean,
  color: string
): google.maps.Icon {
  const svg = buildPinSvg(number, color, emphasized ? 1 : 0.55);
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const width = emphasized ? 34 : 24;
  const height = emphasized ? 42 : 30;
  return {
    url,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
}
