export interface AssetImageConfig {
  width: number;
  height: number;
  debugScale?: number;
}

export interface FontConfig {
  /**
   * This is the name that will be used in CSS font-family declarations.
   */
  name: string;
  /**
   * URL or path to the font file.
   * Supports:
   * - HTTP/HTTPS URLs: `https://example.com/fonts/Font.ttf`
   * - Web paths: `/fonts/Font.ttf` (resolved from public directory)
   * - Relative paths: `./fonts/Font.ttf` (for package fonts)
   * - Absolute file system paths: `/absolute/path/to/Font.ttf`
   */
  url: string;
  /** Font weight (100-900) */
  weight: number;
  /** Font style */
  style: "normal" | "italic";
}

export interface FontConfiguration {
  fonts?: FontConfig[];
}
