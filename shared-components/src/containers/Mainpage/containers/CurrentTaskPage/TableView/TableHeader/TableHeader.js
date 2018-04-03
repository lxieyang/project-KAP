import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasMinusCircle from '@fortawesome/fontawesome-free-solid/faMinusCircle';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import ordinal from 'ordinal';
import { debounce } from 'lodash';
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

  componentDidMount () {
    this.requirementCallback = debounce((event, id) => {
      this.props.updateRequirementName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
    }, 500);
  }

  requirementNameChangedHandler = (event, id) => {
    event.persist();
    this.requirementCallback(event, id);
  }

  render () {
    const { rq, index, inactiveOpacity, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    return connectDragSource(connectDropTarget(
      <th style={{opacity: rq.hide === true ? `${inactiveOpacity}` : '1'}}>
        <div 
          style={{ opacity }}
          className={styles.RequirementInTableHeaderContainer}>
          
          <div
            className={styles.ShowHideRequirement}
            onClick={(event) => this.props.switchHideStatusOfARequirement(index, rq.id, rq.hide)}>
            {
              rq.hide !== true
              ? <FontAwesomeIcon icon={fasMinusCircle} className={styles.ShowHideRequirementIcon}/>
              : <FontAwesomeIcon icon={fasCheckCircle} className={styles.ShowHideRequirementIcon}/>
            }
          </div>
          
          <div style={{height: '100%'}}>
            <div 
              className={[styles.RequirementStar, (
                rq.starred === true ? styles.ActiveStar : null
              )].join(' ')}
              onClick={(event) => this.props.switchStarStatusOfRequirement(rq.id)}>
              <FontAwesomeIcon icon={fasStar} />
            </div>
            <span className={styles.Ordinal}>{ordinal(index + 1)}</span>
          </div>
          <div
            className={[styles.RequirementNameContainer,
            rq.active ? null : styles.InactiveRequirement].join(' ')}>
              <span
                className={styles.RequirementText}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(event) => this.requirementNameChangedHandler(event, rq.id)}>
                {rq.name}
              </span>
          </div>
        </div>
        
      </th>
      
    ));
  }
}

export default TableHeader;