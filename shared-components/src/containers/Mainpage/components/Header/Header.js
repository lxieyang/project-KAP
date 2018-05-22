import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt';
import Aux from '../../../../hoc/Aux/Aux';
import NavigationItems from './NavigationItems/NavigationItems';
import Logo from '../../../../components/UI/Logo/Logo';
import AppHeader from '../../../../components/UI/AppHeader/AppHeader';
import SearchBar from '../../../../components/UI/SeachBar/SearchBar';
import styles from './Header.css';
import ProfileImg from '../../../../assets/images/profile-img.png';
import ReactTooltip from 'react-tooltip';
import Popover from 'react-tiny-popover';
import { NavLink } from 'react-router-dom';
import * as appRoutes from '../../../../shared/routes';

class Header extends Component {
  state = {
    userId: this.props.userId,
    popoverOpen: false
  }

  handleClick(e) {
    this.setState({popoverOpen: !this.state.popoverOpen});
  }

  handleClose(e) {
    this.setState({popoverOpen: false});
  }

  inputChangedHandler = (event) => {
    this.setState({userId: event.target.value});
  }

  // buttonClickedHandler = (event) => {
  //   const { userId } = this.state;
  //   if (userId !== "") {
  //     this.props.resetParameters(userId);
  //     ReactTooltip.hide();
  //   }
  // }

  render () {
    const { userName, userProfilePhotoURL, authenticated } = this.props;

    if (!authenticated) {
      return (
        <Aux>
          <header className={styles.Header}>
            <div style={{width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
              <AppHeader logoSize='38px' hover={false}/>
            </div>
          </header>
        </Aux>
      )
    }

    return (
      <Aux>
        <header className={styles.Header}>
          <div>
            <div 
              className={styles.LogoBox}
              // data-tip
              // data-event='click focus'
              //data-for="hohohahei"
              >
              <Logo 
                hover={true} size='38px'/>
            </div>
            {/*<ReactTooltip 
              id="hohohahei"
              place="bottom" 
              type="light" 
              effect="solid"
              className={styles.Tooltip}>
              <input 
                type="text" 
                placeholder={'User ID'}
                onChange={(event) => this.inputChangedHandler(event)}/><br />
              <button
                onClick={(event) => this.buttonClickedHandler(event)}>
                Change
              </button>
            </ReactTooltip>*/}
          </div>
          
          
          <nav>
            <NavigationItems currentTask={this.props.taskName}/>
          </nav>
  
  
          <div className={styles.ToTheRight}>
            <div className={styles.SearchBox}>
              <SearchBar />
            </div>
            <Popover
              containerStyle={{zIndex: '100000'}}
              containerClassName={styles.LogoutPopover}
              isOpen={this.state.popoverOpen}
              position={'bottom'} 
              align={'end'}
              onClickOutside={this.handleClose.bind(this)}
              content={(
                <div className={styles.MenuItem} onClick={this.handleClose.bind(this)}>
                  <NavLink 
                    to={appRoutes.LOG_OUT}
                    exact>
                    <div className={styles.Label}>
                      <FontAwesomeIcon icon={fasSignOutAlt} /> &nbsp;
                      Sign out
                    </div>
                  </NavLink>
                </div>
              )}
            >
              <div 
                className={styles.Profile}
                onClick={this.handleClick.bind(this)}>
                <img src={userProfilePhotoURL !== null ? userProfilePhotoURL : ProfileImg} alt="" className={styles.ProfileImg}/> 
                <span>{userName}</span>
              </div>
            </Popover>
            
            
            <div>
              {/*<NavLink 
                to={appRoutes.LOG_IN}
                exact
                activeClassName={styles.active}>
                <div className={styles.Label}>Log in</div>
              </NavLink>*/}
              {/*<NavLink 
                to={appRoutes.LOG_OUT}
                exact>
                <div className={styles.Label}>Log out</div>
              </NavLink>*/}
            </div>
          </div>
        </header>
      </Aux>
    );
  }
}

export default Header;