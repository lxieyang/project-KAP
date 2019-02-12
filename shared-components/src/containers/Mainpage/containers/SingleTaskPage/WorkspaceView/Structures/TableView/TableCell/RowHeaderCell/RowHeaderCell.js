import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RowHeaderCell.css';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

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

const dropTarget = {
  canDrop(props, monitor, component) {
    return true;
  },

  drop(props, monitor, component) {
    console.log(`Dropped on cell ${props.cell.id}`);
    const item = monitor.getItem();
    console.log(item);

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
  state = {};

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  componentDidMount() {
    // this.unsubscribeCell = FirestoreManager.get
  }

  componentWillUnmount() {}

  deleteTableRowByIndex = event => {
    FirestoreManager.deleteRowInTableByIndex(
      this.props.workspace.id,
      this.props.rowIndex
    );
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { classes, cell, editAccess } = this.props;

    let deleteRowActionContainer = editAccess ? (
      <div className={styles.DeleteColumnIconContainer}>
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
    ) : null;

    return connectDropTarget(
      <td
        className={styles.RowHeaderCellContainer}
        style={{ backgroundColor: isOver ? '#f8c471' : null }}
      >
        {deleteRowActionContainer}
        <div>{cell.id}</div>
      </td>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(
  withStyles(materialStyles)(RowHeaderCell)
);
