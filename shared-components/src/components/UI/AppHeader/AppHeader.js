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

  switchPopoverOpenStatus = () => {
    this.setState(prevState => {
      return {popoverOpen: !prevState.popoverOpen}
    });
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

  openSettingsPageClickedHandler = () => {
    this.switchPopoverOpenStatus();
    setTimeout(() => {
      this.props.openSettingsPageClickedHandler();
    }, 300);
  }

  render () {
    const props = this.props;
    return (
      <Aux>
        <div className={styles.AppHeader} >
          <div className={styles.HeaderText} onClick={(event) => props.openInNewTabClickedHandler()}>
            <Logo size={props.logoSize} hover={props.hover} /> &nbsp;&nbsp;
            <strong>{APP_NAME_LONG}</strong>
            &nbsp;
            {/*
            in &nbsp;
            <span className={styles.LetterC}>C</span>
            <span className={styles.LetterH}>h</span>
            <span className={styles.LetterR}>r</span>
            <span className={styles.LetterO}>o</span>
            <span className={styles.LetterM}>m</span>
            <span className={styles.LetterE}>e</span>
            */}
          </div>
          <div
            className={styles.HeaderIconContainer}
            style={{display: props.shouldDisplayHeaderButtons === false ? 'none' : null}} >
            <div
              className={styles.HeaderButton}
              onClick={(event) => props.openInNewTabClickedHandler()}>
              <FontAwesomeIcon icon={fasExternalLinkSquareAlt} className={styles.IconInButton} />
              <span>Open {APP_NAME_SHORT} Tab</span>
            </div>

            <Popover
              containerStyle={{zIndex: '100000'}}
              containerClassName={styles.LogoutPopoverContainer}
              isOpen={this.state.popoverOpen}
              position={'bottom'}
              align={'end'}
              onClickOutside={this.handleClose.bind(this)}
              content={(
                  props.isSigningOut === true
                ? <div className={styles.SpinnerContainer}>
                    <Spinner size='25px' />
                  </div>
                : <div className={styles.PopoverContentContainer}>
                    <ul>
                      <li onClick={(event) => this.openSettingsPageClickedHandler()}>
                        <div className={styles.IconBoxInPopover}>
                          <FontAwesomeIcon icon={fasCog} className={styles.IconInPopover}/>
                        </div>
                        <div>Open Settings</div>
                      </li>

                      <li onClick={(event) => this.handleSignOut()}>
                        <div className={styles.IconBoxInPopover}>
                          <FontAwesomeIcon icon={fasSignOutAlt} className={styles.IconInPopover}/>
                        </div>
                        <div>Sign out</div>
                      </li>
                    </ul>
                  </div>
              )}
            >
              <div
                title={'More...'}
                className={styles.Profile}
                onClick={() => this.switchPopoverOpenStatus()}>
                <img
                  src={props.userProfilePhotoURL !== null ? props.userProfilePhotoURL : ProfileImg}
                  alt=""
                  className={styles.ProfileImg}/>
                <span>{props.userName}</span>
              </div>
            </Popover>

          </div>
        </div>
      </Aux>
    );
  }
};

export default AppHeader;
