import React, { Component } from 'react';
import styled from 'styled-components';
import * as FirestoreManager from '../../../../../../../../shared-components/src/firebase/firestore_wrapper';
import {
  PIECE_COLOR,
  THEME_COLOR
} from '../../../../../../../../shared-components/src/shared/theme';
import Spinner from '../../../../../../../../shared-components/src/components/UI/Spinner/Spinner';
import styles from './Table.css';

import Button from '@material-ui/core/Button';
import PlusCircle from 'mdi-material-ui/PlusCircle';

import { withStyles } from '@material-ui/core/styles';

import TableCell from './TableCell/TableCell';

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

class Table extends Component {
  state = {
    workspace: this.props.workspace,

    // cells
    cells: null,

    // row / col delete
    rowToDelete: -1,
    columnToDelete: -1,

    // row / col switch
    rowToSwitchA: -1,
    rowToSwitchB: -1,
    columnToSwitchA: -1,
    columnToSwitchB: -1
  };

  setRowToDelete = to => {
    this.setState({ rowToDelete: to });
  };

  setColumnToDelete = to => {
    this.setState({ columnToDelete: to });
  };

  setRowToSwitch = (rowToSwitchA, rowToSwitchB) => {
    this.setState({ rowToSwitchA, rowToSwitchB });
  };

  setColumnToSwitch = (columnToSwitchA, columnToSwitchB) => {
    this.setState({ columnToSwitchA, columnToSwitchB });
    // console.log(columnToSwitchA, columnToSwitchB);
  };

  componentDidMount() {
    this.unsubscribeWorkspace = FirestoreManager.getAllTableCellsInTableById(
      this.props.workspace.id
    ).onSnapshot(querySnapshot => {
      let cells = {};
      querySnapshot.forEach(snapshot => {
        cells[snapshot.id] = {
          id: snapshot.id,
          ...snapshot.data()
        };
      });
      this.setState({ cells });
    });
  }

  componentWillUnmount() {
    this.unsubscribeWorkspace();
  }

  createNewTableColumn = (event, atEnd = true) => {
    FirestoreManager.createNewColumnInTable(this.props.workspace.id);
  };

  createNewTableRow = (event, atEnd = true) => {
    FirestoreManager.createNewRowInTable(this.props.workspace.id);
  };

  deleteTableRowByIndex = (event, toDeleteRowIdx) => {
    FirestoreManager.deleteRowInTableByIndex(
      this.props.workspace.id,
      toDeleteRowIdx
    );
  };

  deleteTableColumnByIndex = (event, toDeleteColumnIdx) => {
    FirestoreManager.deleteColumnInTableByIndex(
      this.props.workspace.id,
      toDeleteColumnIdx
    );
  };

  tableClicked = e => {
    e.stopPropagation();
    if (this.props.currentSelectedPieceInTable !== null) {
      this.props.setCurrentSelectedPieceInTable({
        pieceId: null,
        pieceType: null
      });
    }
  };

