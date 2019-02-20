import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from '../matchPath';
import { WORKSPACE_TYPES } from '../../../../../shared/types';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import Spinner from '../../../../../components/UI/Spinner/Spinner';
import styles from './WorkspaceView.css';

import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import { TableLarge, Close } from 'mdi-material-ui';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import CreateNewWorkspace from './CreateNewWorkspace/CreateNewWorkspace';
import TableView from './Structures/TableView/TableView';

import ScreenshotModal from '../ScreenshotModal/ScreenshotModal';

// const fakeWorkspaces = [
//   {
//     id: 'test-table-001',
//     workspaceType: WORKSPACE_TYPES.table,
//     name: 'Comparison table 1',
//     creator: 'dummy',
//     creationDate: new Date().getTime(),
//     updateDate: new Date().getTime(),
//     trashed: false,
//     references: {
//       task: 'task-01'
//     },
//     data: []
//   }
// ];

const WorkspaceContainer = styled.div`
  margin-left: 10px;
  height: 100%;
  position: relative;
`;

const WorkspaceContentContainer = styled.div`
  position: absolute;
  top: 48px;
  bottom: 0px;
  left: 0px;
  right: 0px;
  overflow: auto;
  /* background-color: rgb(236, 236, 236); */
`;

const StyledTab = withStyles({
  label: {
    textTransform: 'capitalize',
    overflow: 'hidden'
  }
})(Tab);

class WorkspaceView extends Component {
  state = {
    activeWorkspaceId: '0',

    workspaces: [],
    workspacesLoading: true,

    // pieces
    pieces: {},

    // edit access
    taskId: '',
    editAccess: false
  };

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          this.setState({
            taskId,
            editAccess:
              snapshot.data().creator === FirestoreManager.getCurrentUserId(),
            commentAccess: FirestoreManager.getCurrentUserId() !== null
          });
        }
      }
    );

    this.unsubscribePieces = FirestoreManager.getAllPiecesInTask(
      taskId
    ).onSnapshot(querySnapshot => {
      let pieces = { ...this.state.pieces };
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

      // let pieces = {};
      // querySnapshot.forEach(snapshot => {
      //   pieces[snapshot.id] = {
      //     id: snapshot.id,
      //     ...snapshot.data()
      //   };
      // });

      this.setState({ pieces });
    });

    this.unsubscribeWorkspaces = FirestoreManager.getAllWorkspacesInTask(taskId)
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

  componentWillUnmount() {
    this.unsubscribeTaskId();
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

  openScreenshot = imageDataUrl => {
    ScreenshotModal.setDataSource(imageDataUrl);
    ScreenshotModal.toggleModalOpen();
  };

  render() {
    const {
      taskId,
      pieces,
      activeWorkspaceId,
      editAccess,
      commentAccess,
      workspacesLoading
    } = this.state;

    if (workspacesLoading) {
      return (
        <div
          style={{
            width: '100%',
            height: '400px',
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
        <WorkspaceContainer>
          <div>
            <Tabs
              value={activeWorkspaceId}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              onChange={this.handleTabChange}
            >
              <StyledTab
                disabled={!editAccess ? true : false}
                value={'0'}
                icon={editAccess ? <AddIcon /> : null}
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
                        {editAccess ? (
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
                        ) : null}
                      </div>
                    }
                  />
                );
              })}
            </Tabs>
          </div>

          {activeWorkspaceId === '0' ? (
            <WorkspaceContentContainer className="workspace-content-container">
              <CreateNewWorkspace
                editAccess={editAccess}
                taskId={this.state.taskId}
              />
            </WorkspaceContentContainer>
          ) : null}

          {this.state.workspaces.map((workspace, idx) => {
            let retVal = null;
            switch (workspace.workspaceType) {
              case WORKSPACE_TYPES.table:
                retVal = (
                  <React.Fragment key={idx}>
                    {activeWorkspaceId === workspace.id ? (
                      <WorkspaceContentContainer className="workspace-content-container">
                        <TableView
                          taskId={taskId}
                          pieces={pieces}
                          workspace={workspace}
                          workspaceTypeString={'table'}
                          editAccess={editAccess}
                          commentAccess={commentAccess}
                          openScreenshot={this.openScreenshot}
                        />
                      </WorkspaceContentContainer>
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
        </WorkspaceContainer>

        {/* Screenshot Modal */}
        <ScreenshotModal />
      </React.Fragment>
    );
  }
}

export default withRouter(WorkspaceView);
