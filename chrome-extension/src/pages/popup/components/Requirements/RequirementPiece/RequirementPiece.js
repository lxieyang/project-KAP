import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasDelete from '@fortawesome/fontawesome-free-solid/faTrashAlt';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasMore from '@fortawesome/fontawesome-free-solid/faEllipsisV';
import Popover from 'react-tiny-popover';
import ordinal from 'ordinal';
import ThreeDotsSpinner from '../../../../../../../shared-components/src/components/UI/ThreeDotsSpinner/ThreeDotsSpinner';
import { debounce } from 'lodash';
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

  state = {
    isPopoverOpen: false,
    shouldShowPrompt: false
  }

  switchPopoverOpenStatus = () => {
    this.setState(prevState => {
      return {isPopoverOpen: !prevState.isPopoverOpen}
    });
  }

  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      this.props.updateRequirementName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
      this.setState({shouldShowPrompt: false});
    }, 1000);
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.setState({shouldShowPrompt: true});
    this.inputCallback(event, id);
  }

  switchStarStatus = (id) => {
    this.props.switchStarStatusOfRequirement(id);
    this.switchPopoverOpenStatus();
  }

  render () {
    const { rq, index, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    const cursor = isDragging ? 'move' : null;

    return connectDragSource(connectDropTarget(
      <li style={{ opacity, cursor }}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className={styles.Ordinal}>{(index + 1)}</span>

          <div 
            className={styles.Requirement}
            style={{boxShadow: this.state.isPopoverOpen || this.state.shouldShowPrompt ? '4px 4px 6px rgba(0,0,0,0.2)' : null}}>
            <div
              className={[styles.RequirementStar, (
                rq.starred === true ? styles.ActiveStar : null
              )].join(' ')}>
              <FontAwesomeIcon icon={fasStar} />
            </div>
            <div className={styles.RequirementContentRow}>
              <span
                title={'Click to edit'}
                className={styles.RequirementText}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(event) => this.inputChangedHandler(event, rq.id)}>
                {rq.name}
              </span>
              <Popover
                isOpen={this.state.isPopoverOpen}
                position={'bottom'} // preferred position
                onClickOutside={() => this.switchPopoverOpenStatus()}
                containerClassName={styles.PopoverContainer}
                content={(
                  <div className={styles.PopoverContentContainer}>
                    <ul>
                      <li onClick={(event) => this.switchStarStatus(rq.id)}>
                        <div className={styles.IconBoxInPopover}>
                          <FontAwesomeIcon icon={fasStar} className={styles.IconInPopover}/>
                        </div>
                        <div>{rq.starred === true ? 'Remove' : 'Add'} Star</div>
                      </li>

                      <li 
                        onClick={(event) => this.props.deleteRequirementWithId(rq.id, rq.name)}
                        className={styles.DeleteLi}>
                        <div className={styles.IconBoxInPopover}>
                          <FontAwesomeIcon icon={fasDelete} className={styles.IconInPopover}/>
                        </div>
                        <div>Delete</div>
                      </li>
                    </ul>
                  </div>
                )}
              >
                <span 
                  className={styles.MoreIconContainer}
                  style={{opacity: this.state.isPopoverOpen ? '0.7' : null}}
                  onClick={() => this.switchPopoverOpenStatus()}>
                  <FontAwesomeIcon icon={fasMore}/>
                </span>
                
              </Popover>
            </div>
          </div>
        </div>
        <div className={styles.PromptAutoSaved}>
          {this.state.shouldShowPrompt === true 
            ? <span>
                Edits will automatically be saved <ThreeDotsSpinner />
              </span>
            : null}
        </div>

      </li>
    ));
  }
}

export default RequirementPiece;
