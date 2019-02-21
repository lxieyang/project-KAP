import React, { Component } from 'react';
import ReactHoverObserver from 'react-hover-observer';
import styled from 'styled-components';
import LinesEllipsis from 'react-lines-ellipsis';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { isEqual } from 'lodash';

import Countdown from 'react-countdown-now';

import Piece from './Piece/Piece';
import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';
import { PIECE_TYPES } from '../../../../../../shared-components/src/shared/types';

const StyledTab = withStyles({
  root: {
    minWidth: 30,
    minHeight: 36
  },
  label: {
    fontSize: '12px',
    textTransform: 'capitalize',
    overflow: 'hidden'
  },
  labelContainer: {
    padding: '0 4px'
  }
})(Tab);

const PiecesContainer = styled.div`
  flex-grow: 1;
  /* background-color: rgb(242, 242, 242); */
  margin: 5px 0px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  /* height: 600px; */
  padding: 0px 6px;
  display: flex;
  flex-flow: column;
`;

const PiecesULContainer = styled.div`
  position: relative;
  flex-grow: 1;
`;

const PiecesUL = styled.div`
  list-style-type: none;
  padding: 0px;
  margin: 0px 0px;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
`;

const PieceLI = styled.div`
  margin: 0px;
  padding: 0px;
`;

const styles = theme => ({
  close: {
    padding: theme.spacing.unit / 2
  }
});

const TAB_VALUES = {
  invalid: -1,
  all: 1,
  trashed: 2,
  uncategorized: 3,
  options: 4,
  criteria: 5,
  snippets: 6
};

class Pieces extends Component {
  state = {
    pieces: [],
    trashedPieces: [],
    piecesInCurrentWorkspace: {},
    currentTaskId: '',

    // snackbar control
    open: false,
    timeoutDuration: 10000,
    toDeletePieceId: '',
    toDeletePieceName: '',

    // tab control
    activeTabValue: TAB_VALUES.uncategorized,
    lastActiveTabValue: TAB_VALUES.invalid
  };

  handleTabChange = (event, activeTabValue) => {
    this.setState({ activeTabValue });
  };

  handleDeleteButtonClicked = (pieceId, pieceName) => {
    if (this.state.activeTabValue === TAB_VALUES.trashed) {
      // delete forever
      if (
        window.confirm(
          `Are you sure you want to PERMANENTLY DELETE "${pieceName}"?`
        )
      ) {
        FirestoreManager.deletePieceForeverById(pieceId);
      }
    } else {
      if (window.confirm(`Are you sure you want to trash "${pieceName}"?`)) {
        this.setState({ open: true });

        this.setState({
          toDeletePieceId: pieceId,
          toDeletePieceName: pieceName
        });
        FirestoreManager.deletePieceById(pieceId);
      }
    }
  };

