import React, { Component } from 'react';

import RegularCell from './RegularCell/RegularCell';
import TopLeftCell from './TopLeftCell/TopLeftCell';
import RowHeaderCell from './RowHeaderCell/RowHeaderCell';
import ColumnHeaderCell from './ColumnHeaderCell/ColumnHeaderCell';
import { TABLE_CELL_TYPES } from '../../../../../../../../shared/types';
import { shouldAnonymize } from '../../../../../../../../shared/utilities';
import * as FirestoreManager from '../../../../../../../../firebase/firestore_wrapper';

class TableCell extends Component {
  state = {
    // comments
    comments: [],

    // comment count
    commentCount: 0
  };

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
            let comment = {
              id: snapshot.id,
              ...snapshot.data(),
              anonymize: false
            };

            if (
              shouldAnonymize(
                comment.authorEmail,
                comment.authorId,
                FirestoreManager.getCurrentUserId()
              )
            ) {
              comment.anonymize = true;
            }

            comments.push(comment);
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
          let comment = {
            id: snapshot.id,
            ...snapshot.data(),
            anonymize: false
          };

          if (
            shouldAnonymize(
              comment.authorEmail,
              comment.authorId,
              FirestoreManager.getCurrentUserId()
            )
          ) {
            comment.anonymize = true;
          }

          comments.push(comment);
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
          />
        );
        break;
      case TABLE_CELL_TYPES.rowHeader:
        cell = (
          <RowHeaderCell
            {...this.props}
            comments={comments}
            commentCount={commentCount}
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
          />
        );
        break;
    }
    return cell;
  }
}

export default TableCell;
