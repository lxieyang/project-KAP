import React, { Component } from 'react';

import RegularCell from './RegularCell/RegularCell';
import TopLeftCell from './TopLeftCell/TopLeftCell';
import RowHeaderCell from './RowHeaderCell/RowHeaderCell';
import ColumnHeaderCell from './ColumnHeaderCell/ColumnHeaderCell';
import { TABLE_CELL_TYPES } from '../../../../../../../../shared/types';
import * as FirestoreManager from '../../../../../../../../firebase/firestore_wrapper';

import TaskContext from '../../../../../../../../shared/task-context';

class TableCell extends Component {
  state = {
    // comments
    comments: [],

    // comment count
    commentCount: 0
  };

  static contextType = TaskContext;

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.id !== this.props.cell.id) {
      this.unsubscribeAllComments();
      this.unsubscribeAllComments = FirestoreManager.getAllCommentsToTableCell(
        this.props.workspace.id,
        this.props.cell.id
      )
        .orderBy('creationDate', 'asc')
        .onSnapshot(querySnapshot => {
          let comments = [];
          querySnapshot.forEach(snapshot => {
            comments.push({
              id: snapshot.id,
              ...snapshot.data()
            });
          });
          this.setState({ comments, commentCount: comments.length });
        });
    }
  }

  componentDidMount() {
    this.unsubscribeAllComments = FirestoreManager.getAllCommentsToTableCell(
      this.props.workspace.id,
      this.props.cell.id
    )
      .orderBy('creationDate', 'asc')
      .onSnapshot(querySnapshot => {
        let comments = [];
        querySnapshot.forEach(snapshot => {
          comments.push({
            id: snapshot.id,
            ...snapshot.data()
          });
        });
        this.setState({ comments, commentCount: comments.length });
      });
  }

  componentWillUnmount() {
    this.unsubscribeAllComments();
  }

  render() {
    const { comments, commentCount } = this.state;
    let { type } = this.props.cell;
    let cell = null;

    switch (type) {
      case TABLE_CELL_TYPES.topLeft:
        cell = <TopLeftCell {...this.props} />;
        break;
      case TABLE_CELL_TYPES.columnHeader:
        cell = (
          <ColumnHeaderCell
            {...this.props}
            comments={comments}
            commentCount={commentCount}
            isDemoTask={this.context.isDemoTask}
            selectedUrls={this.context.selectedUrls}
            selectedDomains={this.context.selectedDomains}
            selectedSnippets={this.context.selectedSnippets}
            selectedCells={this.context.selectedCells}
            cellColors={this.context.cellColors}
            honestSignals={this.context.honestSignalsInTable}
            isInDefaultView={this.context.currentTaskView === 'default'}
            isInContextView={this.context.currentTaskView === 'context'}
            isInTrustworthinessView={
              this.context.currentTaskView === 'trustworthiness'
            }
            isInThoroughnessView={
              this.context.currentTaskView === 'thoroughness'
            }
          />
        );
        break;
      case TABLE_CELL_TYPES.rowHeader:
        cell = (
          <RowHeaderCell
            {...this.props}
            comments={comments}
            commentCount={commentCount}
            isDemoTask={this.context.isDemoTask}
            selectedUrls={this.context.selectedUrls}
            selectedDomains={this.context.selectedDomains}
            selectedSnippets={this.context.selectedSnippets}
            selectedCells={this.context.selectedCells}
            cellColors={this.context.cellColors}
            honestSignals={this.context.honestSignalsInTable}
            isInDefaultView={this.context.currentTaskView === 'default'}
            isInContextView={this.context.currentTaskView === 'context'}
            isInTrustworthinessView={
              this.context.currentTaskView === 'trustworthiness'
            }
            isInThoroughnessView={
              this.context.currentTaskView === 'thoroughness'
            }
          />
        );
        break;
      case TABLE_CELL_TYPES.regularCell:
      default:
        cell = (
          <RegularCell
            {...this.props}
            comments={comments}
            commentCount={commentCount}
            isDemoTask={this.context.isDemoTask}
            selectedUrls={this.context.selectedUrls}
            selectedDomains={this.context.selectedDomains}
            selectedSnippets={this.context.selectedSnippets}
            selectedCells={this.context.selectedCells}
            cellColors={this.context.cellColors}
            honestSignals={this.context.honestSignalsInTable}
            isInDefaultView={this.context.currentTaskView === 'default'}
            isInContextView={this.context.currentTaskView === 'context'}
            isInTrustworthinessView={
              this.context.currentTaskView === 'trustworthiness'
            }
            isInThoroughnessView={
              this.context.currentTaskView === 'thoroughness'
            }
          />
        );
        break;
    }
    return cell;
  }
}

export default TableCell;
