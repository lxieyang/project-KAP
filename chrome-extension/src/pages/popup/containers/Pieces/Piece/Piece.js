import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import * as FirestoreManager from '../../../../../../../shared-components/src/firebase/firestore_wrapper';
import LinesEllipsis from 'react-lines-ellipsis';
import ClampLines from 'react-clamp-lines';
import { PIECE_TYPES } from '../../../../../../../shared-components/src/shared/types';
import { PIECE_COLOR } from '../../../../../../../shared-components/src/shared/theme';
import classes from './Piece.css';

import Card from '@material-ui/core/Card';

class Piece extends Component {
  state = {
    // piece: this.props.piece,
    collapse: true
  };

  render() {
    let { piece } = this.props;
    let color = classes.SnippetColor;
    let icon = fasBookmark;

    switch (piece.pieceType) {
      case PIECE_TYPES.snippet:
        color = PIECE_COLOR.snippet;
        icon = fasBookmark;
        break;
      case PIECE_TYPES.option:
        color = PIECE_COLOR.option;
        icon = fasListUl;
        break;
      case PIECE_TYPES.criterion:
        color = PIECE_COLOR.criterion;
        icon = fasFlagCheckered;
        break;
      default:
        break;
    }

    return (
      <React.Fragment>
        <Card className={classes.PieceContainer}>
          <div
            className={classes.PieceLeftDragHandle}
            style={{ backgroundColor: color }}
          >
            <FontAwesomeIcon icon={icon} />
          </div>
          <div className={classes.PieceRightContentBox}>
            <ClampLines text={piece.text} lines="2" buttons={false} />
          </div>
        </Card>
      </React.Fragment>
    );
  }
}

export default Piece;
