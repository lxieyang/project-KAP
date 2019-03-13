/* global chrome */
import React, { Component } from 'react';
import styled from 'styled-components';
import ReactHoverObserver from 'react-hover-observer';
import { debounce } from 'lodash';
import styles from './RowHeaderCell.css';

// import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import Spinner from '../../../../../../../../../../shared-components/src/components/UI/Spinner/Spinner';

import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import Eye from 'mdi-material-ui/Eye';
import EyeOff from 'mdi-material-ui/EyeOff';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import Textarea from 'react-textarea-autosize';
import Button from '@material-ui/core/Button';

import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
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
import { getFirstNWords } from '../../../../../../../../../../shared-components/src/shared/utilities';
// import CellComments from '../CellComments/CellComments';

import PieceItemContainer from '../components/PieceItemContainer';

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

  hover(props, monitor, component) {
    const item = monitor.getItem();
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellRowIndex = item.rowIndex;

    const allPieces = props.pieces;
    let cellPieces = props.cell.pieces
      .filter(
        p => allPieces[p.pieceId] !== undefined && allPieces[p.pieceId] !== null
      )
      .map(p => p.pieceId);

    if (
      cellPieces.length > 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.rowHeader &&
      dropPieceCellRowIndex !== props.rowIndex &&
      props.rowToSwitchA === -1 &&
      props.rowToSwitchB === -1
    ) {
      // both are from the table, should indicate switch columns
      props.setRowToSwitch(props.rowIndex, dropPieceCellRowIndex);
    }
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
    enterKeyHit: false,

    // textarea focus
    // textareaFocused: false,

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

    if (prevProps.isOver === true && this.props.isOver === false) {
      // didn't drop and left
      this.props.setRowToSwitch(-1, -1);
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

    this.saveContentCallback = debounce(event => {
      this.saveCellContentAsPiece();
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
      this.setState({ enterKeyHit: true });
      e.target.blur();
    }
  }

  handleCellContentInputChange = e => {
    e.persist();
    this.setState({ contentEdit: e.target.value });
    this.saveContentCallback(e);
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

          if (!this.state.enterKeyHit) {
            this.pieceNameContainerClickedHandler(
              null,
              pieceId,
              PIECE_TYPES.option
            );

            // focus the textarea
            setTimeout(() => {
              this.textareaForPieceName.focus();
            }, 50);
          }

          this.setState({ enterKeyHit: false });
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

          this.setState({ enterKeyHit: false });
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
    if (e) {
      e.stopPropagation();
    }
    if (this.props.annotation_selected) {
      return;
    }

    this.props.setCurrentSelectedPieceInPieces({
      pieceId: null,
      pieceType: null
    });

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

  putSelectedAnnotationHere = e => {
    e.stopPropagation();
    // console.log(
    //   `should be put in cell '${this.props.cell.id}' as a type ${
    //     this.props.ratingType
    //   } rating`
    // );
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_LOCATION_SELECTED_IN_TABLE',
      payload: {
        tableId: this.props.workspace.id,
        cellId: this.props.cell.id,
        cellType: TABLE_CELL_TYPES.rowHeader,
        ratingType: RATING_TYPES.noRating
      }
    });
  };

  switchHideStatusOfThisRow = toStatus => {
    this.props.setRowToHide(-1);
    FirestoreManager.switchHideRowStatusInTableByIndex(
      this.props.workspace.id,
      this.props.rowIndex,
      toStatus
    );
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let {
      classes,
      cell,
      pieces,
      comments,
      commentCount,
      annotation_selected,
      selected_annotation_id
    } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    let hideRowActionContainer = (
      <div className={styles.HideRowIconContainer}>
        <ReactHoverObserver
          {...{
            onMouseEnter: () => {
              this.props.setRowToHide(this.props.rowIndex);
            },
            onMouseLeave: () => {
              this.props.setRowToHide(-1);
            }
          }}
        >
          <div>
            <Tooltip
              title={`${cell.hide === true ? 'Show' : 'Hide'} this row`}
              placement={'top'}
              disableFocusListener={true}
            >
              <IconButton
                className={classes.iconButtons}
                onClick={() =>
                  this.switchHideStatusOfThisRow(
                    cell.hide === true ? false : true
                  )
                }
              >
                {cell.hide === true ? (
                  <Eye className={classes.iconInIconButtons} />
                ) : (
                  <EyeOff className={classes.iconInIconButtons} />
                )}
              </IconButton>
            </Tooltip>
          </div>
        </ReactHoverObserver>
      </div>
    );

    if (cell.hide === true) {
      return (
        <td
          className={styles.RowHeaderCell}
          style={{
            backgroundImage:
              'linear-gradient(45deg, #ffffff 25%, #e0e0e0 25%, #e0e0e0 50%, #ffffff 50%, #ffffff 75%, #e0e0e0 75%, #e0e0e0 100%)',
            backgroundSize: '11.31px 11.31px'
          }}
          onClick={() => this.switchHideStatusOfThisRow(false)}
        >
          {hideRowActionContainer}
          <div style={{ width: '12px', height: '12px' }} />
        </td>
      );
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

    let hideSupportLayer = cell.hide !== true && (
      <div
        style={{
          zIndex:
            this.props.columnIndex === this.props.columnToHide ||
            this.props.rowIndex === this.props.rowToHide
              ? 3000
              : -100,
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          opacity: 0.5,
          backgroundImage:
            this.props.columnIndex === this.props.columnToHide ||
            this.props.rowIndex === this.props.rowToHide
              ? 'linear-gradient(45deg, #ffffff 25%, #e0e0e0 25%, #e0e0e0 50%, #ffffff 50%, #ffffff 75%, #e0e0e0 75%, #e0e0e0 100%)'
              : null,
          backgroundSize:
            this.props.columnIndex === this.props.columnToHide ||
            this.props.rowIndex === this.props.rowToHide
              ? '11.31px 11.31px'
              : null
        }}
      />
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
            : (isOver && canDrop) ||
              (annotation_selected &&
                pieceInCell !== null &&
                selected_annotation_id === pieceInCell.id) ||
              this.props.rowIndex === this.props.rowToSwitchA
            ? '#f8c471'
            : this.props.rowIndex === this.props.rowToSwitchB
            ? '#E89339'
            : null
        }}
      >
        {this.props.numRows > 2 ? deleteRowActionContainer : null}
        {hideRowActionContainer}
        {hideSupportLayer}

        <div className={styles.RowHeaderCellContainer}>
          {pieceInCell !== null ? (
            <React.Fragment>
              <ContextMenuTrigger
                id={`${cell.id}-context-menu`}
                holdToDisplay={-1}
              >
                <PieceItemContainer
                  // this is for dnd
                  piece={pieceInCell}
                  cellId={cell.id}
                  cellType={cell.type}
                  rowIndex={this.props.rowIndex}
                  columnIndex={this.props.columnIndex}
                  switchDraggingOptionCriterionPieceStatus={
                    this.props.switchDraggingOptionCriterionPieceStatus
                  }
                >
                  <div
                    style={{
                      opacity:
                        annotation_selected &&
                        selected_annotation_id !== pieceInCell.id
                          ? '0.2'
                          : null,
                      cursor: annotation_selected ? 'auto' : null
                    }}
                    className={[
                      styles.PieceNameContainer,
                      (this.props.currentSelectedPieceInTable !== null &&
                        this.props.currentSelectedPieceInTable.pieceId ===
                          pieceInCell.id) ||
                      (this.props.currentSelectedPieceInPieces !== null &&
                        this.props.currentSelectedPieceInPieces.pieceId ===
                          pieceInCell.id)
                        ? styles.PieceNameContainerSelected
                        : null,
                      (this.props.currentSelectedPieceInTable !== null &&
                        this.props.currentSelectedPieceInTable.pieceId !==
                          pieceInCell.id) ||
                      (this.props.currentSelectedPieceInPieces !== null &&
                        this.props.currentSelectedPieceInPieces.pieceId !==
                          pieceInCell.id)
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
                        inputRef={tag => (this.textareaForPieceName = tag)}
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
                </PieceItemContainer>
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
          ) : annotation_selected ? (
            <div
              className={styles.AnnotationSelectedLayer}
              onClick={e => this.putSelectedAnnotationHere(e)}
            />
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
