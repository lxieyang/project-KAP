/* global chrome */
import React from 'react';

import ThumbUp from '../../../../assets/images/thumb-up-100.jpg';
import ThumbDown from '../../../../assets/images/thumb-down-100.jpg';
import styles from './ThumbV1.css';

const thumbV1 = (props) => {
  const { type } = props;
  return (
    
      <img 
        className={styles.Image}
        src={
          type === 'up'
          ? chrome.extension.getURL(ThumbUp)
          : chrome.extension.getURL(ThumbDown)
        }
        alt="thumb"/>
 
  );
}

export default thumbV1;