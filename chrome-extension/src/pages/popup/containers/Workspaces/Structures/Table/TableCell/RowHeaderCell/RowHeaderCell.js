import React, { Component } from 'react';
import styled from 'styled-components';
import ReactHoverObserver from 'react-hover-observer';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import { debounce } from 'lodash';
import styles from './RowHeaderCell.css';

// import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import Spinner from '../../../../../../../../../../shared-components/src/components/UI/Spinner/Spinner';

import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import DeleteIcon from '@material-ui/icons/Delete';
import Chat from 'mdi-material-ui/Chat';
import CheckCircle from 'mdi-material-ui/CheckCircle';
import Cancel from 'mdi-material-ui/Cancel';
import Tooltip from '@material-ui/core/Tooltip';
import Popover from '@material-ui/core/Popover';
import Textarea from 'react-textarea-autosize';
import Button from '@material-ui/core/Button';

import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES,
  ANNOTATION_TYPES
} from '../../../../../../../../../../shared-components/src/shared/types';
import {
  THEME_COLOR,
  PIECE_COLOR
} from '../../../../../../../../../../shared-components/src/shared/theme';
import { getFirstNWords } from '../../../../../../../../../../shared-components/src/shared/utilities';
// import CellComments from '../CellComments/CellComments';

const materialStyles = theme => ({
  iconButtons: {
    padding: '3px'
  },
  iconInIconButtons: {
    width: '11px',
    height: '11px',
    color: 'rgb(187, 187, 187)'
  },
  button: {
    marginTop: 0,
    marginBottom: 0,
    marginRight: 8,
    padding: '1px 4px 1px 4px',
    fontSize: 12
  }
});

const ActionButton = withStyles({
  root: {
    minWidth: '0',
    padding: '0px 4px'
  },
  label: {
    textTransform: 'capitalize'
  }
})(Button);

