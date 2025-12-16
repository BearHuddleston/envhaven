import React, { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { useAtomValue } from 'jotai';
import {
  selectedIndexAtom,
  isRunningAtom,
  isSubmenuAtom,
  isSettingsAtom,
  THEME,
  MENU_ITEMS,
  type MenuItem,
} from '../state/atoms';

const MENU_WIDTH = 28;

interface MenuItemRowProps {
  item: MenuItem;
  isSelected: boolean;
  isActive: boolean;
  isDisabled: boolean;
}

// Pure presentational component - NO atom subscriptions
const MenuItemRow = memo(
  function MenuItemRow({ item, isSelected, isActive, isDisabled }: MenuItemRowProps): React.ReactElement {
    const showExpandIndicator = item.key === 'test' || item.key === 'settings';
    const dimmed = isDisabled && !isSelected;
    const prefix = isActive ? '▸ ' : '  ';
    const suffix = showExpandIndicator ? ' ▸' : '  ';
    const labelPart = `${prefix}${item.label}${suffix}`;
    const paddingNeeded = Math.max(0, MENU_WIDTH - labelPart.length - item.shortcut.length - 2);
    const fullText = `${labelPart}${' '.repeat(paddingNeeded)}${item.shortcut} `;

    if (isSelected) {
      return (
        <Box width={MENU_WIDTH}>
          <Text backgroundColor={THEME.selectionBg} color={THEME.selectionFg}>
            {fullText}
          </Text>
        </Box>
      );
    }

    return (
      <Box width={MENU_WIDTH}>
        <Text dimColor={dimmed}>
          {prefix}
          {item.label}
          {suffix}
          {' '.repeat(paddingNeeded)}
          <Text dimColor>{item.shortcut}</Text>{' '}
        </Text>
      </Box>
    );
  },
  // Proper memo comparison - compares actual render-affecting props
  (prev, next) =>
    prev.item.key === next.item.key &&
    prev.isSelected === next.isSelected &&
    prev.isActive === next.isActive &&
    prev.isDisabled === next.isDisabled
);

// Spacer component to avoid recreating on every render
const MenuSpacer = memo(function MenuSpacer() {
  return <Box height={1} />;
});

export const Menu = memo(function Menu(): React.ReactElement {
  // All atom subscriptions lifted to parent - single subscription point
  const selectedIndex = useAtomValue(selectedIndexAtom);
  const isRunning = useAtomValue(isRunningAtom);
  const activeSubmenu = useAtomValue(isSubmenuAtom);
  const isSettings = useAtomValue(isSettingsAtom);

  // Precompute all item states in a single pass
  const itemStates = useMemo(() => {
    return MENU_ITEMS.map((item, index) => ({
      isSelected: index === selectedIndex,
      isActive:
        (item.key === 'test' && activeSubmenu === 'test') ||
        (item.key === 'settings' && isSettings),
      isDisabled: isRunning,
    }));
  }, [selectedIndex, activeSubmenu, isSettings, isRunning]);

  // Track groups for spacers
  let lastGroup: MenuItem['group'] | null = null;

  return (
    <Box flexDirection="column" backgroundColor={THEME.menuBg} paddingY={1} width={MENU_WIDTH}>
      {MENU_ITEMS.map((item, index) => {
        const showSpacer = lastGroup !== null && lastGroup !== item.group;
        lastGroup = item.group;
        const state = itemStates[index];

        return (
          <React.Fragment key={item.key}>
            {showSpacer && <MenuSpacer />}
            <MenuItemRow
              item={item}
              isSelected={state.isSelected}
              isActive={state.isActive}
              isDisabled={state.isDisabled}
            />
          </React.Fragment>
        );
      })}
    </Box>
  );
});
