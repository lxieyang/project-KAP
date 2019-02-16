import React, { Component } from 'react';
import styled from 'styled-components';

import RegularCell from './RegularCell/RegularCell';
import TopLeftCell from './TopLeftCell/TopLeftCell';
import RowHeaderCell from './RowHeaderCell/RowHeaderCell';
import ColumnHeaderCell from './ColumnHeaderCell/ColumnHeaderCell';
import { TABLE_CELL_TYPES } from '../../../../../../../../shared/types';
import * as FirestoreManager from '../../../../../../../../firebase/firestore_wrapper';

class TableCell extends Component {
  state = {
    // comment count
    commentCount: 0
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.id !== this.props.cell.id) {
      this.unsubscribeAllComments();
      this.unsubscribeAllComments = FirestoreManager.getAllCommentsToTableCell(
        this.props.workspace.id,
        this.props.cell.id
      ).onSnapshot(querySnapshot => {
        this.setState({ commentCount: querySnapshot.docs.length });
      });
    }
  }

  componentDidMount() {
    this.unsubscribeAllComments = FirestoreManager.getAllCommentsToTableCell(
      this.props.workspace.id,
      this.props.cell.id
    ).onSnapshot(querySnapshot => {
      this.setState({ commentCount: querySnapshot.docs.length });
    });
  }

  componentWillUnmount() {
    this.unsubscribeAllComments();
  }

  render() {
    const { commentCount } = this.state;
    let { type } = this.props.cell;
    let cell = null;

    switch (type) {
      case TABLE_CELL_TYPES.topLeft:
        cell = <TopLeftCell {...this.props} />;
        break;
      case TABLE_CELL_TYPES.columnHeader:
        cell = <ColumnHeaderCell {...this.props} commentCount={commentCount} />;
        break;
      case TABLE_CELL_TYPES.rowHeader:
        cell = <RowHeaderCell {...this.props} commentCount={commentCount} />;
        break;
      case TABLE_CELL_TYPES.regularCell:
      default:
        cell = <RegularCell {...this.props} commentCount={commentCount} />;
        break;
    }
    return cell;
  }
}

export default TableCell;
