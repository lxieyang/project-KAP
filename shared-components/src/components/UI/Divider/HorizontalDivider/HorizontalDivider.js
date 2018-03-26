import React from 'react';

import styles from './HorizontalDivider.css';

/*
  props:
    - margin: string ('10px')
*/

const horizontalDivider = (props) => (
  <hr 
    className={styles.HorizontalDivider}
    style={{
      marginLeft: props.margin ? props.margin : '15px',
      marginRight: props.margin ? props.margin : '15px',
    }}
    >
  </hr>
);

export default horizontalDivider;