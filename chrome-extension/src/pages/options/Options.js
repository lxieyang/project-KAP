/* global chrome */
import React, { Component } from 'react';
import { RadioGroup, Radio } from 'react-radio-group';
import styles from './Options.css';
import { DH_CHECK_P_NOT_PRIME } from 'constants';

class Options extends Component {
  state = {
    sidebarBehavior: 'overlay'
  };

  handleChange = value => {
    this.setState({ sidebarBehavior: value });
    chrome.runtime.sendMessage({
      msg: 'SETTINGS_CHANGED_SIDEBAR_BEHAVIOR',
      to: value
    });
  };

  render() {
    return (
      <div className={styles.OptionsPageContainer}>
        <div className={styles.OptionContainer}>
          <div className={styles.OptionLabel}>Sidebar open behavior:</div>
          <div className={styles.OptionOptions}>
            <RadioGroup
              name="sidebar-behavior"
              selectedValue={this.state.sidebarBehavior}
              onChange={this.handleChange}
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
      </div>
    );
  }
}

export default Options;
