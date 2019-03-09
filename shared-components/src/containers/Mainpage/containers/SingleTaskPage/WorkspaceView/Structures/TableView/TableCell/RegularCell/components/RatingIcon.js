import React, { Component, Children } from 'react';
import { DragSource, ConnectDragPreview, ConnectDragSource } from 'react-dnd';
import PropTypes from 'prop-types';
import { RATING_TYPES } from '../../../../../../../../../../shared/types';

const dragSource = {
  beginDrag(props) {
    props.switchDraggingRatingIconStatus(true, props.ratingType);
    return {
      id: props.pieceId,
      cellId: props.cellId,
      cellType: props.cellType,
      workspaceId: props.workspaceId
    };
  },
  canDrag(props, monitor) {
    return props.editAccess ? true : false;
  },

  endDrag(props, monitor, component) {
    props.switchDraggingRatingIconStatus(false, RATING_TYPES.noRating);
  }
};

const collectDrag = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
};

class RatingIcon extends Component {
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
            cursor: isDragging ? 'move' : null,
            opacity: isDragging ? 0.5 : null,
            transition: '0.1s all ease-in'
          }}
        >
          {this.props.children}
        </div>
      )
    );
  }
}

export default DragSource('RATING_ICON', dragSource, collectDrag)(RatingIcon);
