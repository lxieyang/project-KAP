/* global chrome */
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCog from '@fortawesome/fontawesome-free-solid/faCog';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';
import fasSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt';
import Aux from '../../../../hoc/Aux/Aux';
import NavigationItems from './NavigationItems/NavigationItems';
import Logo from '../../../../components/UI/Logo/Logo';
import AppHeader from '../../../../components/UI/AppHeader/AppHeader';
import { APP_WEBSITE } from '../../../../shared/constants';

class Header extends Component {
  state = {
  }

  render () {
    const { authenticated } = this.props;

    if (!authenticated) {
      return (
        <Aux>
          <div style={{position: 'fixed', top: '0', left: '0', width: '100%', zIndex: '1000'}}>
            <AppHeader 
              logoSize='38px' hover={false} 
              shouldDisplayHeaderButtons={false}
              openInNewTabClickedHandler={() => window.open(APP_WEBSITE)}/>
          </div>
        </Aux>
      )
    }

  }
}

export default withRouter(Header);