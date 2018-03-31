import React, { Component } from 'react';

import { withRouter } from 'react-router-dom';
import * as appRoutes from '../../../shared/routes';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import farStar from '@fortawesome/fontawesome-free-regular/faStar';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasPuzzlePiece from '@fortawesome/fontawesome-free-solid/faPuzzlePiece';
import HorizontalDivider from '../../UI/Divider/HorizontalDivider/HorizontalDivider';
import styles from './TaskCard.css';
import moment from 'moment';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import * as FirebaseStore from '../../../firebase/store';

/* drag and drop */
const cardSource = {
  beginDrag(props) {
    // console.log("BEGINNING Dragging card [ID: " + props.id + "]");
    return {
      id: props.id,
      taskName: props.taskName
    }
  },

  endDrag(props, monitor, component) {
    // console.log("END DRAGGING")
    // const item = monitor.getDropResult();
    // console.log(item);
  }
}

const cardTarget = {
  canDrop(props, monitor, component) {
    if (monitor.getItem().id === props.id) {
      return false;
    }
    return true;
  },

  drop(props, monitor, component) {
    // console.log("DROPPED on card [ID:" + props.id + "]");
    const item = monitor.getItem();
    if (props.id !== item.id) {
      // combine two tasks
      props.combineSourceTaskWithTargetTask(item.id, item.taskName, props.id, props.taskName);
    }

    // console.log(item);
    return {
      id: props.id
    }
  }
}

const collectDrag = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }
}

const collectDrop = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }
}


// https://www.npmjs.com/package/react-awesome-popover
@DropTarget('TASKCARD', cardTarget, collectDrop)
@DragSource('TASKCARD', cardSource, collectDrag)
class TaskCard extends Component {
  state = {
    popoverIsOpen: false
  }

  static propTypes = {
    // Injected by React DnD:
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };


  deleteTaskWithId = (event, id) => {
    console.log('delete:' + id);
    // chrome.runtime.sendMessage({
    //   msg: actionTypes.DELETE_TASK_WITH_ID,
    //   payload: {
    //     id
    //   }
    // });
    FirebaseStore.deleteTaskWithId(id);
  }

  titleClickedHandler = (event, id) => {
    // switching current task
    // chrome.runtime.sendMessage({
    //   msg: actionTypes.SWITCH_CURRENT_TASK,
    //   payload: {
    //     id
    //   }
    // });
    FirebaseStore.switchCurrentTask(id);

    // rerouting
    this.props.history.push(appRoutes.CURRENT_TASK)
  }

  starClicked = (event, id) => {
    // chrome.runtime.sendMessage({
    //   msg: actionTypes.SWITCH_STAR_STATUS_OF_SELECTED_TASK,
    //   payload: {
    //     id
    //   }
    // });
    FirebaseStore.switchStarStatusOfSelectedTask(id);
  }

  moreButtonClicked = (event) => {
    this.setState(prevState => {
      return {popoverIsOpen: !prevState.popoverIsOpen};
    });
  }

  render () {
    const { connectDragSource, isDragging, connectDropTarget, canDrop, isOver } = this.props;
    const isActive = canDrop && isOver;

    return connectDropTarget(connectDragSource(
      <div
        className={styles.TaskCard}
        style={{
          transform: isActive ? 'scale(1.3)' : 'scale(1.0)',
          opacity: isDragging ? '0.3' : '1.0'
        }}>
        <div className={styles.Header}>
          <div className={styles.Left}>
            <FontAwesomeIcon 
              icon={this.props.isStarred ? fasStar : farStar} 
              onClick={(event) => {this.starClicked(event, this.props.id)}}
              className={[styles.StarIcon, (
                this.props.isStarred
                ? styles.Starred
                : null
              )].join(' ')}/>
          </div>
          <div className={styles.Right}>
            <span className={styles.Time}>
              {moment(new Date(this.props.time)).fromNow()}
            </span>
            <FontAwesomeIcon 
              icon={fasTrash}
              className={styles.DeleteTaskIcon}
              onClick={(event) => this.deleteTaskWithId(event, this.props.id)}/>
          </div>
        </div>

        <div
          className={styles.TaskName}
          onClick={(event) => this.titleClickedHandler(event, this.props.id)}>
          {this.props.taskName}
        </div>

        <HorizontalDivider margin="5px" />

        <div className={styles.Footer}>
          <div className={styles.MetaInfo}>
            <FontAwesomeIcon icon={fasListUl} className={styles.Icon}/>
            {this.props.numOptions} options
          </div>
          <div className={styles.MetaInfo}>
            <FontAwesomeIcon icon={fasPuzzlePiece} className={styles.Icon}/>
            {this.props.numPieces} pieces
          </div>
        </div>

      </div>
    ,{dropEffect: 'copy'}));
  }


}

export default withRouter(TaskCard);
