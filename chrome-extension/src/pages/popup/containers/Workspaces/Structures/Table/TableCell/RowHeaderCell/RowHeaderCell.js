import React, { Component } from 'react';
import styled from 'styled-components';
import ReactHoverObserver from 'react-hover-observer';
import { debounce } from 'lodash';
import styles from './RowHeaderCell.css';

// import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import Spinner from '../../../../../../../../../../shared-components/src/components/UI/Spinner/Spinner';

import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
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

const dropTarget = {
  canDrop(props, monitor, component) {
    // can't drop if already exist
    const item = monitor.getItem();
    const dropPieceId = item.id;
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellRowIndex = item.rowIndex;

    const allPieces = props.pieces;
    let cellPieces = props.cell.pieces
      .filter(
        p => allPieces[p.pieceId] !== undefined && allPieces[p.pieceId] !== null
      )
      .map(p => p.pieceId);

    const pieceIds = props.cell.pieces.map(p => p.pieceId);
    if (pieceIds.indexOf(dropPieceId) !== -1) {
      // prevent dropping the same thing
      return false;
    }

    // if (
    //   cellPieces.length === 0 &&
    //   dropPieceCellId !== undefined &&
    //   dropPieceCellType === TABLE_CELL_TYPES.rowHeader
    // ) {
    //   // prevent dropping option from other option cells into this cell
    //   return false;
    //   // TODO: we CANNOT prevent dropping the same option into two option cells if both drops come from the piecesView
    // }

    return true;
  },

  drop(props, monitor, component) {
    const item = monitor.getItem();
    const dropPieceId = item.id;
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellRowIndex = item.rowIndex;

    const allPieces = props.pieces;
    let cellPieces = props.cell.pieces
      .filter(
        p => allPieces[p.pieceId] !== undefined && allPieces[p.pieceId] !== null
      )
      .map(p => p.pieceId);

    if (cellPieces.length === 0 && dropPieceCellId === undefined) {
      // no stuff in this cell, dropping from piecesView
      component.resetPieceInThisCell(dropPieceId);
    } else if (
      cellPieces.length === 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.rowHeader
    ) {
      FirestoreManager.switchRowsInTable(
        props.workspace.id,
        props.rowIndex,
        dropPieceCellRowIndex
      );
    } else if (cellPieces.length > 0 && dropPieceCellId === undefined) {
      // there's existing piece, but dropping on from the pieceView
      component.resetPieceInThisCell(dropPieceId);
    } else if (
      cellPieces.length > 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.rowHeader
    ) {
      // both are from the table, should switch rows
      FirestoreManager.switchRowsInTable(
        props.workspace.id,
        props.rowIndex,
        dropPieceCellRowIndex
      );
    }

    return {
      id: props.cell.id
    };
  }
};

const collectDrop = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
};

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
    textareaFocused: false,

    // pieceNameEdit
    pieceNameEdit: null
  };

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.content !== this.props.cell.content) {
      this.setState({ contentEdit: this.props.cell.content });
    }

    let prevCell = prevProps.cell;
    let prevPieces = prevProps.pieces;
    let { cell, pieces } = this.props;
    let prevPieceInCell = this.getPieceInCell(prevCell, prevPieces);
    let pieceInCell = this.getPieceInCell(cell, pieces);
    if (
      (prevPieceInCell !== null &&
        pieceInCell !== null &&
        prevPieceInCell.name !== pieceInCell.name) ||
      (prevPieceInCell === null && pieceInCell !== null)
    ) {
      this.setState({ pieceNameEdit: pieceInCell.name });
    } else if (prevPieceInCell !== null && pieceInCell === null) {
      this.setState({ pieceNameEdit: null });
    }
  }

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);

    setTimeout(() => {
      if (this.textarea) {
        this.textarea.focus();
      }
    }, 50);

    let { cell, pieces } = this.props;
    if (cell !== null && pieces !== null) {
      let pieceInCell = this.getPieceInCell(cell, pieces);
      if (pieceInCell !== null) {
        this.setState({ pieceNameEdit: pieceInCell.name });
      }
    }

    this.inputCallback = debounce((event, id) => {
      FirestoreManager.updatePieceName(id, this.state.pieceNameEdit);
    }, 1000);
  }

  handlePieceNameInputChange = (event, id) => {
    event.persist();
    this.setState({
      pieceNameEdit: event.target.value
    });
    this.inputCallback(event, id);
  };

  getPieceInCell = (cell, pieces) => {
    let cellPieces = cell.pieces.filter(
      p => pieces[p.pieceId] !== undefined && pieces[p.pieceId] !== null
    );

    let pieceInCell = null;
    if (cellPieces.length > 0) {
      pieceInCell = pieces[cellPieces[0].pieceId];
    }

    return pieceInCell;
  };

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
    if (window.confirm(`Are you sure you want to delete this row?`)) {
      FirestoreManager.deleteRowInTableByIndex(
        this.props.workspace.id,
        this.props.rowIndex
      );

      this.props.setRowToDelete(-1);
    }
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
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { classes, cell, pieces, comments, commentCount } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    let deleteRowActionContainer = (
      <div
        className={[
          styles.DeleteRowIconContainer,
          this.props.currentSelectedPieceInTable === null
            ? styles.DeleteRowIconContainerHover
            : styles.DeleteRowIconContainerHidden
        ].join(' ')}
      >
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

    let cellPieces = cell.pieces.filter(
      p => pieces[p.pieceId] !== undefined && pieces[p.pieceId] !== null
    );

    let pieceInCell = null;
    if (cellPieces.length > 0) {
      pieceInCell = pieces[cellPieces[0].pieceId];
    }

    return connectDropTarget(
      <td
        className={styles.RowHeaderCell}
        style={{
          borderLeft: `3px solid ${PIECE_COLOR.option}`,
          backgroundColor: cell.checked
            ? THEME_COLOR.optionChosenBackgroundColor
            : isOver && canDrop
            ? '#f8c471'
            : null
        }}
      >
        {this.props.numRows > 2 ? deleteRowActionContainer : null}

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
                  {this.props.currentSelectedPieceInTable !== null &&
                  this.props.currentSelectedPieceInTable.pieceId ===
                    pieceInCell.id ? (
                    <Textarea
                      onClick={e => e.stopPropagation()}
                      minRows={2}
                      maxRows={5}
                      placeholder={''}
                      value={this.state.pieceNameEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.target.blur();
                        }
                      }}
                      onChange={e =>
                        this.handlePieceNameInputChange(e, pieceInCell.id)
                      }
                      className={styles.Textarea}
                    />
                  ) : (
                    getFirstNWords(10, pieceInCell.name)
                  )}
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
          ) : (
            <div className={styles.CellContentContainer}>
              <div
                className={[
                  styles.CellContentEditContainer,
                  this.state.contentEdit === '' ? styles.HoverToReveal : null
                ].join(' ')}
              >
                <div className={styles.TextAreaContainer}>
                  <Textarea
                    inputRef={tag => (this.textarea = tag)}
                    minRows={2}
                    maxRows={5}
                    placeholder={'Add an option'}
                    value={this.state.contentEdit}
                    onKeyDown={this.keyPress}
                    onFocus={() => this.setState({ textareaFocused: true })}
                    onBlur={() => this.setState({ textareaFocused: false })}
                    onChange={e => this.handleCellContentInputChange(e)}
                    className={styles.Textarea}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RowHeaderCell)
);
