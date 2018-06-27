import React from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCog from '@fortawesome/fontawesome-free-solid/faCog';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';

import Aux from '../../../hoc/Aux/Aux';
import Logo from '../Logo/Logo';
import styles from './AppHeader.css';

const appHeader = (props) => {
  return (
    <Aux>
      <div className={styles.AppHeader}>
        <Logo size={props.logoSize} hover={props.hover} />
        <div className={styles.HeaderText}>
          <strong>Knowledge Acclerator for Programming</strong>
          &nbsp;
          in &nbsp;
          <span className={styles.LetterC}>C</span>
          <span className={styles.LetterH}>h</span>
          <span className={styles.LetterR}>r</span>
          <span className={styles.LetterO}>o</span>
          <span className={styles.LetterM}>m</span>
          <span className={styles.LetterE}>e</span>
        </div>
        <div 
          className={styles.HeaderIconContainer} 
          style={{display: props.shouldDisplayHeaderButtons === false ? 'none' : null}} >
          <div 
            title={'Open a KAP tab'}
            onClick={(event) => props.openInNewTabClickedHandler()}>
            <FontAwesomeIcon icon={fasExternalLinkSquareAlt} className={styles.IconInHeader} />
          </div>
          <div 
            title={'Open settings tab'}
            onClick={(event) => props.openSettingsPageClickedHandler()}>
            <FontAwesomeIcon icon={fasCog} className={styles.IconInHeader} />
          </div>
        </div>
      </div>
    </Aux>
  );
};

export default appHeader;