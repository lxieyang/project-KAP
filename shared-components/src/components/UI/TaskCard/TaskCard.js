import React, { Component } from 'react';

import { withRouter } from 'react-router-dom';
import * as appRoutes from '../../../shared/routes';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import farStar from '@fortawesome/fontawesome-free-regular/faStar';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasPuzzlePiece from '@fortawesome/fontawesome-free-solid/faPuzzlePiece';
import fasDiagnoses from '@fortawesome/fontawesome-free-solid/faDiagnoses';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
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
    FirebaseStore.deleteTaskWithId(id);
  }

  titleClickedHandler = (event, id) => {
    FirebaseStore.switchCurrentTask(id);

    // rerouting
    this.props.history.push(appRoutes.CURRENT_TASK);
  }

  starClicked = (event, id) => {
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
            {
              this.props.id === this.props.currentTaskId
              ? <span 
                  className={styles.CurrentTaskBadge}>
                  Current Task
                </span>
              : null
            }
          </div>
          <div className={styles.Right}>
            <span className={styles.Time}>
              {moment(new Date(this.props.time)).fromNow()}
            </span>
            <div title='Delete this task'>
              <FontAwesomeIcon 
                icon={fasTrash}
                className={styles.DeleteTaskIcon}
                onClick={(event) => this.deleteTaskWithId(event, this.props.id)}/>            
            </div>
          </div>
        </div>

        <div
          className={styles.TaskName}
          onClick={(event) => this.titleClickedHandler(event, this.props.id)}>
          {this.props.taskName}
        </div>

        <div
          className={styles.TaskOngoingStatusContainer}>
          {
            this.props.taskOngoing 
            ? <div className={[styles.TaskOngoingBadge, styles.TaskOngoingTrue].join(' ')}>
                <FontAwesomeIcon icon={fasDiagnoses} style={{marginRight: '4px'}}/>
                In progress...
              </div> 
            : <div className={[styles.TaskOngoingBadge, styles.TaskOngoingFalse].join(' ')}>
                <FontAwesomeIcon icon={fasCheck} style={{marginRight: '4px'}}/>    
                Completed!
                {
                  this.props.completionTimestamp !== null ? ` (${moment(this.props.completionTimestamp).fromNow()})` : null
                }
              </div>
          }
        </div>

        <HorizontalDivider margin="5px" />

        <div className={styles.Footer}>
          <div className={styles.MetaInfo}>
            <FontAwesomeIcon icon={fasListUl} className={styles.Icon}/>
            {this.props.numOptions} options
          </div>
          <div className={styles.MetaInfo}>
            <FontAwesomeIcon icon={fasFlagCheckered} className={styles.Icon}/>
            {this.props.numRequirements} requirements
          </div>
          <div className={styles.MetaInfo}>
            <FontAwesomeIcon icon={fasPuzzlePiece} className={styles.Icon}/>
            {this.props.numPieces} snippets
          </div>
        </div>

      </div>
    ,{dropEffect: 'copy'}));
  }


}

export default withRouter(TaskCard);
