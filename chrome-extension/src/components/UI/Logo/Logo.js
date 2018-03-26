import React from 'react';

import AppLogo from '../../../assets/images/icon-128.png';
import styles from './Logo.css';

/*
  props:
    - hover: boolean (true / false)
    - size: string ('50px')
*/

const logo = (props) => {
  return (
    <div className={props.hover ? styles.Logo : null} style={{width: props.size, height: props.size}}>
      <img className={styles.Img} src={AppLogo} alt="KAP Logo" />
    </div>
  );
};

export default logo;