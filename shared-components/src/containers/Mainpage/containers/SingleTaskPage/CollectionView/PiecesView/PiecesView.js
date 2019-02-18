import React, { Component } from 'react';
import styled from 'styled-components';
import ReactHoverObserver from 'react-hover-observer';
import LinesEllipsis from 'react-lines-ellipsis';
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
import AddIcon from '@material-ui/icons/Add';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import PieceItem from './PieceItem/PieceItem';
import ScreenshotModal from '../../ScreenshotModal/ScreenshotModal';
import { PIECE_TYPES } from '../../../../../../shared/types';

const StyledTab = withStyles({
  root: {
    minWidth: 40,
    minHeight: 36
  },
  label: {
    fontSize: '12px',
    textTransform: 'capitalize',
    overflow: 'hidden'
  },
  labelContainer: {
    padding: '6px 4px'
  }
})(Tab);

const PiecesContainer = styled.div`
  padding: 5px 0px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  /* background-color: rgb(211, 211, 211); */
`;

const PiecesUL = styled.div`
  /* position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  padding-right: 15px;
  right: -15px;
  overflow: auto; */

  width: 100%;
  height: 100%;
  overflow: auto;
  /* padding-right: 15px; */
`;

const PieceLI = styled.div`
  margin: 0px;
  padding-left: 4px;
  padding-right: 4px;
`;

const materialStyles = theme => ({
  chip: {
    padding: '0'
  },
  close: {
    padding: theme.spacing.unit / 2
  }
});

const HighZIndexSnackbar = withStyles({
  root: {
    zIndex: '99999'
  }
})(Snackbar);

const TAB_VALUES = {
  all: 1,
  trashed: 2,
  uncategorized: 3,
  options: 4,
  criteria: 5,
  snippets: 6
};

class PiecesView extends Component {
  state = {
    pieces: [],
    trashedPieces: [],
    piecesInCurrentWorkspace: {},
    taskId: null,

    // editAccess
    editAccess: false,

    // snackbar control
    open: false,
    timeoutDuration: 10000,
    toDeletePieceId: '',
    toDeletePieceName: '',

    // tab control
    activeTabValue: TAB_VALUES.uncategorized
  };

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          this.setState({
            taskId,
            editAccess:
              snapshot.data().creator === FirestoreManager.getCurrentUserId(),
            commentAccess: FirestoreManager.getCurrentUserId() !== null
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

    this.unsubscribeTrashedPieces = FirestoreManager.getAllTrashedPiecesInTask(
      taskId
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

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.currentWorkspaceId !== this.props.currentWorkspaceId) {
      this.getAllPiecesInCurrentTable(this.props.currentWorkspaceId);
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
    this.unsubscribeTaskId();
    this.unsubscribePieces();
    this.unsubscribeTrashedPieces();
    if (this.unsubscribeTablePieces) {
      this.unsubscribeTablePieces();
    }
  }

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
      // mark as trashed
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

  openScreenshot = imageDataUrl => {
    ScreenshotModal.setDataSource(imageDataUrl);
    ScreenshotModal.toggleModalOpen();
  };

  handleTabChange = (event, activeTabValue) => {
    this.setState({ activeTabValue });
  };

  render() {
    let {
      pieces,
      trashedPieces,
      piecesInCurrentWorkspace,
      taskId,
      editAccess,
      commentAccess,
      activeTabValue
    } = this.state;
    let { classes } = this.props;

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
              // variant="fullWidth"
              // variant="scrollable"
              // scrollButtons="off"
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
              {editAccess ? (
                <StyledTab value={TAB_VALUES.trashed} label={`Trashed`} />
              ) : null}
            </Tabs>
          </div>

          <PiecesUL>
            {piecesList.map((p, idx) => {
              return (
                <PieceLI key={idx + p.id}>
                  <ReactHoverObserver>
                    <PieceItem
                      piece={p}
                      idx={idx}
                      currentTaskId={taskId}
                      editAccess={editAccess}
                      commentAccess={commentAccess}
                      inTrashedTab={activeTabValue === TAB_VALUES.trashed}
                      handleDeleteButtonClicked={this.handleDeleteButtonClicked}
                      handleReviveButtonClicked={this.handleReviveButtonClicked}
                      openScreenshot={this.openScreenshot}
                    />
                  </ReactHoverObserver>
                </PieceLI>
              );
            })}
            <PieceLI
              style={{
                height: '400px'
              }}
            />
          </PiecesUL>
        </PiecesContainer>

        {/* snackbar */}
        <HighZIndexSnackbar
          anchorOrigin={{
            vertical: 'bottom',
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
              UNDO
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

        {/* Screenshot Modal */}
        <ScreenshotModal />
      </React.Fragment>
    );
  }
}

export default withRouter(withStyles(materialStyles)(PiecesView));
