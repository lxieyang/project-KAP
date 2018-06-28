import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCog from '@fortawesome/fontawesome-free-solid/faCog';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';
import fasSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt';
import Popover from 'react-tiny-popover';
import ProfileImg from '../../../assets/images/profile-img.png';
import { APP_NAME_LONG, APP_NAME_SHORT } from '../../../shared/constants';
import Spinner from '../../UI/Spinner/Spinner';
import Aux from '../../../hoc/Aux/Aux';
import Logo from '../Logo/Logo';
import styles from './AppHeader.css';

class AppHeader extends Component {
  state = {
    popoverOpen: false
  }

  handleClick(e) {
    this.setState({popoverOpen: !this.state.popoverOpen});
  }

  handleClose(e) {
    this.setState({popoverOpen: false});
  }

  handleSignOut = () => {
    this.props.signOutClickedHandler();
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (nextProps.shouldDisplayHeaderButtons === false) {
      this.setState({popoverOpen: false});
    }
  }

  render () {
    const props = this.props;
    return (
      <Aux>
        <div className={styles.AppHeader}>
          <div className={styles.HeaderText}>
            <Logo size={props.logoSize} hover={props.hover} /> &nbsp;&nbsp;
            <strong>{APP_NAME_LONG}</strong>
            &nbsp;
            in &nbsp;
            <span className={styles.LetterC}>C</span>
            <span className={styles.LetterH}>h</span>
            <span className={styles.LetterR}>r</span>
            <span className={styles.LetterO}>o</span>
            <span className={styles.LetterM}>m</span>
            <span className={styles.LetterE}>e</span>
          </div>
          <div 
            className={styles.HeaderIconContainer} 
            style={{display: props.shouldDisplayHeaderButtons === false ? 'none' : null}} >
            <div 
              title={`Open a ${APP_NAME_SHORT} tab`}
              onClick={(event) => props.openInNewTabClickedHandler()}>
              <FontAwesomeIcon icon={fasExternalLinkSquareAlt} className={styles.IconInHeader} />
            </div>
            <div 
              title={'Open settings tab'}
              onClick={(event) => props.openSettingsPageClickedHandler()}>
              <FontAwesomeIcon icon={fasCog} className={styles.IconInHeader} />
            </div>

            <Popover
              containerStyle={{zIndex: '100000'}}
              containerClassName={styles.LogoutPopover}
              isOpen={this.state.popoverOpen}
              position={'bottom'} 
              align={'end'}
              onClickOutside={this.handleClose.bind(this)}
              content={(
                  props.isSigningOut === true
                ? <div className={styles.SpinnerContainer}>
                    <Spinner size='25px' />
                  </div>
                : <div 
                    className={styles.MenuItem} 
                    onClick={(event) => this.handleSignOut()}>
                    <div className={styles.Label}>
                      &nbsp;
                      <FontAwesomeIcon icon={fasSignOutAlt} />&nbsp;
                      Sign out
                    </div>
                  </div>
              )}
            >
              <div 
                className={styles.Profile}
                title={'Click to sign out'}
                onClick={this.handleClick.bind(this)}>
                <img 
                  src={props.userProfilePhotoURL !== null ? props.userProfilePhotoURL : ProfileImg}
                  alt="" 
                  className={styles.ProfileImg}/>
              </div>
            </Popover>
            
          </div>
        </div>
      </Aux>
    );
  }
};

export default AppHeader;