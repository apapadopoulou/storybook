import React, { Component, Fragment, ComponentProps } from 'react';

import { styled } from '@storybook/theming';

import { STORY_RENDERED } from '@storybook/core-events';
import { ActionBar, Icons, ScrollArea } from '@storybook/components';

import { AxeResults, Result } from 'axe-core';
import { API } from '@storybook/api';
import { Provider } from 'react-redux';
import { Report } from './Report';
import { Tabs } from './Tabs';
import { EVENTS } from '../constants';

import store, { clearElements } from '../redux-config';

export enum RuleType {
  VIOLATION,
  PASS,
  INCOMPLETION,
}

type IconProps = ComponentProps<typeof Icons> & { status?: string; inline?: boolean };

const Icon = styled(Icons)<IconProps>(
  {
    height: 12,
    width: 12,
    marginRight: 4,
  },
  ({ status, theme }) =>
    status === 'running'
      ? {
          animation: `${theme.animation.rotate360} 1s linear infinite;`,
        }
      : {}
);

const Passes = styled.span<{}>(({ theme }) => ({
  color: theme.color.positive,
}));

const Violations = styled.span<{}>(({ theme }) => ({
  color: theme.color.negative,
}));

const Incomplete = styled.span<{}>(({ theme }) => ({
  color: theme.color.warning,
}));

const centeredStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
};

const Loader = styled(({ className }) => (
  <div className={className}>
    <Icon inline icon="sync" status="running" /> Please wait while the accessibility scan is running
    ...
  </div>
))(centeredStyle);
Loader.displayName = 'Loader';

interface A11YPanelNormalState {
  status: 'ready' | 'ran' | 'running';
  passes: Result[];
  violations: Result[];
  incomplete: Result[];
}

interface A11YPanelErrorState {
  status: 'error';
  error: unknown;
}

type A11YPanelState = A11YPanelNormalState | A11YPanelErrorState;

interface A11YPanelProps {
  active: boolean;
  api: API;
}

export class A11YPanel extends Component<A11YPanelProps, A11YPanelState> {
  state: A11YPanelState = {
    status: 'ready',
    passes: [],
    violations: [],
    incomplete: [],
  };

  componentDidMount() {
    const { api } = this.props;

    api.on(STORY_RENDERED, this.request);
    api.on(EVENTS.RESULT, this.onUpdate);
    api.on(EVENTS.ERROR, this.onError);
  }

  componentDidUpdate(prevProps: A11YPanelProps) {
    // TODO: might be able to remove this
    const { active } = this.props;

    if (!prevProps.active && active) {
      // removes all elements from the redux map in store from the previous panel
      store.dispatch(clearElements());
      this.request();
    }
  }

  componentWillUnmount() {
    const { api } = this.props;
    api.off(STORY_RENDERED, this.request);
    api.off(EVENTS.RESULT, this.onUpdate);
    api.off(EVENTS.ERROR, this.onError);
  }

  onUpdate = ({ passes, violations, incomplete }: AxeResults) => {
    this.setState(
      {
        status: 'ran',
        passes,
        violations,
        incomplete,
      },
      () => {
        setTimeout(() => {
          const { status } = this.state;
          if (status === 'ran') {
            this.setState({
              status: 'ready',
            });
          }
        }, 900);
      }
    );
  };

  onError = (error: unknown) => {
    this.setState({
      status: 'error',
      error,
    });
  };

  request = () => {
    const { api, active } = this.props;

    if (active) {
      this.setState(
        {
          status: 'running',
        },
        () => {
          api.emit(EVENTS.REQUEST);
          // removes all elements from the redux map in store from the previous panel
          store.dispatch(clearElements());
        }
      );
    }
  };

  render() {
    const { active } = this.props;
    if (!active) return null;

    // eslint-disable-next-line react/destructuring-assignment
    if (this.state.status === 'error') {
      const { error } = this.state;
      return (
        <div style={centeredStyle}>
          The accessibility scan encountered an error.
          <br />
          {error}
        </div>
      );
    }

    const { passes, violations, incomplete, status } = this.state;

    let actionTitle;
    if (status === 'ready') {
      actionTitle = 'Rerun tests';
    } else if (status === 'running') {
      actionTitle = (
        <Fragment>
          <Icon inline icon="sync" status={status} /> Running test
        </Fragment>
      );
    } else if (status === 'ran') {
      actionTitle = (
        <Fragment>
          <Icon inline icon="check" /> Tests completed
        </Fragment>
      );
    }

    return (
      <Fragment>
        <Provider store={store}>
          {status === 'running' ? (
            <Loader />
          ) : (
            <ScrollArea vertical horizontal>
              <Tabs
                key="tabs"
                tabs={[
                  {
                    label: <Violations>{violations.length} Violations</Violations>,
                    panel: (
                      <Report
                        items={violations}
                        type={RuleType.VIOLATION}
                        empty="No accessibility violations found."
                      />
                    ),
                    items: violations,
                    type: RuleType.VIOLATION,
                  },
                  {
                    label: <Passes>{passes.length} Passes</Passes>,
                    panel: (
                      <Report
                        items={passes}
                        type={RuleType.PASS}
                        empty="No accessibility checks passed."
                      />
                    ),
                    items: passes,
                    type: RuleType.PASS,
                  },
                  {
                    label: <Incomplete>{incomplete.length} Incomplete</Incomplete>,
                    panel: (
                      <Report
                        items={incomplete}
                        type={RuleType.INCOMPLETION}
                        empty="No accessibility checks incomplete."
                      />
                    ),
                    items: incomplete,
                    type: RuleType.INCOMPLETION,
                  },
                ]}
              />
            </ScrollArea>
          )}
          <ActionBar
            key="actionbar"
            actionItems={[{ title: actionTitle, onClick: this.request }]}
          />
        </Provider>
      </Fragment>
    );
  }
}
