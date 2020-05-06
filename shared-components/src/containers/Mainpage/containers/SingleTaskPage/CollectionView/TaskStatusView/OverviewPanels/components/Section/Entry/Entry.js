import React, { Component } from 'react';
import styles from './Entry.css';

import { GoArrowUp, GoArrowDown } from 'react-icons/go';
import { TiMinus } from 'react-icons/ti';

const STATUS_MAP = {
  good: () => <GoArrowUp color="green" />,
  bad: () => <GoArrowDown color="red" />,
  neutral: () => <TiMinus color="yellow" />
};

class Entry extends Component {
  render() {
    const { status, content } = this.props;

    if (status === 'good' || status === 'bad') {
      return (
        <div className={styles.EntryContainer}>
          <span className={styles.StatusIndicator}>{STATUS_MAP[status]()}</span>
          <div>{content}</div>
        </div>
      );
    }
  }
}

export default Entry;
