export interface AssetImageConfig {
  width: number;
  height: number;
  debugScale?: number;
}

export interface FontConfig {
  name: string;
  url: string;
  weight: number;
  style: "normal" | "italic";
}
