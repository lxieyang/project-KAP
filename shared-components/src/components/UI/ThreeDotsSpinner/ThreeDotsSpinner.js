import React from 'react';
import styles from './ThreeDotsSpinner.css';

const ThreeDotsSpinner = () => (
  <div className={styles.Spinner}>
    <div className={styles.Bounce1}></div>
    <div className={styles.Bounce2}></div>
    <div className={styles.Bounce3}></div>
  </div>
);

export default ThreeDotsSpinner;