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
import ViewGrid from 'mdi-material-ui/ViewGrid';
import Switch from '@material-ui/core/Switch';
import IconButton from '@material-ui/core/IconButton';
import Star from 'mdi-material-ui/Star';
import BookOpen from 'mdi-material-ui/BookOpenVariant';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Divider from '@material-ui/core/Divider';
import { THEME_COLOR } from '../../../../../../shared-components/src/shared/theme';

const QuickSettingsContainer = styled.div`
  padding: 0px 18px;
`;

const QuickSettingBlockContainer = styled.div`
  padding-top: 8px;
  padding-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FooterButton = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  opacity: 0.3;
  font-size: 0.9rem;
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
    trackingIsActive: this.props.shouldTrack,
    // trackingStatusIsLoading: true

    tasks: [],
    taskCount: 0,
    currentTaskId: null,

    anchorEl: null,
    selectedIndex: 0
  };

  handleClickListItem = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleMenuItemClick = (event, index, taskId) => {
    this.setState({
      selectedIndex: index,
      currentTaskId: taskId,
      anchorEl: null
    });
    chrome.runtime.sendMessage({
      msg: 'UPDATE_CURRENT_USER_CURRENT_TASK_ID',
      taskId
    });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  taskNameClickedHandler = taskId => {
    chrome.runtime.sendMessage({
      msg: 'Go_TO_SINGLE_TASK_PAGE',
      taskId
    });
  };

  componentDidMount() {
    chrome.storage.local.get(
      ['tasks', 'taskCount', 'currentTaskId'],
      results => {
        this.setState({
          tasks: results.tasks,
          taskCount: results.taskCount,
          currentTaskId: results.currentTaskId,
          selectedIndex: results.tasks
            .map(t => t.id)
            .indexOf(results.currentTaskId)
        });
      }
    );
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

  allTasksClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'Go_TO_ALL_TASKS_PAGE'
    });
  };

  settingsClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'OPEN_SETTINGS_PAGE'
    });
  };

  openDocsPageClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'Go_TO_DOCS_PAGE'
    });
  };

  render() {
    const { anchorEl } = this.state;

    return (
      <React.Fragment>
        <QuickSettingsContainer>
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
              <div style={{ flexGrow: 1, fontWeight: 300 }}>
                {APP_NAME_SHORT} is disabled on this domain.
              </div>
            </QuickSettingBlockContainer>
          )}
          {this.state.tasks.length > 0 ? (
            <React.Fragment>
              <Divider light />
              <div style={{ margin: '10px 0px' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 300,
                    opacity: 0.7,
                    marginBottom: '3px'
                  }}
                >
                  Currently working on:
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    title={`Show task details`}
                    style={{
                      flexGrow: 1,
                      marginRight: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onClick={() =>
                      this.taskNameClickedHandler(
                        this.state.tasks[this.state.selectedIndex].id
                      )
                    }
                  >
                    {this.state.tasks[this.state.selectedIndex].isStarred ? (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          marginRight: '3px',
                          flexShrink: '0'
                        }}
                      >
                        <Star
                          style={{
                            width: '100%',
                            height: '100%',
                            color: THEME_COLOR.starColor
                          }}
                        />
                      </div>
                    ) : null}
                    <div style={{ flexGrow: 1 }}>
                      {this.state.tasks[this.state.selectedIndex].name}
                    </div>
                  </div>
                  <div>
                    <IconButton
                      title={'Change tasks'}
                      size="small"
                      style={{ padding: '3px' }}
                      aria-label="More"
                      aria-haspopup="true"
                      onClick={this.handleClickListItem}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                    <Menu
                      id="lock-menu"
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={this.handleClose}
                      PaperProps={{
                        style: {
                          maxHeight: 100,
                          width: '100%'
                        }
                      }}
                    >
                      {this.state.tasks.map((task, index) => (
                        <MenuItem
                          style={{
                            height: 'auto',
                            whiteSpace: 'pre-wrap',
                            padding: '4px 8px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          key={task.id}
                          selected={index === this.state.selectedIndex}
                          onClick={event =>
                            this.handleMenuItemClick(event, index, task.id)
                          }
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              marginRight: '6px',
                              flexShrink: '0'
                            }}
                          >
                            {task.isStarred ? (
                              <Star
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  color: THEME_COLOR.starColor
                                }}
                              />
                            ) : null}
                          </div>
                          <div style={{ flexGrow: 1 }}>{task.name}</div>
                        </MenuItem>
                      ))}
                    </Menu>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ) : null}
        </QuickSettingsContainer>
        <Divider light />
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
          <FooterButton onClick={() => this.allTasksClickedHandler()}>
            <FooterButtonIcon>
              <ViewGrid />
            </FooterButtonIcon>
            All Tasks
          </FooterButton>
          <FooterButton onClick={() => this.openDocsPageClickedHandler()}>
            <FooterButtonIcon>
              <BookOpen />
            </FooterButtonIcon>
            Docs
          </FooterButton>
        </div>
      </React.Fragment>
    );
  }
}

export default LoggedIn;
