import React, { Component } from 'react';
import { DragSource, ConnectDragPreview, ConnectDragSource } from 'react-dnd';
import PropTypes from 'prop-types';

const dragSource = {
  beginDrag(props) {
    return {
      id: props.piece.id,
      cellId: props.cellId,
      cellType: props.cellType,
      rowIndex: props.rowIndex,
      columnIndex: props.columnIndex
    };
  },
  canDrag(props, monitor) {
    return true;
  },

  endDrag(props, monitor, component) {}
};

const collectDrag = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
};

class PieceItemContainer extends Component {
  static propTypes = {
    // Injected by React DnD:
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
  };

  render() {
    const { connectDragSource, connectDragPreview, isDragging } = this.props; // dnd

    return connectDragPreview(
      connectDragSource(
        <div
          style={{
            cursor: isDragging ? 'move' : null
          }}
        >
          {this.props.children}
        </div>
      )
    );
  }
}

export default DragSource('PIECE_ITEM', dragSource, collectDrag)(
  PieceItemContainer
);
