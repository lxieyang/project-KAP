import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import { debounce } from 'lodash';
import ordinal from 'ordinal';
import styles from './OptionPiece.css';


const pieceSource = {
  beginDrag(props) {
    return {
      id: props.op.id,
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

@DropTarget('OPTION_PIECE', pieceTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('OPTION_PIECE', pieceSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class OptionPiece extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    movePiece: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      this.props.updateOptionName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
    }, 500);
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.inputCallback(event, id);
  }

  render () {

    const { op, activeId, index, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    const cursor = isDragging ? 'move' : null;

    return connectDragSource(connectDropTarget(
      <li style={{ opacity, cursor }}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className={styles.Ordinal}>{ordinal(index + 1)}</span>
          <span 
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={(event) => this.inputChangedHandler(event, op.id)}
            className={[styles.Option, (
              activeId === op.id ? styles.ActiveOption : null
            )].join(' ')}>
            {op.name}
          </span>
        </div>
        <span  
          onClick={(event) => this.props.deleteOptionWithId(op.id)}>
          <FontAwesomeIcon 
            icon={fasTrash}
            className={styles.TrashIcon}/>
        </span>
      </li>
    ));
  }
}

export default OptionPiece;