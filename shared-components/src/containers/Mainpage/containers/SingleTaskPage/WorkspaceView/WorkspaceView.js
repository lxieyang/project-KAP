import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import { WORKSPACE_TYPES } from '../../../../../shared/types';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import styles from './WorkspaceView.css';

import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import { TableLarge } from 'mdi-material-ui';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import CreateNewWorkspace from './CreateNewWorkspace/CreateNewWorkspace';
import TableView from './Structures/TableView/TableView';

const workspaces = [
  {
    id: 'test-table-001',
    type: WORKSPACE_TYPES.table,
    name: 'Comparison table 1',
    creationDate: new Date().getTime(),
    updateDate: new Date().getTime(),
    trashed: false,
    content: {}
  }
  // {
  //   id: 'test-table-002',
  //   type: WORKSPACE_TYPES.table,
  //   name: 'Comparison table 2',
  //   creationDate: new Date().getTime(),
  //   updateDate: new Date().getTime(),
  //   trashed: false,
  //   content: {}
  // }
];

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
    textTransform: 'capitalize'
  }
})(Tab);

class WorkspaceView extends Component {
  state = {
    tabIdx: 0,

    workspaces: []
  };

  componentDidMount() {
    setTimeout(() => {
      this.setState({ workspaces, tabIdx: workspaces.length !== 0 ? 1 : 0 });
    }, 1000);
  }

  handleTabChange = (event, tabIdx) => {
    this.setState({ tabIdx });
  };

  render() {
    let { tabIdx } = this.state;

    return (
      <React.Fragment>
        <WorkspaceContainer>
          <Tabs
            value={tabIdx}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            onChange={this.handleTabChange}
          >
            <StyledTab icon={<AddIcon />} style={{ minWidth: '40px' }} />
            {this.state.workspaces.map((workspace, idx) => {
              let workspaceIcon = <TableLarge />;
              switch (workspace.type) {
                case WORKSPACE_TYPES.table:
                  workspaceIcon = <TableLarge />;
                  break;
                default:
                  break;
              }
              return (
                <StyledTab
                  key={`${workspace.id}-${idx}`}
                  label={
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {workspaceIcon} {workspace.name}
                    </div>
                  }
                />
              );
            })}
          </Tabs>

          {tabIdx === 0 ? (
            <WorkspaceContentContainer>
              <CreateNewWorkspace />
            </WorkspaceContentContainer>
          ) : null}

          {this.state.workspaces.map((workspace, idx) => {
            return (
              <React.Fragment key={idx}>
                {tabIdx === idx + 1 ? (
                  <WorkspaceContentContainer>
                    <TableView idx={idx + 1} workspace={workspace} />
                  </WorkspaceContentContainer>
                ) : null}
              </React.Fragment>
            );
          })}
        </WorkspaceContainer>
      </React.Fragment>
    );
  }
}

export default withRouter(WorkspaceView);