  render() {
    let { workspace, workspaceTypeString, classes } = this.props;
    const { cells } = this.state;
    let tableRows = workspace.data;

    // console.log(cells);
    // console.log(tableRows);

    if (cells === null) {
      return (
        <div
          style={{
            width: '100%',
            height: '400px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Spinner size={'30px'} />
        </div>
      );
    }

    let tableHeaders = (
      <tr>
        {tableRows[0].data.map((cellId, idx) => {
          let cell = cells[cellId];
          return (
            <TableCell
              key={idx}
              taskId={this.props.taskId}
              workspace={workspace}
              numRows={tableRows.length}
              numColumns={tableRows[0].data.length}
              pieces={this.props.pieces}
              cell={cell}
              rowIndex={0}
              columnIndex={idx}
              rowToDelete={this.state.rowToDelete}
              columnToDelete={this.state.columnToDelete}
              setRowToDelete={this.setRowToDelete}
              setColumnToDelete={this.setColumnToDelete}
              rowToSwitchA={this.state.rowToSwitchA}
              rowToSwitchB={this.state.rowToSwitchB}
              setRowToSwitch={this.setRowToSwitch}
              columnToSwitchA={this.state.columnToSwitchA}
              columnToSwitchB={this.state.columnToSwitchB}
              setColumnToSwitch={this.setColumnToSwitch}
              currentSelectedPieceInTable={
                this.props.currentSelectedPieceInTable
              }
              setCurrentSelectedPieceInTable={
                this.props.setCurrentSelectedPieceInTable
              }
              currentSelectedPieceInPieces={
                this.props.currentSelectedPieceInPieces
              }
              setCurrentSelectedPieceInPieces={
                this.props.setCurrentSelectedPieceInPieces
              }
              annotation_selected={this.props.annotation_selected}
              selected_annotation_id={this.props.selected_annotation_id}
              openScreenshot={this.props.openScreenshot}
            />
          );
        })}
        {/*
        <th
          style={{
            border: 'none',
            position: 'relative'
          }}
        >
          <div className={styles.AddColumnButtonContainer}>
            <ActionButton
              title={`Add a column`}
              style={{ color: PIECE_COLOR.criterion }}
              className={classes.button}
              onClick={e => this.createNewTableColumn(e)}
            >
              <PlusCircle style={{ width: 11, height: 11 }} />
            </ActionButton>
          </div>
        </th>*/}
      </tr>
    );

    let tableBody = (
      <React.Fragment>
        {tableRows.map((row, idx) => {
          if (idx === 0) {
            return null;
          } else {
            return (
              <tr
                key={idx}
                style={{
                  transition: 'all 0.15s ease-in',
                  // border:
                  //   this.state.rowToDelete === idx
                  //     ? `1px solid ${THEME_COLOR.alertBackgroundColor}`
                  //     : null
                  backgroundColor:
                    this.state.rowToDelete === idx
                      ? THEME_COLOR.alertBackgroundColor
                      : 'transparent'
                }}
              >
                {row.data.map((cellId, indexInRow) => {
                  let cell = cells[cellId];
                  return (
                    <TableCell
                      key={`${idx}-${indexInRow}`}
                      taskId={this.props.taskId}
                      numRows={tableRows.length}
                      numColumns={tableRows[0].data.length}
                      pieces={this.props.pieces}
                      workspace={workspace}
                      cell={cell}
                      rowIndex={idx}
                      columnIndex={indexInRow}
                      rowToDelete={this.state.rowToDelete}
                      columnToDelete={this.state.columnToDelete}
                      setRowToDelete={this.setRowToDelete}
                      setColumnToDelete={this.setColumnToDelete}
                      rowToSwitchA={this.state.rowToSwitchA}
                      rowToSwitchB={this.state.rowToSwitchB}
                      setRowToSwitch={this.setRowToSwitch}
                      columnToSwitchA={this.state.columnToSwitchA}
                      columnToSwitchB={this.state.columnToSwitchB}
                      setColumnToSwitch={this.setColumnToSwitch}
                      currentSelectedPieceInTable={
                        this.props.currentSelectedPieceInTable
                      }
                      setCurrentSelectedPieceInTable={
                        this.props.setCurrentSelectedPieceInTable
                      }
                      currentSelectedPieceInPieces={
                        this.props.currentSelectedPieceInPieces
                      }
                      setCurrentSelectedPieceInPieces={
                        this.props.setCurrentSelectedPieceInPieces
                      }
                      annotation_selected={this.props.annotation_selected}
                      selected_annotation_id={this.props.selected_annotation_id}
                      openScreenshot={this.props.openScreenshot}
                    />
                  );
                })}
              </tr>
            );
          }
        })}
        {/*
        <tr>
          <td
            style={{
              position: 'relative',
              border: 'none',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <div className={styles.AddRowButtonContainer}>
              <ActionButton
                title={`Add a row`}
                style={{ color: PIECE_COLOR.option }}
                className={classes.button}
                onClick={e => this.createNewTableRow(e)}
              >
                <PlusCircle style={{ width: 11, height: 11 }} />
              </ActionButton>
            </div>
          </td>
        </tr>*/}
      </React.Fragment>
    );

    return (
      <React.Fragment>
        <div
          className={styles.TableViewContainer}
          // onClick={e => this.tableClicked(e)}
        >
          {/* Table Content */}
          <div className={styles.TableContentContainer}>
            <table className={styles.ComparisonTable}>
              <thead>{tableHeaders}</thead>
              <tbody>{tableBody}</tbody>
            </table>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(materialStyles)(Table);