  handleReviveButtonClicked = pieceId => {
    FirestoreManager.revivePieceById(pieceId);
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

        this.unsubscribeTrashedPieces = FirestoreManager.getAllTrashedPiecesInTask(
          currentTaskId
        )
          .orderBy('creationDate', 'desc')
          .onSnapshot(querySnapshot => {
            let trashedPieces = [];
            querySnapshot.forEach(doc => {
              trashedPieces.push({
                id: doc.id,
                ...doc.data()
              });
            });
            this.setState({
              trashedPieces
            });
          });

        this.getAllPiecesInCurrentTable(this.props.currentWorkspaceId);
      }
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.currentWorkspaceId !== this.props.currentWorkspaceId) {
      this.getAllPiecesInCurrentTable(this.props.currentWorkspaceId);
    }

    if (
      !isEqual(
        prevProps.currentSelectedPieceInTable,
        this.props.currentSelectedPieceInTable
      )
    ) {
      if (this.props.currentSelectedPieceInTable !== null) {
        // console.log(
        //   `should display piece ${
        //     this.props.currentSelectedPieceInTable.pieceId
        //   }`
        // );
        this.setState(prevState => {
          return {
            lastActiveTabValue:
              prevState.lastActiveTabValue === TAB_VALUES.invalid
                ? prevState.activeTabValue
                : prevState.lastActiveTabValue,
            activeTabValue: TAB_VALUES.all
          };
        });
      } else {
        // console.log('reset');
        this.setState(prevState => {
          return {
            activeTabValue: prevState.lastActiveTabValue,
            lastActiveTabValue: TAB_VALUES.invalid
          };
        });
      }
    }
  }

  getAllPiecesInCurrentTable = tableId => {
    if (tableId !== '0') {
      if (this.unsubscribeTablePieces) {
        this.unsubscribeTablePieces();
      }
      this.unsubscribeTablePieces = FirestoreManager.getAllTableCellsInTableById(
        tableId
      ).onSnapshot(querySnapshot => {
        let piecesInCurrentWorkspace = {};
        querySnapshot.forEach(snapshot => {
          let pieceIds = snapshot.data().pieces.map(p => p.pieceId);
          pieceIds.forEach(
            pieceId => (piecesInCurrentWorkspace[pieceId] = true)
          );
        });
        this.setState({ piecesInCurrentWorkspace });
      });
    }
  };

  componentWillUnmount() {
    this.unsubscribeCurrentTaskId();
    this.unsubscribeAllPieces();
    this.unsubscribeTrashedPieces();
    if (this.unsubscribeTablePieces) {
      this.unsubscribeTablePieces();
    }
  }

  render() {
    let {
      pieces,
      trashedPieces,
      piecesInCurrentWorkspace,
      currentTaskId,
      activeTabValue
    } = this.state;
    let { classes, currentSelectedPieceInTable } = this.props;
    let idOfCurrentSelectedPieceInTable =
      currentSelectedPieceInTable !== null
        ? currentSelectedPieceInTable.pieceId
        : null;

    let piecesList = pieces;
    switch (activeTabValue) {
      case TAB_VALUES.trashed:
        piecesList = trashedPieces;
        break;
      case TAB_VALUES.options:
        piecesList = pieces.filter(p => p.pieceType === PIECE_TYPES.option);
        break;
      case TAB_VALUES.criteria:
        piecesList = pieces.filter(p => p.pieceType === PIECE_TYPES.criterion);
        break;
      case TAB_VALUES.snippets:
        piecesList = pieces.filter(p => p.pieceType === PIECE_TYPES.snippet);
        break;
      case TAB_VALUES.uncategorized:
        piecesList = pieces.filter(
          p => piecesInCurrentWorkspace[p.id] !== true
        );
        break;

      case TAB_VALUES.all:
        if (idOfCurrentSelectedPieceInTable !== null) {
          piecesList = pieces.filter(
            p => p.id === idOfCurrentSelectedPieceInTable
          );
        }
        break;
      default:
        break;
    }

    return (
      <React.Fragment>
        <PiecesContainer>
          <div>
            <Tabs
              value={activeTabValue}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              // variant="scrollable"
              // scrollButtons="auto"
              onChange={this.handleTabChange}
            >
              <StyledTab
                value={TAB_VALUES.uncategorized}
                label={`Uncategorized`}
              />
              <StyledTab value={TAB_VALUES.options} label={`Options`} />
              <StyledTab value={TAB_VALUES.criteria} label={`Criteria`} />
              <StyledTab value={TAB_VALUES.snippets} label={`Snippets`} />
              <StyledTab value={TAB_VALUES.all} label={`All`} />
              <StyledTab value={TAB_VALUES.trashed} label={`Trashed`} />
            </Tabs>
          </div>

          <PiecesULContainer>
            <PiecesUL>
              {piecesList.map((p, idx) => {
                return (
                  <PieceLI key={idx + p.id}>
                    <ReactHoverObserver>
                      <Piece
                        piece={p}
                        idx={idx}
                        currentTaskId={currentTaskId}
                        inTrashedTab={activeTabValue === TAB_VALUES.trashed}
                        inAllTab={activeTabValue === TAB_VALUES.all}
                        inUncategorizedTab={
                          activeTabValue === TAB_VALUES.uncategorized
                        }
                        currentSelectedPieceInTable={
                          currentSelectedPieceInTable
                        }
                        handleDeleteButtonClicked={
                          this.handleDeleteButtonClicked
                        }
                        handleReviveButtonClicked={
                          this.handleReviveButtonClicked
                        }
                      />
                    </ReactHoverObserver>
                  </PieceLI>
                );
              })}
            </PiecesUL>
          </PiecesULContainer>
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
              UNDO{' '}
              {/*in{' '}
              <span style={{ margin: '0 0.25rem 0 0.25rem' }}>
                <Countdown
                  date={Date.now() + this.state.timeoutDuration}
                  intervalDelay={0}
                  precision={0}
                  renderer={props => <div>{props.seconds}</div>}
                />
              </span>
              seconds*/}
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
