import React, { Component } from 'react';
import styled from 'styled-components';
import { sortBy, debounce } from 'lodash';
import styles from './RegularCell.css';
import ThumbV1 from '../../../../../../../../../../shared-components/src/components/UI/Thumbs/ThumbV1/ThumbV1';
import InfoIcon from '../../../../../../../../../../shared-components/src/components/UI/Thumbs/InfoIcon/InfoIcon';

// import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
// import RatingLayer from './RatingLayer/RatingLayer';
import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES,
  ANNOTATION_TYPES,
  RATING_TYPES
} from '../../../../../../../../../../shared-components/src/shared/types';
import {
  THEME_COLOR,
  PIECE_COLOR
} from '../../../../../../../../../../shared-components/src/shared/theme';

import ReactTooltip from 'react-tooltip';
import { withStyles } from '@material-ui/core/styles';
import Chat from 'mdi-material-ui/Chat';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';

import Textarea from 'react-textarea-autosize';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

// import CellComments from '../CellComments/CellComments';
import { getFirstNWords } from '../../../../../../../../../../shared-components/src/shared/utilities';

const materialStyles = theme => ({
  iconButtons: {
    padding: '4px'
  },
  iconInIconButtons: {
    width: '14px',
    height: '14px',
    color: 'rgb(187, 187, 187)'
  }
});

class RegularCell extends Component {
  state = {
    contentEdit: this.props.cell.content,

    // comment popover
    anchorEl: null
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.content !== this.props.cell.content)
      this.setState({ contentEdit: this.props.cell.content });
  }

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    // this.saveContentCallback = debounce(event => {
    //   FirestoreManager.setTableCellContentById(
    //     this.props.workspace.id,
    //     this.props.cell.id,
    //     event.target.value
    //   );
    // }, 500);
  }

  handleCommentClick = event => {
    this.setState({
      anchorEl: event.currentTarget
    });
  };

  handleCommentClose = () => {
    this.setState({
      anchorEl: null
    });
  };

  keyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.saveCellContentClickedHandler(e);
    }
  }

  handleCellContentInputChange = e => {
    // e.persist();
    this.setState({ contentEdit: e.target.value });
    // this.saveContentCallback(e);
  };

  saveCellContentClickedHandler = e => {
    e.stopPropagation();
    this.textarea.blur();
    FirestoreManager.setTableCellContentById(
      this.props.workspace.id,
      this.props.cell.id,
      this.state.contentEdit
    );
  };

  removePieceFromCellClickedHandler = (e, pieceId) => {
    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );
  };

  ratingIconClickedHandler = (e, pieceId, pieceType) => {
    e.stopPropagation();
    if (
      this.props.currentSelectedPieceInTable === null ||
      this.props.currentSelectedPieceInTable.pieceId !== pieceId
    ) {
      this.props.setCurrentSelectedPieceInTable({ pieceId, pieceType });
    } else {
      this.props.setCurrentSelectedPieceInTable({
        pieceId: null,
        pieceType: null
      });
    }
  };

  render() {
    let { classes, cell, pieces, comments, commentCount } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    let piecesList = cell.pieces;

    return (
      <td
        className={styles.RegularCell}
        style={{
          backgroundColor:
            this.props.columnIndex === this.props.columnToDelete
              ? THEME_COLOR.alertBackgroundColor
              : 'transparent'
        }}
      >
        {/* regular */}
        <div className={styles.RegularContentContainer}>
          {piecesList.length > 0 ? (
            <div className={styles.EvidenceIconContainer}>
              {sortBy(piecesList, ['rating']).map((p, idx) => {
                let piece = pieces[p.pieceId];
                if (piece !== undefined && piece !== null) {
                  let icon = <InfoIcon />;
                  switch (p.rating) {
                    case RATING_TYPES.positive:
                      icon = <ThumbV1 type={'up'} />;
                      break;
                    case RATING_TYPES.negative:
                      icon = <ThumbV1 type={'down'} />;
                      break;
                    case RATING_TYPES.info:
                      icon = <InfoIcon />;
                      break;
                    default:
                      break;
                  }
                  return (
                    <React.Fragment key={`${p.pieceId}-${idx}`}>
                      {/*<ContextMenuTrigger
                        id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                        holdToDisplay={-1}
                      >*/}
                      <div
                        className={[
                          styles.AttitudeInTableCell,
                          this.props.currentSelectedPieceInTable !== null &&
                          this.props.currentSelectedPieceInTable.pieceId ===
                            piece.id
                            ? styles.AttitudeInTableCellSelected
                            : null,
                          this.props.currentSelectedPieceInTable !== null &&
                          this.props.currentSelectedPieceInTable.pieceId !==
                            piece.id
                            ? styles.AttitudeInTableCellNotSelected
                            : null
                        ].join(' ')}
                        onClick={e =>
                          this.ratingIconClickedHandler(
                            e,
                            piece.id,
                            piece.pieceType
                          )
                        }
                      >
                        {icon}
                      </div>
                      {/*</ContextMenuTrigger>*/}

                      <ContextMenu
                        id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                      >
                        <MenuItem
                          onClick={e =>
                            this.removePieceFromCellClickedHandler(e, p.pieceId)
                          }
                        >
                          Remove from table
                        </MenuItem>
                      </ContextMenu>
                    </React.Fragment>
                  );
                } else {
                  return null;
                }
              })}
            </div>
          ) : null}

          <div
            className={[
              styles.CellContentEditContainer,
              this.state.contentEdit === '' ? styles.HoverToReveal : null
            ].join(' ')}
          >
            <div
              className={styles.TextAreaContainer}
              title={this.state.contentEdit}
            >
              <Textarea
                inputRef={tag => (this.textarea = tag)}
                minRows={1}
                maxRows={3}
                placeholder={''}
                value={this.state.contentEdit}
                onKeyDown={this.keyPress}
                onBlur={e => this.saveCellContentClickedHandler(e)}
                onChange={e => this.handleCellContentInputChange(e)}
                className={[styles.Textarea].join(' ')}
              />
            </div>
          </div>
        </div>
      </td>
    );
  }
}

export default withStyles(materialStyles)(RegularCell);
