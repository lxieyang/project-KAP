import React, { Component } from 'react';
import Aux from '../../../../../../shared-components/src/hoc/Aux/Aux';
import Logo from '../../../../../../shared-components/src/components/UI/Logo/Logo';
import ProfileImg from '../../../../../../shared-components/src/assets/images/profile-img.png';
import { APP_NAME_LONG } from '../../../../../../shared-components/src/shared/constants';
import styles from './Header.css';

class Header extends Component {
  render() {
    const { userName, userProfilePhotoURL } = this.props;

    return (
      <Aux>
        <header className={styles.Header}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <div 
              className={styles.LogoBox}>
              <Logo 
                hover={true} size='38px'/>
            </div>
            &nbsp; &nbsp;
            <strong>{APP_NAME_LONG}</strong>
          </div>

          <div 
            className={styles.Profile}>
            <img 
              src={userProfilePhotoURL !== null ? userProfilePhotoURL : ProfileImg} 
              alt="" 
              className={styles.ProfileImg}/> 
            <span>{userName}</span>
          </div>
        </header>
      </Aux>
    )
  }
}

export default Header;
