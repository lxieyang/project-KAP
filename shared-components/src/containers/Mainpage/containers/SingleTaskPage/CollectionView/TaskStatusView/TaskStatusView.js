import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from '../../matchPath';
import * as FirestoreManager from '../../../../../../firebase/firestore_wrapper';
import { getTaskLink } from '../../../../../../shared/utilities';
import { THEME_COLOR } from '../../../../../../shared/theme';
import styles from './TaskStatusView.css';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Star from 'mdi-material-ui/Star';
import Chat from 'mdi-material-ui/Chat';
import Link from 'mdi-material-ui/Link';
import StarOutline from 'mdi-material-ui/StarOutline';
import Collapse from '@material-ui/core/Collapse';
import Tooltip from '@material-ui/core/Tooltip';
import Divider from '@material-ui/core/Divider';
import SwipeableViews from 'react-swipeable-views';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

import {
  FaClipboardList,
  FaMedal,
  FaAngleDown,
  FaAngleUp
} from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { GoPackage, GoTasklist } from 'react-icons/go';

import { ToastContainer, toast, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import Textarea from 'react-textarea-autosize';
import TaskComments from './TaskComments/TaskComments';

import Modal from 'react-modal';

import ContextPanel from './OverviewPanels/ContextPanel/ContextPanel';
import TrustPanel from './OverviewPanels/TrustPanel/TrustPanel';
import CompletenessPanel from './OverviewPanels/CompletenessPanel/CompletenessPanel';
import TaskContext from '../../../../../../shared/task-context';

const materialStyles = theme => ({
  iconButtons: {
    padding: '5px'
  },
  iconInIconButtons: {
    width: '20px',
    height: '20px',
    color: 'rgb(200, 200, 200)'
  },
  close: {
    padding: theme.spacing.unit / 2
  },
  viewControlButton: {
    minWidth: '12px',
    height: '100%',
    fontSize: '13px',
    textTransform: 'capitalize',
    padding: '4px 4px',
    lineHeight: '14px',
    margin: '0px 1px',
    overflow: 'hidden',
    justifyContent: 'flex-start'
  }
});

const StyledTab = withStyles({
  root: {
    minWidth: 40,
    minHeight: 30
  },
  label: {
    fontSize: '12px',
    textTransform: 'capitalize',
    overflow: 'hidden'
  },
  labelContainer: {
    padding: '4px 3px'
  }
})(Tab);

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && <React.Fragment>{children}</React.Fragment>}
    </Typography>
  );
}

class TaskStatusView extends Component {
  static contextType = TaskContext;
  state = {
    task: null,

    // task name edit
    taskNameEdit: '',

    // task editing privilege
    editAccess: false,
    commentAccess: false,

    currentTaskCommentsCount: 0,
    commentsExpanded: false,

    // author detail
    author: null,

    overviewExpanded: true,
    overviewTabValue: 2
  };

