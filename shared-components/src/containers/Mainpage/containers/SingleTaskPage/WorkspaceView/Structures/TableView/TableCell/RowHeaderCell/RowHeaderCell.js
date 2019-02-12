import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RowHeaderCell.css';

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

class RowHeaderCell extends Component {
  state = {};

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
    return (
      <td className={styles.RowHeaderCellContainer}>
        {deleteRowActionContainer}
        <div>{cell.id}</div>
      </td>
    );
  }
}

export default withStyles(materialStyles)(RowHeaderCell);
