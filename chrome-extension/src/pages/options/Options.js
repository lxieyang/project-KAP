/* global chrome */
import React, { Component } from 'react';
import { RadioGroup, Radio } from 'react-radio-group';
import styles from './Options.css';
import SelectTooltipButton from '../content/SelectTooltipButton/SelectTooltipButton';

class Options extends Component {
  state = {
    sidebarBehavior: 'overlay',
    sidebarEscapeKeyToggle: true
  };

  handleSidebarBehaviorChange = value => {
    this.setState({ sidebarBehavior: value });
    chrome.runtime.sendMessage({
      msg: 'SETTINGS_CHANGED_SIDEBAR_BEHAVIOR',
      to: value
    });
  };

  handleSidebarEscapeKeyToggleChange = value => {
    this.setState({ sidebarEscapeKeyToggle: value });
    chrome.runtime.sendMessage({
      msg: 'SETTINGS_CHANGED_SIDEBAR_ESCAPE_KEY_TOGGLE',
      to: value
    });
  };

  render() {
    return (
      <React.Fragment>
        <div className={styles.OptionsPageContainer}>
          <div className={styles.OptionContainer}>
            <div className={styles.OptionLabel}>Sidebar open behavior:</div>
            <div className={styles.OptionOptions}>
              <RadioGroup
                name="sidebar-behavior"
                selectedValue={this.state.sidebarBehavior}
                onChange={this.handleSidebarBehaviorChange}
              >
                <label>
                  <Radio value="overlay" />
                  Overlay on the webpage
                </label>
                <label>
                  <Radio value="shrinkbody" />
                  Shrink the body of the webpage
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className={styles.OptionContainer}>
            <div className={styles.OptionLabel}>Use Esc to toggle sidebar:</div>
            <div className={styles.OptionOptions}>
              <RadioGroup
                name="sidebar-escape-key-toggle"
                selectedValue={this.state.sidebarEscapeKeyToggle}
                onChange={this.handleSidebarEscapeKeyToggleChange}
              >
                <label>
                  <Radio value={true} />
                  True
                </label>
                <label>
                  <Radio value={false} />
                  False
                </label>
              </RadioGroup>
            </div>
          </div>
        </div>
        {/*<div style={{ marginLeft: '200px' }}>
          <SelectTooltipButton />
        </div>*/}
      </React.Fragment>
    );
  }
}

export default Options;