  handleTabChange = (event, newValue) => {
    this.setState({ overviewTabValue: newValue });
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    this.updateTask();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.userId !== this.props.userId) {
      this.updateTask();
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeTaskId) this.unsubscribeTaskId();
  }

  setCurrentTaskCommentsCount = count => {
    this.setState({ currentTaskCommentsCount: count });
  };

  toggleCommentsExpandedStatus = () => {
    this.setState(prevState => {
      return {
        commentsExpanded: !prevState.commentsExpanded
      };
    });
  };

  toggleOverviewExpandedStatus = () => {
    this.setState(prevState => {
      return { overviewExpanded: !prevState.overviewExpanded };
    });
  };

  updateTask = () => {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    if (this.unsubscribeTaskId) this.unsubscribeTaskId();
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let task = { id: snapshot.id, ...snapshot.data() };
          this.setState({
            task,
            taskNameEdit: task.name,
            editAccess: task.creator === FirestoreManager.getCurrentUserId(),
            commentAccess: FirestoreManager.getCurrentUserId() !== null
          });

          FirestoreManager.getUserProfileById(task.creator)
            .get()
            .then(doc => {
              if (doc.exists) {
                let user = doc.data();
                this.setState({
                  author: {
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    email: user.email
                  }
                });
              }
            });
        }
      }
    );
  };

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.textarea.blur();
    }
  }

  toggleTaskStarStatus = (taskId, currentStarStatus) => {
    FirestoreManager.toggleTaskStarStatus(taskId, !currentStarStatus);
  };

  handleTaskNameChange = e => {
    this.setState({ taskNameEdit: e.target.value });
  };

  updateTaskName = () => {
    let taskName = this.state.taskNameEdit.trim();
    if (
      taskName !== null &&
      taskName !== '' &&
      taskName !== this.state.task.name
    ) {
      FirestoreManager.updateTaskName(this.state.task.id, taskName);
    }
    this.textarea.scrollTo(0, 0);
  };

  getSharableLinkClickedHandler = taskName => {
    toast.success(
      <div>
        Link for <strong>{taskName}</strong> copied to clipboard!
      </div>,
      {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false
      }
    );
  };

  render() {
    const {
      task,
      taskNameEdit,
      editAccess,
      commentAccess,
      author
    } = this.state;
    const { classes } = this.props;

    if (task === null) {
      return null;
    }

    if (!editAccess) {
      return (
        <React.Fragment>
          <div
            className={styles.ReviewingTaskContainer}
            style={{
              backgroundColor: THEME_COLOR.reviewingTaskBackgroundColor
            }}
          >
            <div className={styles.ReviewingTaskNameContainer}>{task.name}</div>
            {author ? (
              <div className={styles.ReviewingTaskAuthorContainer}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  Created by {author.displayName} ({author.email})
                </div>
              </div>
            ) : null}
          </div>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <div className={styles.TaskViewControlsContainer}>
          <Button
            variant={'outlined'}
            onClick={() => {
              this.context.setCurrentTaskView('default');
            }}
            size="small"
            className={[
              classes.viewControlButton,
              this.context.currentTaskView === 'default'
                ? styles.CurrentViewControlButtonDefault
                : null
            ].join(' ')}
          >
            Default
          </Button>
          <Button
            variant={'outlined'}
            onClick={() => {
              this.context.setCurrentTaskView('context');
            }}
            size="small"
            className={[
              classes.viewControlButton,
              this.context.currentTaskView === 'context'
                ? styles.CurrentViewControlButtonTaskContext
                : null
            ].join(' ')}
          >
            <GoPackage className={styles.ViewControlButtonIcon} />
            Context
          </Button>
          <Button
            variant={'outlined'}
            onClick={() => {
              this.context.setCurrentTaskView('trustworthiness');
            }}
            size="small"
            className={[
              classes.viewControlButton,
              this.context.currentTaskView === 'trustworthiness'
                ? styles.CurrentViewControlButtonTrustworthiness
                : null
            ].join(' ')}
          >
            <FaMedal className={styles.ViewControlButtonIcon} />
            Trustworthiness
          </Button>
          <Button
            variant={'outlined'}
            onClick={() => {
              this.context.setCurrentTaskView('thoroughness');
            }}
            size="small"
            className={[
              classes.viewControlButton,
              this.context.currentTaskView === 'thoroughness'
                ? styles.CurrentViewControlButtonThoroughness
                : null
            ].join(' ')}
          >
            <GoTasklist className={styles.ViewControlButtonIcon} />
            Thoroughness
          </Button>
        </div>

        {/* <div className={styles.TaskStatusViewContainer}> */}
        {/* <div className={styles.VariousButtonsContainer}>
            {editAccess && (
              <Tooltip
                title={`${
                  task.isStarred ? 'Remove from Starred' : 'Add to Starred'
                }`}
                placement={'bottom'}
              >
                <IconButton
                  aria-label="Star"
                  className={classes.iconButtons}
                  onClick={e =>
                    this.toggleTaskStarStatus(task.id, task.isStarred)
                  }
                >
                  {task.isStarred ? (
                    <Star
                      className={classes.iconInIconButtons}
                      style={{ color: THEME_COLOR.starColor }}
                    />
                  ) : (
                    <StarOutline className={classes.iconInIconButtons} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </div> */}
        {/* <div
            className={styles.TaskNameContainer}
            title={editAccess ? `Edit task name` : null}
          >
            <Textarea
              inputRef={tag => (this.textarea = tag)}
              minRows={1}
              maxRows={6}
              disabled={!editAccess}
              placeholder={'Add a name'}
              value={taskNameEdit}
              onBlur={() => this.updateTaskName()}
              onKeyDown={this.keyPress}
              onChange={e => this.handleTaskNameChange(e)}
              className={styles.Textarea}
            />
          </div> */}

        {/* <div style={{ position: 'relative' }}>
            <Tooltip
              title={
                this.state.currentTaskCommentsCount > 0
                  ? this.state.commentsExpanded
                    ? 'Hide Comments'
                    : 'Show comments'
                  : 'Make comments'
              }
              placement={'bottom'}
            >
              <IconButton
                style={{
                  backgroundColor: this.state.commentsExpanded
                    ? 'rgb(235, 235, 235)'
                    : null
                }}
                aria-label="Comment"
                className={classes.iconButtons}
                onClick={() => this.toggleCommentsExpandedStatus()}
              >
                <Chat className={classes.iconInIconButtons} />
              </IconButton>
            </Tooltip>
            <span
              style={{ color: THEME_COLOR.badgeColor }}
              className={styles.CommentCount}
            >
              {this.state.currentTaskCommentsCount > 0
                ? this.state.currentTaskCommentsCount
                : null}
            </span>
          </div> */}

        {/* {editAccess && (
            <React.Fragment>
              <Tooltip title={`Get sharable link`} placement={'bottom'}>
                <IconButton
                  aria-label="Share"
                  className={classes.iconButtons}
                  onClick={() =>
                    this.getSharableLinkClickedHandler(taskNameEdit)
                  }
                >
                  <CopyToClipboard text={getTaskLink(this.state.task.id)}>
                    <Link className={classes.iconInIconButtons} />
                  </CopyToClipboard>
                </IconButton>
              </Tooltip>
              <ToastContainer
                position="top-center"
                transition={Flip}
                autoClose={2000}
                hideProgressBar
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnVisibilityChange
                pauseOnHover
              />
            </React.Fragment>
          )} */}

        {/* <Tooltip
            title={
              this.state.overviewExpanded ? 'Hide Overview' : 'Show Overview'
            }
            placement={'bottom'}
          >
            <IconButton
              style={{
                backgroundColor: this.state.overviewExpanded
                  ? 'rgb(235, 235, 235)'
                  : null
              }}
              className={classes.iconButtons}
              onClick={() => this.toggleOverviewExpandedStatus()}
            >
              <FaClipboardList className={classes.iconInIconButtons} />
            </IconButton>
          </Tooltip> */}
        {/* </div> */}

        {/* <Collapse in={this.state.commentsExpanded} timeout="auto">
          <div className={styles.TaskCommentsContainer}>
            <TaskComments currentAuthor={FirestoreManager.getCurrentUser()} taskId={this.state.task.id} commentAccess={commentAccess} setCurrentTaskCommentsCount={this.setCurrentTaskCommentsCount} />
          </div>
        </Collapse> */}

        <Divider light />

        <div className={styles.OverviewTitleContainer}>
          <span>Overview</span>
          <div className={styles.OverviewToggleButtonContainer}>
            <div
              className={styles.OverviewToggleButton}
              onClick={() => this.toggleOverviewExpandedStatus()}
            >
              {!this.state.overviewExpanded ? (
                <IoIosArrowDown
                  title={'Show Overview'}
                  className={styles.ButtonIcon}
                />
              ) : (
                <IoIosArrowUp
                  title={'Hide Overview'}
                  className={styles.ButtonIcon}
                />
              )}
            </div>
          </div>
        </div>

        <Collapse
          in={this.state.overviewExpanded}
          timeout="auto"
          style={{ flexShrink: 0 }}
        >
          <div className={styles.TaskOverviewContainer}>
            <Tabs
              value={this.state.overviewTabValue}
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
              style={{ minHeight: 36 }}
              onChange={this.handleTabChange}
            >
              <StyledTab
                label={
                  <div className={styles.TabLabelContainer}>
                    <GoPackage className={styles.TabLabelIcon} />
                    Task Context
                  </div>
                }
              />
              <StyledTab
                label={
                  <div className={styles.TabLabelContainer}>
                    <FaMedal className={styles.TabLabelIcon} />
                    Trustworthiness
                  </div>
                }
              />
              <StyledTab
                label={
                  <div className={styles.TabLabelContainer}>
                    <GoTasklist className={styles.TabLabelIcon} />
                    Thoroughness
                  </div>
                }
              />
            </Tabs>
            <SwipeableViews
              index={this.state.overviewTabValue}
              onChangeIndex={this.handleTabChange}
              style={{ flex: 1 }}
              containerStyle={{ height: '100%' }}
              disableLazyLoading
            >
              <TabPanel value={this.state.overviewTabValue} index={0}>
                <ContextPanel
                  task={task}
                  queries={this.props.queries}
                  pages={this.props.pages}
                  pieces={this.props.pieces}
                  changeTab={this.props.changeTab}
                />
              </TabPanel>
              <TabPanel value={this.state.overviewTabValue} index={1}>
                <TrustPanel
                  task={task}
                  queries={this.props.queries}
                  pages={this.props.pages}
                  pieces={this.props.pieces}
                  changeTab={this.props.changeTab}
                />
              </TabPanel>
              <TabPanel value={this.state.overviewTabValue} index={2}>
                <CompletenessPanel
                  task={task}
                  queries={this.props.queries}
                  pages={this.props.pages}
                  pieces={this.props.pieces}
                  changeTab={this.props.changeTab}
                />
              </TabPanel>
            </SwipeableViews>
          </div>
        </Collapse>
      </React.Fragment>
    );
  }
}

export default withRouter(withStyles(materialStyles)(TaskStatusView));
