export const AVATAR_COLORS = [
  '#2d6a4f', // green-900
  '#1b4332', // green-dark
  '#52b788', // green-accent
  '#74c69d', // green-light
  '#95d5b2', // green-lighter
  '#d62828', // red
  '#f4a261', // red-orange
  '#f77f00', // orange
  '#fcbf49', // yellow
  '#e8b44f', // yellow-gold
  '#006994', // blue
  '#0077be', // blue-bright
  '#4ecdc4', // teal
  '#44a08d', // teal-dark
  '#8338ec', // purple
  '#b5338e', // purple-dark
  '#ff006e', // pink
  '#ff3366', // pink-bright
  '#e63946', // crimson
  '#a4161a', // dark-red
  '#1d3557', // navy
  '#457b9d', // slate-blue
  '#a8dadc', // light-cyan
  '#457d58', // forest-green
  '#f4a261', // terracotta
  '#2a9d8f', // seafoam
  '#e76f51', // burnt-orange
  '#d4a574', // tan
  '#c1666b', // dusty-rose
  '#d279a6', // mauve
];

export const getUserColor = (uuid) => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash) + uuid.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
