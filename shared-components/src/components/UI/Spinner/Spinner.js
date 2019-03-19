import React from 'react';

import styles from './Spinner.css';

const spinner = props => (
  <div
    style={{
      width: props.size,
      height: props.size,
      transform: `scale(${props.scale !== undefined ? props.scale : null})`
    }}
  >
    <div className={styles.ldsDualRing} />
  </div>
);

export default spinner;
