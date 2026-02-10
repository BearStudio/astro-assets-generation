import React, { type ReactNode } from "react";
import type { FontConfig } from "../types";
import { DEFAULT_FONTS } from "../theme";
import { getConfiguredFonts } from "../image";

export interface FontWrapperProps {
  children: ReactNode;
  /** Custom fonts to add to the font stack (optional, will use globally configured fonts if not provided) */
  customFonts?: FontConfig[];
  /** Primary font family name(s) - will be prepended to the font stack */
  fontFamily?: string;
  /** Additional CSS styles */
  style?: React.CSSProperties;
}

/**
 * FontWrapper component that manages fonts for both Latin and non-Latin characters.
 * 
 * This component:
 * - Uses globally configured custom fonts (via configure()) or accepts customFonts prop
 * - Automatically includes non-Latin character fonts (Thai, Japanese, Korean, Arabic)
 * - Creates a font stack that ensures proper rendering of multilingual content
 * 
 * @example
 * ```tsx
 * <FontWrapper fontFamily="Geist, sans-serif">
 *   <h1>Hello 世界 مرحبا</h1>
 * </FontWrapper>
 * ```
 */
export function FontWrapper({
  children,
  customFonts,
  fontFamily,
  style,
}: FontWrapperProps) {
  // Use provided customFonts or get from global configuration
  const fontsToUse = customFonts ?? getConfiguredFonts();
  
  // Build font stack: custom fonts first, then default non-latin fonts
  const nonLatinFontNames = DEFAULT_FONTS.map((font) => font.name);
  const customFontNames = fontsToUse.map((font) => font.name);
  
  // Create font-family string
  // The fontFamily prop is the user's preference (e.g., "Geist, sans-serif")
  // We extract just the font name if it's provided, or use the custom font names
  const primaryFontName = fontFamily?.split(",")[0]?.trim();
  
  const fontFamilyStack = [
    primaryFontName, // User's primary font name (first part of fontFamily)
    ...customFontNames.filter(name => name !== primaryFontName), // Other custom fonts
    ...nonLatinFontNames, // Non-latin character fonts
    "sans-serif", // Generic fallback
  ]
    .filter(Boolean) // Remove undefined/null values
    .join(", ");

  return (
    <div
      style={{
        fontFamily: fontFamilyStack,
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
