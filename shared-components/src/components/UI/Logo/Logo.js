/* global chrome */
import React from 'react';

import AppLogo from '../../../assets/images/icon-128.png';
import styles from './Logo.css';

/*
  props:
    - hover: boolean (true / false)
    - size: string ('50px')
*/

const logo = props => {
  let src = AppLogo;

  if (window.chrome !== undefined && chrome.extension !== undefined) {
    src = chrome.extension.getURL(AppLogo);
  }

  return (
    <div
      className={props.hover ? styles.Logo : null}
      style={{
        ...props.style,
        width: props.size,
        height: props.size,
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <img className={styles.Img} src={src} alt="APP Logo" />
    </div>
  );
};

export default logo;
