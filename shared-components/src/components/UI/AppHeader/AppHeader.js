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
          &nbsp;
          for &nbsp;
          <span className={styles.LetterC}>C</span>
          <span className={styles.LetterH}>h</span>
          <span className={styles.LetterR}>r</span>
          <span className={styles.LetterO}>o</span>
          <span className={styles.LetterM}>m</span>
          <span className={styles.LetterE}>e</span>
        </div>
      </div>
    </Aux>
  );
};

export default appHeader;