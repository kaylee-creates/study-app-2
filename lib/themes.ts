export interface ThemeDefinition {
  id: string;
  name: string;
  cost: number;
  colors: string[];
  youtubeUrl: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "original",
    name: "Original",
    cost: 0,
    colors: ["#f8c8d4", "#f5e6a3", "#c5e6c0", "#f2a7b0", "#fdf5f0"],
    youtubeUrl: "https://www.youtube.com/watch?v=yeBdCjMwsU8",
  },
  {
    id: "berry",
    name: "Berry",
    cost: 40,
    colors: ["#F9DBBD", "#FFA5AB", "#DA627D", "#A53860", "#450920"],
    youtubeUrl: "",
  },
  {
    id: "icecream",
    name: "Ice Cream Sundae",
    cost: 80,
    colors: ["#E27396", "#EB9AB2", "#EFCFE3", "#ECF2D8", "#B3DEE2"],
    youtubeUrl: "",
  },
  {
    id: "ocean",
    name: "Ocean",
    cost: 160,
    colors: ["#CAF0F8", "#48CAE4", "#0077B6", "#03045E"],
    youtubeUrl: "https://www.youtube.com/watch?v=gUbNlN_SqpE",
  },
  {
    id: "sunny",
    name: "Sunny Day",
    cost: 320,
    colors: ["#6698CC", "#B4B534", "#F2D88F", "#E36888", "#F08C21"],
    youtubeUrl: "",
  },
];

export function getThemeById(id: string): ThemeDefinition | undefined {
  return THEMES.find((t) => t.id === id);
}

export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
