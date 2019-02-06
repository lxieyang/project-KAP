import React, { Component } from 'react';
import ReactHoverObserver from 'react-hover-observer';
import styled from 'styled-components';
import LinesEllipsis from 'react-lines-ellipsis';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import Countdown from 'react-countdown-now';

import Piece from './Piece/Piece';
import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';

const PiecesContainer = styled.div`
  /* background-color: rgb(242, 242, 242); */
  margin: 5px 0px;
  box-sizing: border-box;
  width: 100%;
  height: 600px;
  padding: 0px 6px;
  /* display: flex;
  justify-content: space-around;
  align-items: center; */
`;

const PiecesUL = styled.ul`
  list-style-type: none;
  padding: 0px;
`;

const PieceLI = styled.li`
  margin: 0px;
  padding: 0px;
`;

const styles = theme => ({
  close: {
    padding: theme.spacing.unit / 2
  }
});

class Pieces extends Component {
  state = {
    pieces: [],
    currentTaskId: '',

    // snackbar control
    open: false,
    timeoutDuration: 10000,
    toDeletePieceId: '',
    toDeletePieceName: ''
  };

  handleDeleteButtonClicked = (pieceId, pieceName) => {
    this.setState({ open: true });

    this.setState({ toDeletePieceId: pieceId, toDeletePieceName: pieceName });
    FirestoreManager.deletePieceById(pieceId);
  };

  handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
  };

  undoButtonClickedHandler = () => {
    this.setState({ open: false });

    FirestoreManager.revivePieceById(this.state.toDeletePieceId);
    setTimeout(() => {
      this.setState({ toDeletePieceId: '', toDeletePieceName: '' });
    }, 500);
  };

  componentDidMount() {
    this.unsubscribeCurrentTaskId = FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(
      doc => {
        let currentTaskId = doc.data().id;
        this.setState({ currentTaskId });
        this.unsubscribeAllPieces = FirestoreManager.getAllPiecesInTask(
          currentTaskId
        )
          .orderBy('creationDate', 'desc')
          .onSnapshot(querySnapshot => {
            let pieces = [];
            querySnapshot.forEach(doc => {
              pieces.push({ id: doc.id, ...doc.data() });
            });
            this.setState({ pieces });
          });
      }
    );
  }

  componentWillUnmount() {
    this.unsubscribeCurrentTaskId();
    this.unsubscribeAllPieces();
  }

  render() {
    let { pieces, currentTaskId } = this.state;
    let { classes } = this.props;
    return (
      <React.Fragment>
        <PiecesContainer>
          <PiecesUL>
            {pieces.map((p, idx) => {
              return (
                <PieceLI key={idx + p.id}>
                  <ReactHoverObserver>
                    <Piece
                      piece={p}
                      idx={idx}
                      currentTaskId={currentTaskId}
                      handleDeleteButtonClicked={this.handleDeleteButtonClicked}
                    />
                  </ReactHoverObserver>
                </PieceLI>
              );
            })}
          </PiecesUL>
        </PiecesContainer>

        {/* snackbar */}
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          open={this.state.open}
          autoHideDuration={this.state.timeoutDuration}
          onClose={this.handleSnackbarClose}
          ContentProps={{
            'aria-describedby': `message-id-pieces`
          }}
          message={
            <span
              id={`message-id-pieces`}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <LinesEllipsis
                text={this.state.toDeletePieceName}
                maxLine={2}
                ellipsis="..."
                trimRight
                basedOn="words"
              />{' '}
              <span style={{ marginLeft: '5px' }}>deleted!</span>
            </span>
          }
          action={[
            <Button
              key="undo"
              color="secondary"
              size="small"
              onClick={e => this.undoButtonClickedHandler()}
            >
              UNDO in{' '}
              <span style={{ margin: '0 0.25rem 0 0.25rem' }}>
                <Countdown
                  date={Date.now() + this.state.timeoutDuration}
                  intervalDelay={0}
                  precision={0}
                  renderer={props => <div>{props.seconds}</div>}
                />
              </span>
              seconds
            </Button>,
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              className={classes.close}
              onClick={this.handleSnackbarClose}
            >
              <CloseIcon />
            </IconButton>
          ]}
        />
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(Pieces);
