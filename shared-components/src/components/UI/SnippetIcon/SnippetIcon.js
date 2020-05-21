import React from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import { PIECE_TYPES } from '../../../shared/types';
import { PIECE_COLOR } from '../../../shared/theme';
import styles from './SnippetIcon.css';

const SnippetIcon = props => {
  const { type, size } = props;
  let pieceIcon = (
    <FontAwesomeIcon icon={fasBookmark} className={styles.PieceIcon} />
  );
  let pieceColor = PIECE_COLOR.snippet;
  if (type === PIECE_TYPES.criterion) {
    pieceIcon = (
      <FontAwesomeIcon icon={fasFlagCheckered} className={styles.PieceIcon} />
    );
    pieceColor = PIECE_COLOR.criterion;
  } else if (type === PIECE_TYPES.option) {
    pieceIcon = (
      <FontAwesomeIcon icon={fasListUl} className={styles.PieceIcon} />
    );
    pieceColor = PIECE_COLOR.option;
  }
  pieceIcon = React.cloneElement(pieceIcon, { style: { fontSize: size / 2 } });

  return (
    <React.Fragment>
      <div
        className={styles.PieceIconContainer}
        style={{
          backgroundColor: pieceColor,
          width: size ? size : null,
          height: size ? size : null
        }}
      >
        {pieceIcon}
      </div>
    </React.Fragment>
  );
};

export default SnippetIcon;
