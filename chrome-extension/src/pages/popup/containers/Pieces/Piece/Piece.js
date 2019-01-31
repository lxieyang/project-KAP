import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import * as FirestoreManager from '../../../../../../../shared-components/src/firebase/firestore_wrapper';
import LinesEllipsis from 'react-lines-ellipsis';
import { PIECE_TYPES } from '../../../../../../../shared-components/src/shared/types';
import styles from './Piece.css';

class Piece extends Component {
  state = {
    // piece: this.props.piece,
    collapse: true
  };

  render() {
    let { piece } = this.props;
    let color = styles.SnippetColor;
    let icon = fasBookmark;

    switch (piece.pieceType) {
      case PIECE_TYPES.snippet:
        color = styles.SnippetColor;
        icon = fasBookmark;
        break;
      case PIECE_TYPES.option:
        color = styles.OptionColor;
        icon = fasListUl;
        break;
      case PIECE_TYPES.criterion:
        color = styles.CriterionColor;
        icon = fasFlagCheckered;
        break;
      default:
        break;
    }

    return (
      <React.Fragment>
        <div className={styles.PieceContainer}>
          <div className={[styles.PieceLeftDragHandle, color].join(' ')}>
            <FontAwesomeIcon icon={icon} />
          </div>
          <div className={styles.PieceRightContentBox}>
            <LinesEllipsis
              text={piece.text}
              maxLine="2"
              ellipsis="..."
              trimRight
              basedOn="letters"
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Piece;
