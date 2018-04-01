import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasMinusCircle from '@fortawesome/fontawesome-free-solid/faMinusCircle';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import styles from './TableHeader.css';


const headerSource = {
  beginDrag(props) {
    return {
      id: props.rq.id,
      index: props.index
    };
  },
}

const headerTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rect on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get horizontal middle
    const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixel to the left
    const hoverClientX = clientOffset.x - hoverBoundingRect.left;

    // Only perform the move when the mouse has corssed half of the items width
    // When dragging leftwards, only move when the cursor is above 50%
    // When dragging rightwards, only move when the cursor is below 50%
    
    // dragging rightwards
    if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
      return;
    }

    // dragging upwards
    if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
      return;
    }

    // perform action
    props.moveHeader(dragIndex, hoverIndex);

    monitor.getItem().index = hoverIndex;

  }
}

@DropTarget('TABLE_HEADER', headerTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('TABLE_HEADER', headerSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class TableHeader extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    moveHeader: PropTypes.func.isRequired,
  }

  render () {
    const { rq } = this.props;
    const { isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    return connectDragSource(connectDropTarget(
      <th>
        <div
          className={[styles.ShowHideRequirementContainer, styles.ShowHideRequirement].join(' ')}
          onClick={(event) => this.switchRequirementStatus(event, rq.id)}>
          {
            rq.active
            ? <FontAwesomeIcon icon={fasMinusCircle} className={styles.ShowHideRequirementIcon}/>
            : <FontAwesomeIcon icon={fasCheckCircle} className={styles.ShowHideRequirementIcon}/>
          }
        </div>
        <div
          style={{ opacity }}
          className={[styles.RequirementNameContainer,
          rq.active ? null : styles.InactiveRequirement].join(' ')}>
            {rq.name}
        </div>
      </th>
      
    ));
  }
}

export default TableHeader;