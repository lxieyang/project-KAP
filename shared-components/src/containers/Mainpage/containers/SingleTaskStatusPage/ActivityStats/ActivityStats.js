import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Timeline, TimelineEvent } from 'react-event-timeline';
import { getTaskIdFromPath } from '../matchPath';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import Checkbox from '@material-ui/core/Checkbox';

import { PIECE_TYPES, ANNOTATION_TYPES } from '../../../../../shared/types';

import SplitPane from 'react-split-pane';
import '../../SingleTaskPage/SplitPane.css';
import styles from './ActivityStats.css';

import eventTypes from '../../../../../firebase/wrappers/instrument_v1_event_types';
import { APP_NAME_SHORT } from '../../../../../shared/constants';

const getHTML = htmls => {
  let htmlString = ``;
  if (htmls !== undefined) {
    for (let html of htmls) {
      htmlString += html;
    }
  }
  return { __html: htmlString };
};

const getShouldDisplayTrackingStatus = (eventTypes, status = true) => {
  let ret = {};
  Object.entries(eventTypes).forEach(([key, _]) => (ret[key] = status));
  return ret;
};

class ActivityStats extends Component {
  state = {
    trackingData: [],

    shouldDisplayTrackingStatus: getShouldDisplayTrackingStatus(eventTypes)
  };

