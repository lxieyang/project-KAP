import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import * as FirestoreManager from '../../../../../../../firebase/firestore_wrapper';
import Spinner from '../../../../../../../components/UI/Spinner/Spinner';
import styles from './TableView.css';

import Textarea from 'react-textarea-autosize';

class TableView extends Component {
  state = {
    workspace: this.props.workspace,

    workspaceNameEdit: this.props.workspace.name,

    // cells
    cells: null
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
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

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.textarea.blur();
    }
  }

  componentWillUnmount() {
    this.unsubscribeWorkspace();
  }

  handleWorkspaceNameChange = e => {
    this.setState({ workspaceNameEdit: e.target.value });
  };

  updateWorkspaceName = () => {
    let workspaceName = this.state.workspaceNameEdit;
    if (
      workspaceName !== null &&
      workspaceName !== '' &&
      workspaceName !== this.props.workspace.name
    ) {
      FirestoreManager.updateWorkspaceName(
        this.props.workspace.id,
        workspaceName
      );
    }
    this.textarea.scrollTo(0, 0);
  };

  createNewTableColumn = (event, atEnd = true) => {
    FirestoreManager.createNewColumnInTable(this.props.workspace.id);
  };

  createNewTableRow = (event, atEnd = true) => {
    FirestoreManager.createNewRowInTable(this.props.workspace.id);
  };

  render() {
    let { workspace, editAccess, workspaceTypeString } = this.props;
    const { cells, workspaceNameEdit } = this.state;
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
          return <th key={idx}>{cellId}</th>;
        })}
        <th>
          <div
            className={styles.CreateNewButton}
            onClick={e => this.createNewTableColumn(e)}
          >
            create new criterion
          </div>
        </th>
      </tr>
    );

    let tableBody = (
      <React.Fragment>
        {tableRows.map((row, idx) => {
          if (idx === 0) {
            return null;
          } else {
            return (
              <tr key={idx}>
                {row.data.map((cellId, indexInRow) => {
                  return <td key={`${idx}-${indexInRow}`}>{cellId}</td>;
                })}
              </tr>
            );
          }
        })}
        <tr>
          <td>
            <div
              className={styles.CreateNewButton}
              onClick={e => this.createNewTableRow(e)}
            >
              create new option
            </div>
          </td>
        </tr>
      </React.Fragment>
    );

    return (
      <React.Fragment>
        <div className={styles.TableViewContainer}>
          {/* Table Name */}
          <div
            className={styles.TableNameContainer}
            title={editAccess ? `Edit ${workspaceTypeString} name` : null}
          >
            {editAccess ? (
              <Textarea
                inputRef={tag => (this.textarea = tag)}
                minRows={1}
                maxRows={2}
                disabled={!editAccess}
                placeholder={'Add a name'}
                value={workspaceNameEdit}
                onBlur={() => this.updateWorkspaceName()}
                onKeyDown={this.keyPress}
                onChange={e => this.handleWorkspaceNameChange(e)}
                className={styles.Textarea}
              />
            ) : (
              <span>{workspace.name}</span>
            )}
          </div>

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

export default withRouter(TableView);
