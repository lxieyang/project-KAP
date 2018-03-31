import React from 'react';

import Aux from '../../../hoc/Aux/Aux';
import Logo from '../Logo/Logo';
import styles from './AppHeader.css';

const appHeader = (props) => {
  return (
    <Aux>
      <div className={styles.AppHeader}>
        <Logo size={props.logoSize} hover={props.hover} />
        <div className={styles.HeaderText}>
          <strong>UNAKITE</strong>: &nbsp; Knowledge Accelerator from Programming
        </div>
      </div>
    </Aux>
  );
};

export default appHeader;