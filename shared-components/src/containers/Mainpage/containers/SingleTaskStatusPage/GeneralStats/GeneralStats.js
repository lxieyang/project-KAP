import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from '../matchPath';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import {
  getTaskLink,
  shouldAnonymize,
  getAnonymousAnimalName,
  getEncryptedAuthorId,
  getDecryptedAuthorId
} from '../../../../../shared/utilities';
import { PIECE_TYPES, ANNOTATION_TYPES } from '../../../../../shared/types';

class GeneralStats extends Component {
  state = {
    task: null,
    // author detail
    author: null,

    pieces: [],
    pieceComments: [],
    taskComments: []
  };

  componentDidMount() {
    this.updateTask();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.userId !== this.props.userId) {
      this.updateTask();
    }
  }

  updateTask = async () => {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    if (this.unsubscribeTaskId) this.unsubscribeTaskId();
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let task = { id: snapshot.id, ...snapshot.data() };
          this.setState({ task });

          FirestoreManager.getUserProfileById(task.creator)
            .get()
            .then(doc => {
              if (doc.exists) {
                let user = doc.data();

                let author = {
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  email: user.email,
                  uid: user.uid,
                  anonymize: false
                };

                // for Oberlin experiment
                if (
                  shouldAnonymize(
                    user.email,
                    task.creator,
                    FirestoreManager.getCurrentUserId()
                  )
                ) {
                  author.anonymize = true;
                }

                this.setState({ author });
              }
            });
        }
      }
    );

    if (this.unsubscribePieces) this.unsubscribePieces();
    this.unsubscribePieces = FirestoreManager.getAllPiecesInTask(
      taskId
    ).onSnapshot(querySnapshot => {
      let pieces = [];
      querySnapshot.forEach(snapshot => {
        let pieceId = snapshot.id;
        pieces.push({
          ...snapshot.data(),
          id: pieceId
        });
      });
      this.setState({ pieces });
      let pieceComments = new Array(pieces.length);
      let promises = [];
      for (let i = 0; i < pieceComments.length; i++) {
        promises.push(
          FirestoreManager.getAllCommentsToPiece(pieces[i].id)
            .get()
            .then(snapshot => {
              pieceComments[i] = snapshot.docs.length;
            })
        );
      }
      Promise.all(promises).then(() => {
        this.setState({ pieceComments });
      });
    });

    if (this.unsubscribeTaskComments) this.unsubscribeTaskComments();
    this.unsubscribeTaskComments = FirestoreManager.getAllCommentsToTask(
      taskId
    ).onSnapshot(querySnapshot => {
      let taskComments = [];
      querySnapshot.forEach(snapshot => {
        taskComments.push({
          ...snapshot.data(),
          id: snapshot.id
        });
      });
      this.setState({ taskComments });
    });
  };

  componentWillUnmount() {
    if (this.unsubscribeTaskId) this.unsubscribeTaskId();
    if (this.unsubscribePieces) this.unsubscribePieces();
  }

  render() {
    const { task, author, pieces, taskComments, pieceComments } = this.state;

    if (task === null || author === null) {
      return null;
    }

    let numOptions = pieces.filter(p => p.pieceType === PIECE_TYPES.option)
      .length;
    let numCriteria = pieces.filter(p => p.pieceType === PIECE_TYPES.criterion)
      .length;
    let numSnippets = pieces.filter(p => p.pieceType === PIECE_TYPES.snippet)
      .length;

    let numManualOptions = pieces.filter(
      p =>
        p.pieceType === PIECE_TYPES.option &&
        p.annotationType === ANNOTATION_TYPES.Manual
    ).length;
    let numManualCriteria = pieces.filter(
      p =>
        p.pieceType === PIECE_TYPES.criterion &&
        p.annotationType === ANNOTATION_TYPES.Manual
    ).length;
    let numManualSnippets = pieces.filter(
      p =>
        p.pieceType === PIECE_TYPES.snippet &&
        p.annotationType === ANNOTATION_TYPES.Manual
    ).length;

    let numTaskComments = taskComments.length;
    let numPieceComments = pieceComments.reduce((acc, val) => acc + val, 0);

    return (
      <div>
        <h1>Task: {task.name}</h1>
        <h4>
          {author.anonymize === false && (
            <span>
              Created by {author.displayName} ({author.email})
            </span>
          )}
          {author.anonymize === true && (
            <React.Fragment>
              <div>Created by {getAnonymousAnimalName(author.uid)}</div>
              <div>({getEncryptedAuthorId(author.uid).toString()})</div>
            </React.Fragment>
          )}
        </h4>

        <h3>
          # of Options: {numOptions} ({numManualOptions} created manually)
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; # of Criteria: {numCriteria} (
          {numManualCriteria} created manually){' '}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; # of Snippets: {numSnippets} (
          {numManualSnippets} created manually)
        </h3>
        <h3>
          # of Comments to the task: {numTaskComments}{' '}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; # of Comments to snippets:{' '}
          {numPieceComments}
        </h3>
      </div>
    );
  }
}

export default withRouter(GeneralStats);
