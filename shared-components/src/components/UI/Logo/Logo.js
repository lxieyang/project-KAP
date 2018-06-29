/* global chrome */
import React from 'react';

import AppLogo from '../../../assets/images/icon-128.png';
import styles from './Logo.css';

/*
  props:
    - hover: boolean (true / false)
    - size: string ('50px')
*/

const logo = (props) => {
  let src = AppLogo;

  if (window.chrome !== undefined && chrome.extension !== undefined) {
    src = chrome.extension.getURL(AppLogo);
  }

  return (
    <div className={props.hover ? styles.Logo : null} style={{width: props.size, height: props.size}}>
      <img className={styles.Img} src={src} alt="KAP Logo" />
    </div>
  );
};

export default logo;