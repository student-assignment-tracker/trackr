// Color palette for classes. Each entry has a solid color for dots/strips
// and a soft tint for backgrounds. Chosen to harmonize with the sage accent.
export const CLASS_COLORS = [
  { id: "sage",    solid: "#4A6B5C", soft: "#DCE5DF" },
  { id: "terra",   solid: "#B5553D", soft: "#F0D9D2" },
  { id: "amber",   solid: "#B8860B", soft: "#F0E4C6" },
  { id: "slate",   solid: "#556B7D", soft: "#D8DEE4" },
  { id: "plum",    solid: "#7D4E6B", soft: "#E6D6DF" },
  { id: "moss",    solid: "#6B7D3D", soft: "#E0E5D2" },
  { id: "ocean",   solid: "#3D6B7D", soft: "#D2DEE5" },
  { id: "clay",    solid: "#8B6F47", soft: "#E8DECE" },
];

// Fallback when a class has no color set or its color id is unknown.
export const DEFAULT_CLASS_COLOR = CLASS_COLORS[0];

export function getClassColor(colorId) {
  return CLASS_COLORS.find((c) => c.id === colorId) ?? DEFAULT_CLASS_COLOR;
}
