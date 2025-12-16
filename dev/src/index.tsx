#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { Provider } from 'jotai';
import { App } from './App';
import { enterFullscreen, exitFullscreen, setupCleanupHandlers, isTTY } from './lib/terminal';
import { detectThemeMode, getTheme } from './lib/theme';
import { setTheme } from './state/atoms';

async function main(): Promise<void> {
  if (!isTTY()) {
    console.error('eh requires an interactive terminal');
    process.exit(1);
  }

  const mode = await detectThemeMode();
  setTheme(getTheme(mode));

  enterFullscreen();
  setupCleanupHandlers(exitFullscreen);

  const { waitUntilExit } = render(
    <Provider>
      <App />
    </Provider>
  );

  waitUntilExit().then(() => {
    exitFullscreen();
  });
}

main();