class RowHeaderCell extends Component {
  state = {
    contentEdit: this.props.cell.content,

    // comment popover
    anchorEl: null,

    // manual piece id / pieces
    manualPieceId: '',
    manualPieces: {},
    addingManualPiece: false,

    // textarea focus
    textareaFocused: false
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.content !== this.props.cell.content) {
      this.setState({ contentEdit: this.props.cell.content });
    }
  }

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);

    setTimeout(() => {
      if (this.textarea) {
        this.textarea.focus();
      }
    }, 50);
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
      this.saveCellContentAsPiece();
    }
  }

  handleCellContentInputChange = e => {
    // e.persist();
    this.setState({ contentEdit: e.target.value });
    // this.saveContentCallback(e);
  };

  saveCellContentAsPiece = () => {
    this.textarea.blur();
    let newPieceContent = this.state.contentEdit;
    if (newPieceContent !== '') {
      setTimeout(() => {
        FirestoreManager.setTableCellContentById(
          this.props.workspace.id,
          this.props.cell.id,
          newPieceContent
        );
        // this.setState({ addingManualPiece: true });

        // go create piece and eventually replace cell content with piece
        FirestoreManager.createPiece(
          {
            text: newPieceContent
          },
          {
            taskId: this.props.taskId
          },
          ANNOTATION_TYPES.Manual,
          PIECE_TYPES.option
        ).then(pieceId => {
          this.resetPieceInThisCell(pieceId, true);
        });
      }, 50);
    }
  };

  saveCellContentClickedHandler = () => {
    this.saveCellContentAsPiece();
  };

  cancelEditClickedHandler = () => {
    this.setState({ contentEdit: '' });
  };

  deleteTableRowByIndex = event => {
    FirestoreManager.deleteRowInTableByIndex(
      this.props.workspace.id,
      this.props.rowIndex
    );

    this.props.setRowToDelete(-1);
  };

  addPieceToThisCell = pieceId => {
    FirestoreManager.addPieceToTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );

    // change type to option
    this.changePieceType(pieceId);
  };

  resetPieceInThisCell = (pieceId, manual = false) => {
    FirestoreManager.resetPieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    )
      .then(() => {
        if (manual) {
          // this.setState({ addingManualPiece: false });
          FirestoreManager.setTableCellContentById(
            this.props.workspace.id,
            this.props.cell.id,
            ''
          );
        }
      })
      .catch(() => {
        if (manual) {
          // this.setState({ addingManualPiece: false });
          FirestoreManager.setTableCellContentById(
            this.props.workspace.id,
            this.props.cell.id,
            ''
          );
        }
      });

    // change type to option
    this.changePieceType(pieceId);
  };

  changePieceType = (pieceId, to = PIECE_TYPES.option) => {
    FirestoreManager.switchPieceType(pieceId, null, to);
  };

  removePieceFromCellClickedHandler = (e, pieceId) => {
    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );

    // in case it's selected
    if (
      this.props.currentSelectedPieceInTable !== null &&
      this.props.currentSelectedPieceInTable.pieceId === pieceId
    ) {
      this.props.setCurrentSelectedPieceInTable({
        pieceId: null,
        pieceType: null
      });
    }
  };

  switchOptionCheckedStatus = () => {
    FirestoreManager.switchTableCellCheckedStatus(
      this.props.workspace.id,
      this.props.cell.id,
      !this.props.cell.checked
    );
  };

  pieceNameContainerClickedHandler = (e, pieceId, pieceType) => {
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

    let deleteRowActionContainer = (
      <div className={styles.DeleteRowIconContainer}>
        <ReactHoverObserver
          {...{
            onMouseEnter: () => {
              this.props.setRowToDelete(this.props.rowIndex);
            },
            onMouseLeave: () => {
              this.props.setRowToDelete(-1);
            }
          }}
        >
          <div>
            <Tooltip title="Delete this row" placement={'top'}>
              <IconButton
                aria-label="Delete"
                className={classes.iconButtons}
                onClick={() => this.deleteTableRowByIndex()}
              >
                <DeleteIcon className={classes.iconInIconButtons} />
              </IconButton>
            </Tooltip>
          </div>
        </ReactHoverObserver>
      </div>
    );

    let pieceInCell = null;
    if (cell.pieces.length > 0) {
      pieceInCell = pieces[cell.pieces[0].pieceId];
    }

    return (
      <td
        className={styles.RowHeaderCell}
        style={{
          borderLeft: `3px solid ${PIECE_COLOR.option}`,
          backgroundColor: cell.checked
            ? THEME_COLOR.optionChosenBackgroundColor
            : null
        }}
      >
        {deleteRowActionContainer}

        <div className={styles.RowHeaderCellContainer}>
          {pieceInCell !== null ? (
            <React.Fragment>
              <ContextMenuTrigger
                id={`${cell.id}-context-menu`}
                holdToDisplay={-1}
              >
                <div
                  className={[
                    styles.PieceNameContainer,
                    this.props.currentSelectedPieceInTable !== null &&
                    this.props.currentSelectedPieceInTable.pieceId ===
                      pieceInCell.id
                      ? styles.PieceNameContainerSelected
                      : null,
                    this.props.currentSelectedPieceInTable !== null &&
                    this.props.currentSelectedPieceInTable.pieceId !==
                      pieceInCell.id
                      ? styles.PieceNameContainerNotSelected
                      : null
                  ].join(' ')}
                  title={pieceInCell.name}
                  onClick={e =>
                    this.pieceNameContainerClickedHandler(
                      e,
                      pieceInCell.id,
                      pieceInCell.pieceType
                    )
                  }
                >
                  {getFirstNWords(10, pieceInCell.name)}
                </div>
              </ContextMenuTrigger>
              <ContextMenu id={`${cell.id}-context-menu`}>
                <MenuItem
                  onClick={e =>
                    this.removePieceFromCellClickedHandler(e, pieceInCell.id)
                  }
                >
                  Remove from table
                </MenuItem>
              </ContextMenu>
            </React.Fragment>
          ) : null}
        </div>
      </td>
    );
  }
}

export default withStyles(materialStyles)(RowHeaderCell);
