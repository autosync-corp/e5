# Franklin Gothic Fonts Setup

## Current Status

✅ **Franklin Gothic Heavy Regular** is installed and configured!
- Location: `src/assets/fonts/Franklin Gothic Heavy Regular.ttf`
- All font variants (Heavy, Demi, Medium, Book, Excon) are currently using this single font file

## Font Variants (Optional Enhancement)

For better visual hierarchy, you can add these additional font weights:

1. **Franklin Gothic Heavy** (font-weight: 900) - ✅ Installed
2. **Franklin Gothic Demi** (font-weight: 600) - Using Heavy as fallback
3. **Franklin Gothic Medium** (font-weight: 500) - Using Heavy as fallback
4. **Franklin Gothic Book** (font-weight: 400) - Using Heavy as fallback
5. **Excon Variable** (variable font) - Using Heavy as fallback

## Download Sources

### Franklin Gothic Fonts
You can download Franklin Gothic fonts from these sources:

- **FontsGeek**: https://fontsgeek.com/fonts/Franklin-Gothic-Heavy-Regular
- **FreeBestFonts**: https://www.freebestfonts.com/franklin-gothic-heavy-font
- **Font.Download**: https://font.download/font/franklin-gothic

### Important Licensing Note
⚠️ **Franklin Gothic is a commercial font**. Free versions are available for personal/testing use only. For commercial use (like this E5 Wheels project), you need to purchase a proper license from:
- Adobe Fonts (included with Creative Cloud)
- MyFonts.com
- ITC (International Typeface Corporation)

## Installation Instructions

### Method 1: Manual Download (Recommended)

1. Download each font variant (Heavy, Demi, Medium, Book)
2. Convert to web formats if needed:
   - `.woff2` (best compression, modern browsers)
   - `.woff` (fallback for older browsers)
   - `.ttf` (fallback)

3. Place the font files in this directory (`assets/fonts/`) with these names:
   ```
   FranklinGothic-Heavy.woff2
   FranklinGothic-Heavy.woff
   FranklinGothic-Heavy.ttf
   FranklinGothic-Demi.woff2
   FranklinGothic-Demi.woff
   FranklinGothic-Demi.ttf
   FranklinGothic-Medium.woff2
   FranklinGothic-Medium.woff
   FranklinGothic-Medium.ttf
   FranklinGothic-Book.woff2
   FranklinGothic-Book.woff
   FranklinGothic-Book.ttf
   Excon-Variable.woff2 (optional)
   Excon-Variable.woff (optional)
   Excon-Variable.ttf (optional)
   ```

### Method 2: Use Adobe Fonts (If you have Creative Cloud)

1. Go to https://fonts.adobe.com/
2. Search for "Franklin Gothic"
3. Activate the web project
4. Copy the embed code
5. Add to your project's `index.html`

### Method 3: Convert Fonts to Web Formats

Use online converters:
- **Font Squirrel Webfont Generator**: https://www.fontsquirrel.com/tools/webfont-generator
- **CloudConvert**: https://cloudconvert.com/ttf-to-woff2

Upload your `.ttf` or `.otf` files and download the web-optimized versions.

## Verification

After adding the fonts, the `fonts.css` file in this directory will automatically load them. The fonts are already imported in the main application.

To verify fonts are working:
1. Start the dev server: `npm run dev`
2. Open browser DevTools
3. Go to Network tab → Filter by "Font"
4. Check that font files are loading successfully
5. Use the Font inspector to verify Franklin Gothic is being used

## Fallback Fonts

If fonts are not loaded, the application will fall back to:
- Arial
- Helvetica
- sans-serif

These provide similar letter spacing and readability while fonts are being set up.
