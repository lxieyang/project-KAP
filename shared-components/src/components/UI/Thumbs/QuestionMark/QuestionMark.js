/* global chrome */
import React from 'react';

import QuestionMark from '../../../../assets/images/question-mark-100.jpg';
import styles from './QuestionMark.css';

const questionMark = (props) => {
  let src = QuestionMark;
  if (window.chrome !== undefined && chrome.extension !== undefined) {
    src = chrome.extension.getURL(QuestionMark);
  }

  return (
    <div className={styles.ImageContainer}>
      <img src={src}
        alt="question-mark"/>
    </div>
  );
}

export default questionMark;