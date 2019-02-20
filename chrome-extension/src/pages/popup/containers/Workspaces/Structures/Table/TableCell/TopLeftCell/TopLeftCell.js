import React, { Component } from 'react';
import styles from './TopLeftCell.css';
import { PIECE_COLOR } from '../../../../../../../../../../shared-components/src/shared/theme';

import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

const materialStyles = theme => ({
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

class TopLeftCell extends Component {
  state = {};

  createNewTableRowAtTheBeginning = e => {
    FirestoreManager.createNewRowInTable(this.props.workspace.id, true);
  };
  createNewTableColumnAtTheBeginning = e => {
    FirestoreManager.createNewColumnInTable(this.props.workspace.id, true);
  };

  render() {
    const { classes, numRows, numColumns, editAccess } = this.props;

    let addRowButton = editAccess ? (
      <div className={styles.AddRowButtonContainer}>
        <ActionButton
          style={{ color: PIECE_COLOR.option }}
          className={classes.button}
          onClick={e => this.createNewTableRowAtTheBeginning(e)}
        >
          Add a row
        </ActionButton>
      </div>
    ) : null;

    let addColumnButton = editAccess ? (
      <div className={styles.AddColumnButtonContainer}>
        <ActionButton
          style={{ color: PIECE_COLOR.criterion }}
          className={classes.button}
          onClick={e => this.createNewTableColumnAtTheBeginning(e)}
        >
          Add a column
        </ActionButton>
      </div>
    ) : null;

    return (
      <th className={styles.TopLeftCellContainer}>
        {numColumns > 3 ? addColumnButton : null}
        {numRows > 3 ? addRowButton : null}
      </th>
    );
  }
}

export default withStyles(materialStyles)(TopLeftCell);
