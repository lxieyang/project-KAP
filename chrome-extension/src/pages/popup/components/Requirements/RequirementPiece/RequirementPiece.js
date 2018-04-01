import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import ordinal from 'ordinal';
import styles from './RequirementPiece.css';


const pieceSource = {
  beginDrag(props) {
    return {
      id: props.rq.id,
      index: props.index,
    };
  },
};

const pieceTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.movePiece(dragIndex, hoverIndex);

    monitor.getItem().index = hoverIndex;
  },
};


@DropTarget('REQUIREMENT_PIECE', pieceTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('REQUIREMENT_PIECE', pieceSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class RequirementPiece extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    movePiece: PropTypes.func.isRequired,
  };

  render () {
    const { rq, index, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;

    return connectDragSource(connectDropTarget(
      <li style={{ opacity }}>
        <span className={styles.Ordinal}>{ordinal(index + 1)}</span>
        <span className={styles.Requirement}>{rq.name}</span>
        <span  
          onClick={(event) => this.props.deleteRequirementWithId(rq.id)}>
          <FontAwesomeIcon 
            icon={fasTrash}
            className={styles.TrashIcon}/>
        </span>
      </li>
    ));
  }
}

export default RequirementPiece;