export type ThemeMode = 'dark' | 'light';

export interface Theme {
  mode: ThemeMode;
  headerBg: string;
  footerBg: string;
  menuBg: string;
  outputBg: string;
  selectionBg: string;
  selectionFg: string;
  divider: string;
}

/**
 * Queries the terminal for its background color using OSC 11 escape sequence.
 * This is the most reliable method to detect terminal dark/light mode.
 * 
 * Falls back to COLORFGBG env var if the terminal doesn't respond to OSC 11,
 * then to 'dark' as a final default.
 */
export async function detectThemeMode(): Promise<ThemeMode> {
  // Can't query if not a TTY
  if (!process.stdin.isTTY) {
    return detectThemeModeFallback();
  }

  return new Promise((resolve) => {
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener('data', handler);
      clearTimeout(timeout);
    };

    const handler = (data: Buffer) => {
      const str = data.toString();
      // OSC 11 response: \x1b]11;rgb:RRRR/GGGG/BBBB\x07 (BEL) or \x1b\\ (ST)
      const match = str.match(/\x1b]11;([^\x07\x1b]+)/);
      if (match) {
        cleanup();
        const color = match[1];
        const luminance = parseColorToLuminance(color);
        resolve(luminance > 0.5 ? 'light' : 'dark');
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.on('data', handler);
    // OSC 11 query: request background color
    process.stdout.write('\x1b]11;?\x07');

    timeout = setTimeout(() => {
      cleanup();
      resolve(detectThemeModeFallback());
    }, 300);
  });
}

function parseColorToLuminance(color: string): number {
  let r = 0, g = 0, b = 0;

  if (color.startsWith('rgba:')) {
    // rgba:RRRR/GGGG/BBBB/AAAA (16-bit per channel, ignore alpha)
    const parts = color.substring(5).split('/');
    r = parseInt(parts[0], 16) >> 8;
    g = parseInt(parts[1], 16) >> 8;
    b = parseInt(parts[2], 16) >> 8;
  } else if (color.startsWith('rgb:')) {
    // rgb:RRRR/GGGG/BBBB (16-bit per channel)
    const parts = color.substring(4).split('/');
    r = parseInt(parts[0], 16) >> 8;
    g = parseInt(parts[1], 16) >> 8;
    b = parseInt(parts[2], 16) >> 8;
  } else if (color.startsWith('#')) {
    // #RRGGBB
    r = parseInt(color.substring(1, 3), 16);
    g = parseInt(color.substring(3, 5), 16);
    b = parseInt(color.substring(5, 7), 16);
  } else if (color.startsWith('rgb(')) {
    // rgb(R,G,B)
    const parts = color.substring(4, color.length - 1).split(',');
    r = parseInt(parts[0]);
    g = parseInt(parts[1]);
    b = parseInt(parts[2]);
  }

  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Fallback detection using COLORFGBG env var or terminal-specific defaults.
 */
function detectThemeModeFallback(): ThemeMode {
  const colorfgbg = process.env['COLORFGBG'];
  if (colorfgbg) {
    const parts = colorfgbg.split(';');
    const bg = parseInt(parts[parts.length - 1], 10);
    
    if (!isNaN(bg) && bg >= 0 && bg <= 255) {
      return ansi256ToLuminance(bg) < 0.5 ? 'dark' : 'light';
    }
  }

  const termProgram = process.env['TERM_PROGRAM']?.toLowerCase();
  const appleTerm = process.env['APPLE_TERMINAL'];
  
  if (appleTerm || termProgram === 'apple_terminal') {
    return 'light';
  }

  return 'dark';
}

function ansi256ToLuminance(code: number): number {
  const DARK_STANDARD = new Set([0, 1, 4, 5]);
  const DARK_BRIGHT = new Set([8, 9, 12, 13]);
  const CUBE_VALUES = [0, 95, 135, 175, 215, 255];

  if (code >= 0 && code <= 7) {
    return DARK_STANDARD.has(code) ? 0.1 : 0.7;
  }

  if (code >= 8 && code <= 15) {
    return DARK_BRIGHT.has(code) ? 0.3 : 0.9;
  }

  if (code >= 16 && code <= 231) {
    const c = code - 16;
    const r = CUBE_VALUES[Math.floor(c / 36)];
    const g = CUBE_VALUES[Math.floor((c % 36) / 6)];
    const b = CUBE_VALUES[c % 6];
    return srgbLuminance(r, g, b);
  }

  if (code >= 232 && code <= 255) {
    const gray = 8 + (code - 232) * 10;
    return srgbLuminance(gray, gray, gray);
  }

  return 0.5;
}

function srgbLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

const DARK_THEME: Theme = {
  mode: 'dark',
  headerBg: '#1c1c1c',
  footerBg: '#1c1c1c',
  menuBg: '#141414',
  outputBg: '#0a0a0a',
  selectionBg: '#2d4f7c',
  selectionFg: '#ffffff',
  divider: '#333333',
};

const LIGHT_THEME: Theme = {
  mode: 'light',
  headerBg: '#e8e8e8',
  footerBg: '#e8e8e8',
  menuBg: '#f0f0f0',
  outputBg: '#fafafa',
  selectionBg: '#0066cc',
  selectionFg: '#ffffff',
  divider: '#d4d4d4',
};

export function getTheme(mode: ThemeMode): Theme {
  return mode === 'light' ? LIGHT_THEME : DARK_THEME;
}
