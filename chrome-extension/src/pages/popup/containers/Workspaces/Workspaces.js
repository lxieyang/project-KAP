import React, { Component } from 'react';
import styles from './Workspaces.css';
import styled from 'styled-components';
import classnames from 'classnames';
import { WORKSPACE_TYPES } from '../../../../../../shared-components/src/shared/types';
import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';
import Spinner from '../../../../../../shared-components/src/components/UI/Spinner/Spinner';

import LinesEllipsis from 'react-lines-ellipsis';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import TableLarge from 'mdi-material-ui/TableLarge';
import Close from 'mdi-material-ui/Close';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Divider from '@material-ui/core/Divider';
import Collapse from '@material-ui/core/Collapse';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import CreateNewWorkspace from './CreateNewWorkspace/CreateNewWorkspace';
import Table from './Structures/Table/Table';

const WorkspacesContainer = styled.div`
  margin: 0px 0px;
  box-sizing: border-box;
  width: 100%;
  padding: 0px 0px;
  font-size: 12px;
  font-weight: 400;
`;

const WorkspacesContentContainer = styled.div`
  /* background-color: #ddd; */
  width: 100%;
  height: 350px;
  overflow: auto;
`;

const materialStyles = theme => ({
  expand: {
    padding: '4px',
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: 'rotate(180deg)'
  },
  expandIcon: {
    width: '24px',
    height: '24px'
  }
});

const StyledTab = withStyles({
  root: {
    minWidth: 40,
    maxWidth: 160,
    minHeight: 36
  },
  label: {
    fontSize: '12px',
    textTransform: 'capitalize',
    overflow: 'hidden'
  },
  labelContainer: {
    padding: '6px 4px'
  }
})(Tab);

class Workspaces extends Component {
  state = {
    activeWorkspaceId: '0',

    workspaces: [],
    workspacesLoading: true,

    // pieces
    pieces: null,

    // edit access
    taskId: '',

    // collapse
    expanded: true
  };

