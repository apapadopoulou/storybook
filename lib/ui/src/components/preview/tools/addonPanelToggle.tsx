import React from 'react';
import { IconButton, Icons, Separator } from '@storybook/components';
import { Consumer, Combo } from '@storybook/api';
import { Addon } from '@storybook/addons';

const toggleMapper = ({ api, state }: Combo) => ({
  orientation: state.layout.panelPosition,
  isVisible: state.layout.showPanel,
  toggle: () => api.togglePanel(),
});

export const panelToggle: Addon = {
  title: 'panelToggle',
  id: 'panelToggle',
  match: ({ viewMode }) => viewMode === 'story',
  render: () => (
    <Consumer filter={toggleMapper}>
      {({ orientation, isVisible, toggle }) =>
        !isVisible && (
          <>
            <Separator />
            <IconButton
              aria-label="Show addon panel"
              key="addonPanel"
              onClick={toggle}
              title="Show addon panel"
            >
              <Icons icon={orientation === 'bottom' ? 'bottombartoggle' : 'sidebartogglealt'} />
            </IconButton>
          </>
        )
      }
    </Consumer>
  ),
};
