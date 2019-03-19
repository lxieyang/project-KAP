import React, { Component } from 'react';
import styles from './TopLeftCell.css';
import { PIECE_COLOR } from '../../../../../../../../../../shared-components/src/shared/theme';

import Button from '@material-ui/core/Button';
import PlusCircle from 'mdi-material-ui/PlusCircle';
import { withStyles } from '@material-ui/core/styles';
import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

import Delete from 'mdi-material-ui/Delete';
import DeleteEmpty from 'mdi-material-ui/DeleteEmpty';

import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

const materialStyles = theme => ({
  button: {
    marginTop: 0,
    marginBottom: 0,
    marginRight: 0,
    padding: '1px 4px 1px 4px',
    fontSize: 12
  }
});

const ActionButton = withStyles({
  root: {
    minWidth: '0',
    padding: '1px 1px'
  },
  label: {
    textTransform: 'capitalize',
    fontSize: '10px'
  }
})(Button);

const dropTarget = {
  canDrop(props, monitor, component) {
    return props.isDraggingOptionCriterionPiece ? true : false;
  },

  drop(props, monitor, component) {
    const { id, cellId } = monitor.getItem();

    component.removePieceFromCell(id, cellId);

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

class TopLeftCell extends Component {
  state = {};

  createNewTableRowAtTheBeginning = e => {
    FirestoreManager.createNewRowInTable(this.props.workspace.id, true);
  };
  createNewTableColumnAtTheBeginning = e => {
    FirestoreManager.createNewColumnInTable(this.props.workspace.id, true);
  };

  removePieceFromCell = (pieceId, cellId) => {
    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      cellId,
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

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    const {
      classes,
      numRows,
      numColumns,
      isDraggingOptionCriterionPiece
    } = this.props;

    let addRowButton = !isDraggingOptionCriterionPiece && (
      <div
        className={[
          styles.AddRowButtonContainer,
          this.props.currentSelectedPieceInTable !== null
            ? styles.DoNotDisplay
            : null
        ].join(' ')}
      >
        <ActionButton
          title={`Add a row`}
          style={{ color: PIECE_COLOR.option }}
          className={classes.button}
          onClick={e => this.createNewTableRowAtTheBeginning(e)}
        >
          <PlusCircle style={{ width: 20, height: 20 }} />
        </ActionButton>
      </div>
    );

    let addColumnButton = !isDraggingOptionCriterionPiece && (
      <div
        className={[
          styles.AddColumnButtonContainer,
          this.props.currentSelectedPieceInTable !== null
            ? styles.DoNotDisplay
            : null
        ].join(' ')}
        style={{ zIndex: 99 }}
      >
        <ActionButton
          title={`Add a column`}
          style={{ color: PIECE_COLOR.criterion, zIndex: 9999 }}
          className={classes.button}
          onClick={e => this.createNewTableColumnAtTheBeginning(e)}
        >
          <PlusCircle style={{ width: 20, height: 20 }} />
        </ActionButton>
      </div>
    );

    let removeFromTableContainer = isDraggingOptionCriterionPiece && (
      <div
        style={{
          zIndex: 2000,
          position: 'absolute',
          top: 0,
          bottom: 1,
          left: 0,
          right: 1,
          padding: '1px 3px',
          fontSize: 11,
          fontWeight: 400,
          borderRadius: '4px',
          backgroundColor: 'lightgray',
          transition: 'all 0.05s ease-in',
          opacity: isOver && canDrop ? 1 : 0.3,
          transform: isOver && canDrop ? 'scale(1.1)' : null
        }}
      >
        <div>
          Drop here to <strong>remove</strong>
        </div>
        <div>
          {isOver ? (
            <DeleteEmpty style={{ fontSize: 18 }} />
          ) : (
            <Delete style={{ fontSize: 18 }} />
          )}
        </div>
      </div>
    );

    return connectDropTarget(
      <th className={styles.TopLeftCellContainer}>
        {removeFromTableContainer}
        {addColumnButton}
        {addRowButton}
      </th>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(TopLeftCell)
);
