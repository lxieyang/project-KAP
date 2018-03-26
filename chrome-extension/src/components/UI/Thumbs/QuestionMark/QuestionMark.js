/* global chrome */
import React from 'react';

import QuestionMark from '../../../../assets/images/question-mark-100.jpg';
import styles from './QuestionMark.css';

const questionMark = (props) => {
  return (
    <div className={styles.ImageContainer}>
      <img src={chrome.extension.getURL(QuestionMark)}
        alt="question-mark"/>
    </div>
  );
}

export default questionMark;