  componentDidMount() {
    this.updateTask();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.userId !== this.props.userId) {
      this.updateTask();
    }
  }

  updateTask = () => {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    if (this.unsubscribeTracking) this.unsubscribeTracking();
    this.unsubscribeTracking = FirestoreManager.getTaskInstrumentV1DataById(
      taskId
    )
      .orderBy('timestamp', 'asc')
      .onSnapshot(querySnapshot => {
        let trackingData = [];
        querySnapshot.forEach(snapshot => {
          trackingData.push({
            ...snapshot.data(),
            id: snapshot.id
          });
        });
        this.setState({ trackingData });
      });
  };

  componentWillUnmount() {
    if (this.unsubscribeTracking) this.unsubscribeTracking();
  }

  handleClicked = entry => {
    let displayOptions = { ...this.state.shouldDisplayTrackingStatus };
    displayOptions[entry] = !displayOptions[entry];
    this.setState({ shouldDisplayTrackingStatus: displayOptions });
  };

  handleSelectAll = () => {
    let displayOptions = getShouldDisplayTrackingStatus(eventTypes);
    this.setState({ shouldDisplayTrackingStatus: displayOptions });
  };

  handleDeselectAll = () => {
    let displayOptions = getShouldDisplayTrackingStatus(eventTypes, false);
    this.setState({ shouldDisplayTrackingStatus: displayOptions });
  };

  render() {
    let { trackingData, shouldDisplayTrackingStatus } = this.state;

    let filteredTrackingData = trackingData.filter(
      entry => shouldDisplayTrackingStatus[entry.eventType] === true
    );

    return (
      <div>
        <SplitPane
          split="vertical"
          minSize={200}
          defaultSize={350}
          maxSize={800}
          pane2Style={{ width: '100%' }}
        >
          <div className={styles.LeftPane}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => this.handleSelectAll()}
              >
                Select all
              </div>
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => this.handleDeselectAll()}
              >
                Deselect all
              </div>
            </div>
            {Object.keys(shouldDisplayTrackingStatus).map((entry, idx) => {
              return (
                <div
                  key={idx}
                  style={{ cursor: 'pointer' }}
                  onClick={() => this.handleClicked(entry)}
                >
                  <span>
                    {shouldDisplayTrackingStatus[entry] ? '✅' : '❌'}
                  </span>{' '}
                  &nbsp;
                  {entry.replace('NAMUAL', 'MANUAL')} (
                  {trackingData.filter(e => e.eventType === entry).length})
                </div>
              );
            })}
          </div>
          <div className={styles.RightPane}>
            <h3>{filteredTrackingData.length} events</h3>
            <Timeline style={{ fontSize: 14 }}>
              {filteredTrackingData.map((event, idx) => {
                return (
                  <TimelineEvent
                    key={idx}
                    title={
                      <strong>
                        {event.eventType.replace('NAMUAL', 'MANUAL')}
                      </strong>
                    }
                    createdAt={event.timestamp.toDate().toString()}
                  >
                    {/* tasks */}
                    {event.eventType === eventTypes.TASK__CREATE_TASK && (
                      <React.Fragment>
                        New Task Name: <strong>{event.taskName}</strong>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.TASK__DELETE_TASK && (
                      <React.Fragment>
                        Deleted Task Name: <strong>{event.taskName}</strong>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.TASK__EDIT_TASK_NAME && (
                      <React.Fragment>
                        <div>
                          Old Task Name: <strong>{event.taskName}</strong>
                        </div>
                        <div>
                          New Task Name: <strong>{event.newTaskName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TASK__TOGGLE_TASK_STAR_STATUS && (
                      <React.Fragment>
                        <div>
                          From: <strong>{event.from ? 'true' : 'false'}</strong>
                        </div>
                        <div>
                          To: <strong>{event.to ? 'true' : 'false'}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TASK__ADD_COMMENT_TO_TASK && (
                      <React.Fragment>
                        New Comment: <strong>{event.commentContent}</strong>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TASK__EDIT_COMMENT_TO_TASK && (
                      <React.Fragment>
                        <div>
                          From: <strong>{event.commentContent}</strong> (
                          {event.commentContent.length} chars)
                        </div>
                        <div>
                          To: <strong>{event.newCommentContent}</strong> (
                          {event.newCommentContent.length} chars)
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TASK__DELETE_COMMENT_TO_TASK && (
                      <React.Fragment>
                        Deleted Comment: <strong>{event.commentContent}</strong>
                      </React.Fragment>
                    )}

                    {/* pieces */}
                    {event.eventType ===
                      eventTypes.PIECE__HIGHLIGHT_CONTENT && (
                      <React.Fragment>
                        Highlighted: <strong>{event.text}</strong>
                        <br />
                        Source:{' '}
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.url}
                        </a>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.PIECE__SNAPSHOT_CONTENT && (
                      <React.Fragment>
                        Snapshotted:{' '}
                        <div dangerouslySetInnerHTML={getHTML(event.html)} />
                        Source:{' '}
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.url}
                        </a>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.PIECE__CREATE_HIGHLIGHT_PIECE && (
                      <React.Fragment>
                        Created Snippet From Highlight:{' '}
                        <strong>{event.text}</strong>
                        <br />
                        Source:{' '}
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.url}
                        </a>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.PIECE__CREATE_SNAPSHOT_PIECE && (
                      <React.Fragment>
                        Created Snippet from Snapshot:{' '}
                        <div dangerouslySetInnerHTML={getHTML(event.html)} />
                        Source:{' '}
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.url}
                        </a>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.PIECE__CREATE_MANUAL_PIECE && (
                      <React.Fragment>
                        Manually Created A Snippet:{' '}
                        <strong>{event.name}</strong>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.PIECE__DELETE_PIECE && (
                      <React.Fragment>
                        Deleted A Snippet: <strong>{event.name}</strong>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.PIECE__DELETE_PIECE_FOREVER && (
                      <React.Fragment>
                        Deleted A Snippet FOREVER: <strong>{event.name}</strong>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.PIECE__EMPTY_TRASH_CAN && (
                      <React.Fragment>Emptyed trash can</React.Fragment>
                    )}

                    {event.eventType === eventTypes.PIECE__REVIVE_PIECE && (
                      <React.Fragment>
                        Revive A Snippet: <strong>{event.name}</strong>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.PIECE__EDIT_PIECE_NAME && (
                      <React.Fragment>
                        <div>
                          From: <strong>{event.name}</strong> (
                          {event.name.length} chars)
                        </div>
                        <div>
                          To: <strong>{event.newName}</strong> (
                          {event.newName.length} chars)
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.PIECE__EDIT_PIECE_TEXT && (
                      <React.Fragment>
                        <div>
                          From: <strong>{event.text}</strong> (
                          {event.text.length} chars)
                        </div>
                        <div>
                          To: <strong>{event.newText}</strong> (
                          {event.newText.length} chars)
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.PIECE__ADD_COMMENT_TO_PIECE && (
                      <React.Fragment>
                        <div>
                          Added Comment: <strong>{event.commentContent}</strong>
                        </div>
                        <div>
                          To Piece: <strong>{event.name}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.PIECE__EDIT_COMMENT_TO_PIECE && (
                      <React.Fragment>
                        <div>
                          From Comment: <strong>{event.commentContent}</strong>{' '}
                          ({event.commentContent.length} chars)
                        </div>
                        <div>
                          To Comment: <strong>{event.newCommentContent}</strong>{' '}
                          ({event.newCommentContent.length} chars)
                        </div>
                        <div>
                          (To Piece: <strong>{event.name}</strong>)
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.PIECE__DELETE_COMMENT_TO_PIECE && (
                      <React.Fragment>
                        <div>
                          Deleted Comment:{' '}
                          <strong>{event.commentContent}</strong>
                        </div>

                        <div>
                          To Piece: <strong>{event.name}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TABLE__CREATE_NAMUAL_PIECE_AS_EVIDENCE && (
                      <React.Fragment>
                        <div>
                          Manually Added a Snippet:{' '}
                          <strong>{event.name}</strong>
                        </div>

                        <div>
                          (Corresponding Option:{' '}
                          <strong>
                            {event.correspondingRowHeaderPieceName}
                          </strong>
                          , Corresponding Criterion:{' '}
                          <strong>
                            {event.correspondingColHeaderPieceName}
                          </strong>
                          )
                        </div>
                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TABLE__CREATE_NAMUAL_PIECE_AS_OPTION && (
                      <React.Fragment>
                        <div>
                          Manually created an Option:{' '}
                          <strong>{event.name}</strong>
                        </div>
                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}
                    {event.eventType ===
                      eventTypes.TABLE__CREATE_NAMUAL_PIECE_AS_CRITERION && (
                      <React.Fragment>
                        <div>
                          Manually created an Criterion:{' '}
                          <strong>{event.name}</strong>
                        </div>
                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TABLE_ADD_EVIDENCE_PIECE && (
                      <React.Fragment>
                        <div>
                          Added a Snippet: <strong>{event.name}</strong>
                        </div>

                        <div>
                          (Corresponding Option:{' '}
                          <strong>
                            {event.correspondingRowHeaderPieceName}
                          </strong>
                          , Corresponding Criterion:{' '}
                          <strong>
                            {event.correspondingColHeaderPieceName}
                          </strong>
                          )
                        </div>
                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.TABLE_ADD_OPTION && (
                      <React.Fragment>
                        <div>
                          Added an Option: <strong>{event.name}</strong>
                        </div>

                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.TABLE_ADD_CRITERION && (
                      <React.Fragment>
                        <div>
                          Added a Criterion: <strong>{event.name}</strong>
                        </div>

                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.TABLE_REMOVE_EVIDENCE_PIECE && (
                      <React.Fragment>
                        <div>
                          Removed a Snippet: <strong>{event.name}</strong>
                        </div>

                        <div>
                          (Corresponding Option:{' '}
                          <strong>
                            {event.correspondingRowHeaderPieceName}
                          </strong>
                          , Corresponding Criterion:{' '}
                          <strong>
                            {event.correspondingColHeaderPieceName}
                          </strong>
                          )
                        </div>
                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.TABLE_REMOVE_OPTION && (
                      <React.Fragment>
                        <div>
                          Removed an Option: <strong>{event.name}</strong>
                        </div>

                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType === eventTypes.TABLE_REMOVE_CRITERION && (
                      <React.Fragment>
                        <div>
                          Removed a Criterion: <strong>{event.name}</strong>
                        </div>

                        <div>
                          In Table: <strong>{event.tableName}</strong>
                        </div>
                      </React.Fragment>
                    )}

                    {/* misc */}
                    {event.eventType ===
                      eventTypes.CONTEXT_SWITCH___MOUSE_ENTER_SIDEBAR && (
                      <React.Fragment>
                        <div>
                          Mouse <strong>Entered</strong> the sidebar
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.CONTEXT_SWITCH___MOUSE_LEAVE_SIDEBAR && (
                      <React.Fragment>
                        <div>
                          Mouse <strong>Left</strong> the sidebar
                        </div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.CONTEXT_SWITCH_FOCUS_ON_WEBAPP && (
                      <React.Fragment>
                        <div>Switched to {APP_NAME_SHORT} web app</div>
                      </React.Fragment>
                    )}

                    {event.eventType ===
                      eventTypes.CONTEXT_SWITCH_BLUR_ON_WEBAPP && (
                      <React.Fragment>
                        <div>Left {APP_NAME_SHORT} web app</div>
                      </React.Fragment>
                    )}
                  </TimelineEvent>
                );
              })}
            </Timeline>
          </div>
        </SplitPane>
      </div>
    );
  }
}

export default withRouter(ActivityStats);
