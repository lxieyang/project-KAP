/* global chrome */
import React, { Component } from 'react';
import { APP_NAME_SHORT } from '../../../../../../shared-components/src/shared/constants';

import Logo from '../../../../../../shared-components/src/components/UI/Logo/Logo';

import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';

const StyledButton = withStyles({
  root: {
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    borderRadius: 3,
    border: 0,
    color: 'white',
    height: 'auto',
    padding: '3px 0px',
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
  },
  label: {
    textTransform: 'capitalize'
  }
})(Button);

class NotLoggedIn extends Component {
  state = {};

  goToAuthPage = () => {
    chrome.runtime.sendMessage({
      msg: 'GO_TO_AUTH_PAGE_TO_LOG_IN',
      path: 'login'
    });
  };

  render() {
    return (
      <div style={{ padding: '10px 18px' }}>
        <Typography component="p">
          <strong>{APP_NAME_SHORT}</strong> helps you collect and organize
          online resources into meaningful structures while programming.
        </Typography>
        <Typography component="p">
          To start using <strong>{APP_NAME_SHORT}</strong>, please
        </Typography>
        <div
          style={{
            marginTop: '10px',
            width: '100%',
            display: 'flex'
            // justifyContent: 'center'
          }}
        >
          <StyledButton
            variant="contained"
            color="inherit"
            onClick={() => this.goToAuthPage()}
          >
            Log in
          </StyledButton>
        </div>
      </div>
    );
  }
}

export default NotLoggedIn;
