import React, { Component } from 'react';
import { debounce, sortBy, reverse } from 'lodash';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasToggleOn from '@fortawesome/fontawesome-free-solid/faToggleOn';
import fasToggleOff from '@fortawesome/fontawesome-free-solid/faToggleOff';
import ReactTooltip from 'react-tooltip';
import ordinal from 'ordinal';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import styles from './TableRow.css';


const rowSource = {
  beginDrag(props) {
    return {
      id: props.op.id,
      index: props.index
    };
  },
}

const rowTarget = {
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
    props.moveRow(dragIndex, hoverIndex);

    monitor.getItem().index = hoverIndex;
  },
}

@DropTarget('TABLE_ROW', rowTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('TABLE_ROW', rowSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class TableRow extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    moveRow: PropTypes.func.isRequired,
  }

  state = {
    pieces: this.props.pieces,
    options: this.props.options,
    requirements: this.props.requirements
  }

  componentDidMount () {
    this.optionCallback = debounce((event, id) => {
      this.props.updateOptionName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
    }, 1000);
  }

  optionNameChangedHandler = (event, id) => {
    event.persist();
    this.optionCallback(event, id);
  }

  render () {
    const { op, index, inactiveOpacity, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    return connectDragSource(connectDropTarget(
        <td style={{ opacity, position: 'relative'}}>
          <div 
            className={styles.ShowHideOption}
            onClick={(event) => this.props.switchHideStatusOfAnOption(index, op.id, op.hide)}>
            {
              op.hide !== true 
              ? <FontAwesomeIcon icon={fasToggleOff} className={styles.ShowHidePieceIcon}/>
              : <FontAwesomeIcon icon={fasToggleOn} className={styles.ShowHidePieceIcon}/>
            }
          </div>
          <div style={{
              display: 'flex', 
              alignItems: 'center', 
              padding: '5px',
              borderRadius: '3px',
              opacity: op.hide === true ? `${inactiveOpacity}` : '1',
              backgroundColor: op.used === true ? 'rgba(82, 184, 101, 0.3)' : 'transparent' }}>
            <div style={{height: '100%'}}>
              <div 
                className={[styles.OptionStar, (
                  op.starred === true ? styles.ActiveStar : null
                )].join(' ')}
                onClick={(event) => this.props.switchStarStatusOfOption(op.id)}>
                <FontAwesomeIcon icon={fasStar} />
              </div>
              <span className={styles.Ordinal}>{ordinal(index + 1)}</span>
              <div 
                className={[styles.OptionUseStatus, (
                  op.used === true ? styles.UsedOption : null
                )].join(' ')}
                onClick={(event) => this.props.switchUsedStatusOfOption(op.id, op.used)}>
                <FontAwesomeIcon icon={fasCheckCircle} />
              </div>
            </div>
            <div className={[styles.OptionNameContainer, !op.active ? styles.InactiveOption : null].join(' ')}>
              <span 
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(event) => this.optionNameChangedHandler(event, op.id)}
                className={styles.OptionText}>
                {op.name}
              </span>
            </div>
          </div>
          
        </td>
    ));
  }
}

export default TableRow;