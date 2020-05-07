import React, { Component } from 'react';
import styles from './Entry.css';

import { GoArrowUp, GoArrowDown } from 'react-icons/go';
import { TiMinus } from 'react-icons/ti';

const STATUS_MAP = {
  good: () => <GoArrowUp color="green" />,
  bad: () => <GoArrowDown color="red" />,
  neutral: () => <TiMinus color="#FCBB21" />
};

class Entry extends Component {
  render() {
    const { status, content } = this.props;

    return (
      <div className={styles.EntryContainer}>
        <span className={styles.StatusIndicator}>{STATUS_MAP[status]()}</span>
        <div>{content}</div>
      </div>
    );
  }
}

export default Entry;
