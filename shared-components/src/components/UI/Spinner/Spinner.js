import React from 'react';

import styles from './Spinner.css';

const spinner = (props) => (
  <div style={{width: props.size, height: props.size}}>
    <div className={styles.ldsDualRing}></div>
  </div>
  
);

export default spinner;