import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import styles from './WorkspaceView.css';

import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import { Table } from 'mdi-material-ui';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

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
`;

const WorkspaceContent = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
`;

const StyledTab = withStyles({
  label: {
    textTransform: 'capitalize'
  }
})(Tab);

class WorkspaceView extends Component {
  state = {
    tabIdx: 0
  };

  handleChange = (event, tabIdx) => {
    this.setState({ tabIdx });
  };

  render() {
    return (
      <React.Fragment>
        <WorkspaceContainer>
          <Tabs
            value={this.state.tabIdx}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            onChange={this.handleChange}
          >
            <StyledTab icon={<AddIcon />} style={{ minWidth: '40px' }} />
            <StyledTab label={'comparison table'} />
          </Tabs>
          <WorkspaceContentContainer>
            <div
              style={{
                backgroundImage: 'linear-gradient(-90deg, red, yellow)',
                width: '2000px',
                height: '5000px',
                display: 'inline-block'
              }}
            />
            <div
              style={{
                height: '50px'
              }}
            />
          </WorkspaceContentContainer>
        </WorkspaceContainer>
      </React.Fragment>
    );
  }
}

export default withRouter(WorkspaceView);
