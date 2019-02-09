import React, { Component } from 'react';
import styled from 'styled-components';
import ReactHoverObserver from 'react-hover-observer';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from '../../matchPath';
import * as FirestoreManager from '../../../../../../firebase/firestore_wrapper';
import styles from './PiecesView.css';

import { withStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import PieceItem from './PieceItem/PieceItem';

const PiecesContainer = styled.div`
  margin: 5px 0px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
`;

const PiecesUL = styled.div`
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: -15px;
  overflow: auto;
`;

const PieceLI = styled.div`
  margin: 0px;
  padding-left: 4px;
`;

const materialStyles = theme => ({
  chip: {
    padding: '0'
  },
  close: {
    padding: theme.spacing.unit / 2
  }
});

class PiecesView extends Component {
  state = {
    pieces: [],
    taskId: null,

    // editAccess
    editAccess: false,

    // snackbar control
    open: false,
    timeoutDuration: 10000,
    toDeletePieceId: '',
    toDeletePieceName: ''
  };

  constructor() {
    super();
    this.topRef = React.createRef();
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          this.setState({
            taskId,
            editAccess:
              snapshot.data().creator === FirestoreManager.getCurrentUserId()
          });
        }
      }
    );

    this.unsubscribePieces = FirestoreManager.getAllPiecesInTask(taskId)
      .orderBy('creationDate', 'desc')
      .onSnapshot(querySnapshot => {
        let pieces = [];
        querySnapshot.forEach(doc => {
          pieces.push({
            id: doc.id,
            ...doc.data()
          });
        });
        this.setState({
          pieces
        });
      });
  }

  componentWillUnmount() {
    this.unsubscribeTaskId();
    this.unsubscribePieces();
  }

  render() {
    let { pieces, taskId, editAccess } = this.state;
    let { classes } = this.props;

    return (
      <React.Fragment>
        <PiecesContainer innerRef={this.containerRef}>
          <PiecesUL>
            <PieceLI
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span ref={this.topRef} className={styles.TopChip}>
                top
              </span>
            </PieceLI>
            {pieces.map((p, idx) => {
              return (
                <PieceLI key={idx + p.id}>
                  <ReactHoverObserver>
                    <PieceItem
                      piece={p}
                      idx={idx}
                      currentTaskId={taskId}
                      editAccess={editAccess}
                    />
                  </ReactHoverObserver>
                </PieceLI>
              );
            })}
            <PieceLI
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span className={styles.BottomChip}>end</span>
            </PieceLI>
            <PieceLI
              style={{
                height: '400px'
              }}
            />
          </PiecesUL>
        </PiecesContainer>
      </React.Fragment>
    );
  }
}

export default withRouter(withStyles(materialStyles)(PiecesView));
