/**
 * Returns season-specific Tailwind class strings.
 * Since Tailwind purges by static string matching, we must keep full class names here.
 */
export function getSeasonClasses(season) {
  const isHarmattan = season === 'harmattan';
  return {
    // Text colors
    accentText: isHarmattan ? 'text-harmattan' : 'text-rain',
    accentTextLight: isHarmattan ? 'text-harmattan-light' : 'text-rain-light',

    // Background fills
    accentBg: isHarmattan ? 'bg-harmattan' : 'bg-rain',
    accentBgLight: isHarmattan ? 'bg-harmattan-light' : 'bg-rain-light',
    accentBgDim: isHarmattan ? 'bg-harmattan/10' : 'bg-rain/10',

    // Border colors
    accentBorder: isHarmattan ? 'border-harmattan' : 'border-rain',
    accentBorderDim: isHarmattan ? 'border-harmattan/40' : 'border-rain/40',

    // Gradient button (CTA)
    gradientBtn: isHarmattan
      ? 'bg-gradient-to-r from-harmattan to-harmattan-light hover:shadow-harmattan/20'
      : 'bg-gradient-to-r from-rain to-rain-light hover:shadow-rain/20',

    // Gradient text span
    gradientText: isHarmattan
      ? 'from-harmattan via-amber-200 to-harmattan-light'
      : 'from-rain via-teal-200 to-rain-light',

    // Pill background for toggle active
    pillBg: isHarmattan ? 'bg-harmattan' : 'bg-rain',

    // Icon color
    iconColor: isHarmattan ? 'text-harmattan' : 'text-rain',

    // Hover borders
    hoverBorder: isHarmattan ? 'hover:border-harmattan/40' : 'hover:border-rain/40',
  };
}
