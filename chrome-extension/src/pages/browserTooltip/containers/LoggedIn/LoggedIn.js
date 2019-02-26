/* global chrome */
import React, { Component } from 'react';
import styled from 'styled-components';
import {
  APP_NAME_SHORT,
  GET_FAVICON_URL_PREFIX
} from '../../../../../../shared-components/src/shared/constants';
import { getHostnameWithoutWWW } from '../../../../../../shared-components/src/shared/utilities';

import Settings from 'mdi-material-ui/Settings';
import Logout from 'mdi-material-ui/LogoutVariant';
import Switch from '@material-ui/core/Switch';

import Divider from '@material-ui/core/Divider';

const QuickSettingBlockContainer = styled.div`
  padding-top: 5px;
  padding-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FooterButton = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  opacity: 0.3;
  transition: all 0.1s ease-in;

  &:hover {
    opacity: 0.6;
  }
`;

const FooterButtonIcon = styled.div`
  margin-right: 4px;
  height: 24px;
`;

class LoggedIn extends Component {
  state = {
    trackingIsActive: this.props.shouldTrack
    // trackingStatusIsLoading: true
  };

  componentDidMount() {
    // chrome.runtime.sendMessage(
    //   {
    //     msg: 'GET_TRACKING_STATUS'
    //   },
    //   response => {
    //     this.setState({
    //       trackingStatusIsLoading: false,
    //       trackingIsActive: response.trackingIsActive
    //     });
    //   }
    // );
  }

  handleChange = event => {
    let setToValue = event.target.checked;
    this.setState({ trackingIsActive: setToValue });

    chrome.runtime.sendMessage({
      msg: 'TRACKING_STATUS_CHANGED_BY_USER',
      setTo: setToValue,
      hostname: this.props.hostname
    });
  };

  logoutClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'GO_TO_AUTH_PAGE_TO_LOG_IN'
    });
  };

  settingsClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'OPEN_SETTINGS_PAGE'
    });
  };

  render() {
    // const { userName, photoURL } = this.props;
    return (
      <React.Fragment>
        <div style={{ padding: '10px 18px' }}>
          {this.props.hostname !== null ? (
            <QuickSettingBlockContainer>
              <div
                style={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontWeight: 300, marginRight: '4px' }}>
                  Enable {APP_NAME_SHORT} on
                </span>
                {this.props.hostname && (
                  <img
                    src={`${GET_FAVICON_URL_PREFIX}${this.props.url}`}
                    alt="favicon"
                    style={{ width: '14px', height: '14px' }}
                  />
                )}

                <span style={{ fontWeight: 500, marginLeft: '4px' }}>
                  {getHostnameWithoutWWW(this.props.hostname)}
                </span>
              </div>
              <div>
                <Switch
                  checked={this.state.trackingIsActive}
                  onChange={this.handleChange}
                  value="unakite-status"
                  // disabled={this.state.trackingStatusIsLoading}
                />
              </div>
            </QuickSettingBlockContainer>
          ) : (
            <QuickSettingBlockContainer>
              <div style={{ flexGrow: 1 }}>
                {APP_NAME_SHORT} is disabled on this domain.
              </div>
            </QuickSettingBlockContainer>
          )}
        </div>
        <Divider />
        <div
          style={{
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <FooterButton onClick={() => this.settingsClickedHandler()}>
            <FooterButtonIcon>
              <Settings />
            </FooterButtonIcon>
            Settings
          </FooterButton>
          <FooterButton onClick={() => this.logoutClickedHandler()}>
            <FooterButtonIcon>
              <Logout />
            </FooterButtonIcon>
            Log Out
          </FooterButton>
        </div>
      </React.Fragment>
    );
  }
}

export default LoggedIn;
