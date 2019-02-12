import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './ColumnHeaderCell.css';

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
    if (!props.editAccess) {
      return false;
    }
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

class ColumnHeaderCell extends Component {
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

  deleteTableColumnByIndex = event => {
    FirestoreManager.deleteColumnInTableByIndex(
      this.props.workspace.id,
      this.props.columnIndex
    );
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { classes, cell, editAccess } = this.props;

    let deleteColumnActionContainer = editAccess ? (
      <div className={styles.DeleteColumnIconContainer}>
        <Tooltip title="Delete this column" placement={'top'}>
          <IconButton
            aria-label="Delete"
            className={classes.iconButtons}
            onClick={() => this.deleteTableColumnByIndex()}
          >
            <DeleteIcon className={classes.iconInIconButtons} />
          </IconButton>
        </Tooltip>
      </div>
    ) : null;

    return connectDropTarget(
      <th
        className={styles.ColumnHeaderCellContainer}
        style={{ backgroundColor: isOver ? '#aed6f1' : null }}
      >
        {deleteColumnActionContainer}
        <div>{cell.id}</div>
      </th>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(
  withStyles(materialStyles)(ColumnHeaderCell)
);
