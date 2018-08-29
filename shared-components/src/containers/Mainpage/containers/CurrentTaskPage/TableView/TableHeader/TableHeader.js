import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasToggleOn from '@fortawesome/fontawesome-free-solid/faToggleOn';
import fasToggleOff from '@fortawesome/fontawesome-free-solid/faToggleOff';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasDelete from '@fortawesome/fontawesome-free-solid/faTrashAlt';
import fasMore from '@fortawesome/fontawesome-free-solid/faEllipsisV';
import Popover from 'react-tiny-popover';
import ThreeDotsSpinner from '../../../../../../components/UI/ThreeDotsSpinner/ThreeDotsSpinner';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import ordinal from 'ordinal';
import { debounce } from 'lodash';
import styles from './TableHeader.css';
import Styles from '../TableView.css';

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

  state = {
    isPopoverOpen: false,
    shouldShowPrompt: false
  }

  switchPopoverOpenStatus = () => {
    this.setState(prevState => {
      return {isPopoverOpen: !prevState.isPopoverOpen}
    });
  }

  componentDidMount () {
    this.requirementCallback = debounce((event, id) => {
      this.props.updateRequirementName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
      this.setState({shouldShowPrompt: false});
    }, 1500);
  }

  requirementNameChangedHandler = (event, id) => {
    event.persist();
    this.setState({shouldShowPrompt: true});
    this.requirementCallback(event, id);
  }

  switchStarStatus = (id) => {
    this.props.switchStarStatusOfRequirement(id);
    this.switchPopoverOpenStatus();
  }

  render () {
    const { rq, index, inactiveOpacity, isDragging, connectDragSource, connectDropTarget, isVisible } = this.props;
    const opacity = (isDragging) ? 0 : 1;
    return connectDragSource(connectDropTarget(
      <th style={{ opacity, visibility : isVisible ? 'visible' : 'hidden'}}>
        {/*  
        <div
          className={styles.ShowHideRequirement}
          onClick={(event) => this.props.switchHideStatusOfARequirement(index, rq.id, rq.hide)}>
          {
            rq.hide !== true
            ? <FontAwesomeIcon icon={fasToggleOff} className={styles.ShowHideRequirementIcon}/>
            : <FontAwesomeIcon icon={fasToggleOn} className={styles.ShowHideRequirementIcon}/>
          }
        </div>
        */}

        <div className={styles.RequirementContainer}>

          <div className={styles.OrdinalContainer}>
          <span className={styles.Ordinal}>{(index + 1)}</span>
          </div>

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
                className={styles.RequirementText}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(event) => this.requirementNameChangedHandler(event, rq.id)}>
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
                      {/* TODO: Add delete requirement functionality back in*/}
                      {/*
                      <li>
                        <div className={styles.IconBoxInPopover}>
                          <FontAwesomeIcon icon={fasDelete} className={styles.IconInPopover}/>
                        </div>
                        <div>Delete</div>
                      </li>
                      */}
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

        {/*
        <div
          style={{opacity: rq.hide === true ? `${inactiveOpacity}` : '1'}}
          className={styles.RequirementInTableHeaderContainer}>
          <div style={{height: '100%'}}>
            <div
              className={[styles.RequirementStar, (
                rq.starred === true ? styles.ActiveStar : null
              )].join(' ')}
              onClick={(event) => this.props.switchStarStatusOfRequirement(rq.id)}>
              <FontAwesomeIcon icon={fasStar} />
            </div>
            <span className={styles.Ordinal}>{(index + 1)}</span>
          </div>
          <div
            className={[styles.RequirementNameContainer,
            rq.active ? null : styles.InactiveRequirement].join(' ')}>
              <span
                className={styles.RequirementText}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onSubmit={(event) => this.requirementNameChangedHandler(event, rq.id)}>
                {rq.name}
              </span>
          </div>
        </div>
        */}

      </th>

    ));
  }
}

export default TableHeader;
