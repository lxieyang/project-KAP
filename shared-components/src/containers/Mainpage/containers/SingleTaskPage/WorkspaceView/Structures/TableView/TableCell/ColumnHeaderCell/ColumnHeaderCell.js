import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './ColumnHeaderCell.css';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';

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

class ColumnHeaderCell extends Component {
  state = {};

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

    return (
      <th className={styles.ColumnHeaderCellContainer}>
        {deleteColumnActionContainer}
        <div>{cell.id}</div>
      </th>
    );
  }
}

export default withStyles(materialStyles)(ColumnHeaderCell);
