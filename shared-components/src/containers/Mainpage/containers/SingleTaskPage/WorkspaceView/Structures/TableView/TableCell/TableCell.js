import React, { Component } from 'react';
import styled from 'styled-components';

import RegularCell from './RegularCell/RegularCell';
import TopLeftCell from './TopLeftCell/TopLeftCell';
import RowHeaderCell from './RowHeaderCell/RowHeaderCell';
import ColumnHeaderCell from './ColumnHeaderCell/ColumnHeaderCell';
import { TABLE_CELL_TYPES } from '../../../../../../../../shared/types';

class TableCell extends Component {
  state = {};

  render() {
    let { type } = this.props.cell;
    let cell = null;

    switch (type) {
      case TABLE_CELL_TYPES.topLeft:
        cell = <TopLeftCell {...this.props} />;
        break;
      case TABLE_CELL_TYPES.columnHeader:
        cell = <ColumnHeaderCell {...this.props} />;
        break;
      case TABLE_CELL_TYPES.rowHeader:
        cell = <RowHeaderCell {...this.props} />;
        break;
      case TABLE_CELL_TYPES.regularCell:
      default:
        cell = <RegularCell {...this.props} />;
        break;
    }
    return cell;
  }
}

export default TableCell;
