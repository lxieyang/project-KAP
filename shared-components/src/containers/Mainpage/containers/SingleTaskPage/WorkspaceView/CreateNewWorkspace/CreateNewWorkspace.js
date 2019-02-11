import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import Textarea from 'react-textarea-autosize';
import { matchPath } from 'react-router';
import { WORKSPACE_TYPES } from '../../../../../../shared/types';
import * as FirestoreManager from '../../../../../../firebase/firestore_wrapper';
import classesInCSS from './CreateNewWorkspace.css';

import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import { TableLarge, BullseyeArrow } from 'mdi-material-ui';
import Button from '@material-ui/core/Button';

const CreateNewWorkspacePageContainer = styled.div`
  margin: 20px;
  font-size: 16px;
  box-sizing: border-box;
`;

const CreateNewWorkspacePromptContainer = styled.div`
  padding-top: 20px;
  box-sizing: border-box;
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
`;

const Title = styled.div`
  font-weight: 500;
  font-size: 28px;
`;

const WorkspaceNameContainer = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SubmitButtonContainer = styled.div`
  margin-top: 10px;
`;

const CapitalizedButton = withStyles({
  label: {
    textTransform: 'capitalize'
  }
})(Button);

const options = [
  {
    name: 'Comparison Table',
    shortName: 'table',
    type: WORKSPACE_TYPES.table,
    icon: <TableLarge />,
    disabled: false
  },
  {
    name: 'More structures to come in upcoming releases',
    type: WORKSPACE_TYPES.more,
    shortName: 'more',
    icon: <BullseyeArrow />,
    disabled: true
  }
];

class CreateNewWorkspace extends Component {
  state = {
    // type
    anchorEl: null,
    selectedIndex: 0,

    // name
    workspaceName: ''
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
  }

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.createNewWorkspaceClickedHandler();
    }
  }

  handleClickListItem = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleMenuItemClick = (event, index) => {
    this.setState({ selectedIndex: index, anchorEl: null });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleWorkspaceNameInputChange = e => {
    this.setState({ workspaceName: e.target.value });
  };

  createNewWorkspaceClickedHandler = () => {
    this.textarea.blur();
    let type = options[this.state.selectedIndex].type;
    let name = this.state.workspaceName;
    if (type !== WORKSPACE_TYPES.more && name !== null) {
      // console.log(`Should create ${name} of type ${type}`);
      FirestoreManager.createNewTable({
        name,
        type
      }).then(id => {
        // console.log(id);
      });
      this.setState({ workspaceName: '' });
    }
  };

  render() {
    const { workspaceName, anchorEl } = this.state;
    return (
      <React.Fragment>
        <CreateNewWorkspacePageContainer>
          <CreateNewWorkspacePromptContainer>
            <Title>Create a new workspace:</Title>
            <WorkspaceNameContainer>
              <div
                style={{
                  width: '200px',
                  marginRight: '10px',
                  backgroundColor: 'rgb(230, 230, 230)'
                }}
              >
                <List component="nav">
                  <ListItem
                    button
                    aria-haspopup="true"
                    aria-controls="type-menu"
                    aria-label="Workspace Type"
                    onClick={this.handleClickListItem}
                  >
                    <ListItemIcon>
                      {options[this.state.selectedIndex].icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={options[this.state.selectedIndex].name}
                    />
                  </ListItem>
                </List>
                <Menu
                  id="type-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={this.handleClose}
                >
                  {options.map((option, idx) => {
                    return (
                      <MenuItem
                        key={idx}
                        disabled={option.disabled}
                        selected={idx === this.state.selectedIndex}
                        onClick={event => this.handleMenuItemClick(event, idx)}
                      >
                        <ListItemIcon>{option.icon}</ListItemIcon>
                        <ListItemText inset primary={option.name} />
                      </MenuItem>
                    );
                  })}
                </Menu>
              </div>
              <div style={{ width: '320px' }}>
                <Textarea
                  inputRef={tag => (this.textarea = tag)}
                  minRows={1}
                  maxRows={6}
                  placeholder={`Name your ${
                    options[this.state.selectedIndex].shortName
                  }!`}
                  value={workspaceName}
                  // onKeyDown={this.keyPress}
                  onChange={e => this.handleWorkspaceNameInputChange(e)}
                  className={classesInCSS.Textarea}
                />
              </div>
            </WorkspaceNameContainer>
            <SubmitButtonContainer>
              <CapitalizedButton
                variant="outlined"
                color="primary"
                onClick={() => this.createNewWorkspaceClickedHandler()}
              >
                Create new {options[this.state.selectedIndex].shortName}!
              </CapitalizedButton>
            </SubmitButtonContainer>
          </CreateNewWorkspacePromptContainer>
        </CreateNewWorkspacePageContainer>
      </React.Fragment>
    );
  }
}

export default withRouter(CreateNewWorkspace);
