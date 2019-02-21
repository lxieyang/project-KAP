import React, { Component } from 'react';
import styles from './TopLeftCell.css';
import { PIECE_COLOR } from '../../../../../../../../../../shared-components/src/shared/theme';

import Button from '@material-ui/core/Button';
import PlusCircle from 'mdi-material-ui/PlusCircle';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

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

class TopLeftCell extends Component {
  state = {};

  createNewTableRowAtTheBeginning = e => {
    FirestoreManager.createNewRowInTable(this.props.workspace.id, true);
  };
  createNewTableColumnAtTheBeginning = e => {
    FirestoreManager.createNewColumnInTable(this.props.workspace.id, true);
  };

  render() {
    const { classes, numRows, numColumns } = this.props;

    let addRowButton = (
      <div className={styles.AddRowButtonContainer}>
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

    let addColumnButton = (
      <div className={styles.AddColumnButtonContainer} style={{ zIndex: 99 }}>
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

    return (
      <th className={styles.TopLeftCellContainer}>
        {addColumnButton}
        {addRowButton}
      </th>
    );
  }
}

export default withStyles(materialStyles)(TopLeftCell);