  // expand
  handleExpandClick = e => {
    e.stopPropagation();
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  expandCollapse = () => {
    this.setState({ expanded: true });
  };

  componentDidMount() {
    this.unsubscribeCurrentTaskId = FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(
      doc => {
        let taskId = doc.data().id;
        this.setState({ taskId: taskId });

        // get all pieces
        this.unsubscribePieces = FirestoreManager.getAllPiecesInTask(
          taskId
        ).onSnapshot(querySnapshot => {
          let pieces = this.state.pieces ? { ...this.state.pieces } : {};
          querySnapshot.docChanges().forEach(change => {
            if (change.type === 'added' || change.type === 'modified') {
              let p = {
                ...change.doc.data(),
                id: change.doc.id
              };
              pieces[change.doc.id] = p;
            } else if (change.type === 'removed') {
              delete pieces[change.doc.id];
            }
          });

          this.setState({ pieces });
        });

        // get all workspaces
        this.unsubscribeWorkspaces = FirestoreManager.getAllWorkspacesInTask(
          taskId
        )
          .orderBy('creationDate', 'asc')
          .onSnapshot(querySnapshot => {
            let workspaces = [];
            querySnapshot.forEach(snapshot => {
              workspaces.push({
                id: snapshot.id,
                ...snapshot.data()
              });
            });

            let activeWorkspaceId = this.state.activeWorkspaceId;
            if (this.isWorkspaceStillPresent(workspaces, activeWorkspaceId)) {
              // not going to change
              this.setState({ workspaces, workspacesLoading: false });
            } else {
              if (workspaces.length > 0) {
                // set to last one created
                this.setState({
                  workspaces,
                  activeWorkspaceId: workspaces[workspaces.length - 1].id,
                  workspacesLoading: false
                });

                this.props.setCurrentWorkspaceId(
                  workspaces[workspaces.length - 1].id
                );
              } else {
                // set to '0'
                this.setState({
                  workspaces,
                  activeWorkspaceId: '0',
                  workspacesLoading: false
                });
                this.props.setCurrentWorkspaceId('0');
              }
            }
          });
      }
    );
  }

  componentWillUnmount() {
    this.unsubscribeCurrentTaskId();
    this.unsubscribePieces();
    this.unsubscribeWorkspaces();
  }

  isWorkspaceStillPresent = (workspaces, activeWorkspaceId) => {
    if (activeWorkspaceId === '0') {
      return false;
    }
    for (let i = 0; i < workspaces.length; i++) {
      if (workspaces[i].id === activeWorkspaceId) {
        return true;
      }
    }
    return false;
  };

  handleTabChange = (event, activeWorkspaceId) => {
    this.setState({ activeWorkspaceId });
    this.props.setCurrentWorkspaceId(activeWorkspaceId);
  };

  deleteWorkspace = (workspaceId, workspaceName, workspaceType) => {
    if (window.confirm(`Are you sure you want to delete "${workspaceName}"?`)) {
      // add "undo" later, permanently delete for now
      FirestoreManager.deleteWorkspaceById(workspaceId, workspaceType);
    }
  };

  render() {
    const { taskId, pieces, activeWorkspaceId, workspacesLoading } = this.state;

    const { classes } = this.props;

    if (workspacesLoading) {
      return (
        <div
          style={{
            width: '100%',
            height: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Spinner size={'30px'} />
        </div>
      );
    }

    return (
      <React.Fragment>
        <WorkspacesContainer>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            {this.state.expanded ? (
              <Tabs
                style={{ flex: '1' }}
                value={activeWorkspaceId}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="off"
                onChange={this.handleTabChange}
              >
                <StyledTab
                  value={'0'}
                  icon={<AddIcon />}
                  style={{ minWidth: '40px' }}
                />
                {this.state.workspaces.map((workspace, idx) => {
                  let workspaceIcon = <TableLarge />;
                  let workspaceTypeString = 'table';
                  switch (workspace.type) {
                    case WORKSPACE_TYPES.table:
                      workspaceIcon = <TableLarge />;
                      workspaceTypeString = 'table';
                      break;
                    default:
                      break;
                  }
                  return (
                    <StyledTab
                      value={workspace.id}
                      // style={{ maxWidth: '370px' }}
                      key={`${workspace.id}-${idx}`}
                      label={
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {workspaceIcon}{' '}
                          <div
                            title={workspace.name}
                            className={styles.WorkspaceName}
                          >
                            {workspace.name}
                          </div>
                          <div
                            title={`Delete this ${workspaceTypeString}`}
                            onClick={() =>
                              this.deleteWorkspace(
                                workspace.id,
                                workspace.name,
                                workspace.workspaceType
                              )
                            }
                          >
                            <Close className={styles.CloseButton} />
                          </div>
                        </div>
                      }
                    />
                  );
                })}
              </Tabs>
            ) : (
              <div
                style={{
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span
                  className={styles.WorkspacesTitle}
                  onClick={() => this.expandCollapse()}
                >
                  Workspaces
                </span>
              </div>
            )}

            <div
              style={{
                flexBasis: '32px',
                marginLeft: 'auto',
                order: '3'
              }}
            >
              <IconButton
                className={classnames(classes.expand, {
                  [classes.expandOpen]: this.state.expanded
                })}
                onClick={this.handleExpandClick}
                aria-expanded={this.state.expanded}
                aria-label="Show more"
              >
                <ExpandMoreIcon className={classes.expandIcon} />
              </IconButton>
            </div>
          </div>

          <Collapse in={this.state.expanded} timeout="auto">
            {activeWorkspaceId === '0' ? (
              <WorkspacesContentContainer className="workspace-content-container">
                <CreateNewWorkspace taskId={this.state.taskId} />
              </WorkspacesContentContainer>
            ) : null}

            {this.state.workspaces.map((workspace, idx) => {
              let retVal = null;
              switch (workspace.workspaceType) {
                case WORKSPACE_TYPES.table:
                  retVal = (
                    <React.Fragment key={idx}>
                      {activeWorkspaceId === workspace.id ? (
                        <WorkspacesContentContainer className="workspace-content-container">
                          <Table
                            taskId={taskId}
                            pieces={pieces}
                            workspace={workspace}
                            workspaceTypeString={'table'}
                          />
                        </WorkspacesContentContainer>
                      ) : null}
                    </React.Fragment>
                  );
                  break;
                // add other types of workspace here
                default:
                  break;
              }
              return retVal;
            })}
          </Collapse>
          <Divider />
        </WorkspacesContainer>
      </React.Fragment>
    );
  }
}

export default withStyles(materialStyles)(Workspaces);
