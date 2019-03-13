/* global chrome */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ReactTooltip from 'react-tooltip';
import autobind from 'autobind-decorator';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import { APP_NAME_SHORT } from '../../../../../shared-components/src/shared/constants';
import Logo from '../../../../../shared-components/src/components/UI/Logo/Logo';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES
} from '../../../../../shared-components/src/shared/types';
import { PIECE_COLOR } from '../../../../../shared-components/src/shared/theme';
import { Highlight, Snippet } from 'siphon-tools';
import firebase from '../../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../../shared-components/src/firebase/firestore_wrapper';
import { ANNOTATION_TYPES } from '../../../../../shared-components/src/shared/types';
import styles from './SelectTooltipButton.css';

class SelectTooltipButton extends Component {
  state = {
    displayDetailedMenu: false,

    // userId: null,
    annotation: null,
    shouldUseScreenshot: false,

    createdPieceId: null,
    createdPieceRect: null
  };

  componentDidMount() {
    window.addEventListener('mousedown', this.mouseDown, true);

    setTimeout(() => {
      // check if MathJax is present
      if (this.props.MathJaxUsed) {
        this.setState({ shouldUseScreenshot: true });
      }

      // extract annotation
      let annotation;
      if (this.props.annotationType === ANNOTATION_TYPES.Highlight) {
        annotation = new Highlight(this.props.range);
      } else if (this.props.annotationType === ANNOTATION_TYPES.Snippet) {
        annotation = new Snippet(
          this.props.captureWindow.getBoundingClientRect()
        );
      }
      // console.log(annotation);
      this.setState({ annotation });
    }, 5);

    // support for selecting annotation
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_SELECTED'
    });

    chrome.runtime.onMessage.addListener(this.annotationSelectionListener);
  }

  annotationSelectionListener = (request, sender, sendResponse) => {
    if (request.msg === 'ANNOTATION_LOCATION_SELECTED_IN_TABLE') {
      const { tableId, cellId, cellType, ratingType } = request.payload;

      if (this.state.annotation === null) {
        // make sure annotation is collected
        return false;
      }

      if (this.state.createdPieceId === null) {
        // preserve client rect
        let rect = this.props.captureWindow
          ? this.props.captureWindow.getBoundingClientRect()
          : this.props.range.getBoundingClientRect();

        chrome.runtime.sendMessage({
          msg: 'CREATE_NEW_ANNOTATION_AND_PUT_IN_TABLE',
          payload: {
            annotation: this.state.annotation,
            contextData: {
              url: window.location.href,
              hostname: window.location.hostname,
              pathname: window.location.pathname,
              pageTitle: document.title,
              shouldUseScreenshot: this.state.shouldUseScreenshot
            },
            annotationType: this.props.annotationType,
            type: PIECE_TYPES.snippet,
            tableId,
            cellId,
            cellType,
            ratingType
          }
        });

        this.setState({
          createdPieceId: this.state.annotation.key,
          createdPieceRect: rect
        });

        // fix for chrome 73
        // FirestoreManager.createPiece(
        //   this.state.annotation,
        //   {
        //     url: window.location.href,
        //     hostname: window.location.hostname,
        //     pathname: window.location.pathname,
        //     pageTitle: document.title,
        //     shouldUseScreenshot: this.state.shouldUseScreenshot
        //   },
        //   this.props.annotationType,
        //   PIECE_TYPES.snippet
        // )
        //   .then(pieceId => {
        //     chrome.runtime.sendMessage({
        //       msg: 'SHOW_SUCCESS_STATUS_BADGE',
        //       success: true
        //     });

        //     // put into the table
        //     // if (cellType === TABLE_CELL_TYPES.regularCell) {
        //     FirestoreManager.addPieceToTableCellById(
        //       tableId,
        //       cellId,
        //       pieceId,
        //       ratingType
        //     );
        //     // } else if (cellType === TABLE_CELL_TYPES.rowHeader) {
        //     //   console.log('should put as option');
        //     // } else if (cellType === TABLE_CELL_TYPES.columnHeader) {
        //     //   console.log('should put as criterion');
        //     // }

        //     this.setState({ createdPieceId: pieceId, createdPieceRect: rect });

        //     chrome.runtime.sendMessage({
        //       msg: 'SELECTED_ANNOTATION_ID_UPDATED',
        //       pieceId
        //     });
        //   })
        //   .catch(error => {
        //     console.log(error);
        //     chrome.runtime.sendMessage({
        //       msg: 'SHOW_SUCCESS_STATUS_BADGE',
        //       success: false
        //     });
        //   });

        // take screenshot
        setTimeout(() => {
          chrome.runtime.sendMessage(
            {
              msg: 'SCREENSHOT_WITH_COORDINATES',
              rect,
              windowSize: this.props.windowSize,
              pieceId: this.state.annotation.key
            },
            response => {}
          );
        }, 5);
      } else {
        chrome.runtime.sendMessage({
          msg: 'PUT_EXISTING_ANNOTATION_IN_TABLE',
          payload: {
            tableId,
            cellId,
            pieceId: this.state.createdPieceId,
            ratingType
          }
        });
        // directly put into the table
        // FirestoreManager.addPieceToTableCellById(
        //   tableId,
        //   cellId,
        //   this.state.createdPieceId,
        //   ratingType
        // );
      }
    }
  };

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.mouseDown, true);

    // send to background
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_UNSELECTED'
    });

    chrome.runtime.onMessage.removeListener(this.annotationSelectionListener);
  }

  @autobind
  removeTooltipButton() {
    this.props.removeTooltipButton();
    // if (this.props.captureWindow) {
    //   this.props.captureWindow.remove();
    // }
    // ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this).parentNode);
  }

  @autobind
  mouseDown(e) {
    let tooltipButton = ReactDOM.findDOMNode(this);
    if (tooltipButton.contains(e.target)) {
      //Ignore mouseup inside the toolbar
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    this.removeTooltipButton();
    if (this.state.createdPieceId !== null) {
      setTimeout(() => {
        chrome.runtime.sendMessage(
          {
            msg: 'SCREENSHOT_WITH_COORDINATES',
            rect: this.state.createdPieceRect,
            windowSize: this.props.windowSize,
            pieceId: this.state.createdPieceId
          },
          response => {}
        );
      }, 5);
    }
  }

  mouseEnterTooltipButton = () => {
    this.tooltipButtonHoverTimeout = setTimeout(() => {
      this.setState({ displayDetailedMenu: true });
    }, 300);
  };

  mouseLeaveTooltipButton = () => {
    clearTimeout(this.tooltipButtonHoverTimeout);
  };

  mouseEnterDetailedMenu = () => {
    clearTimeout(this.detailedMenuHoverTimeout);
  };

  mouseLeaveDetailedMenu = () => {
    this.detailedMenuHoverTimeout = setTimeout(() => {
      this.setState({ displayDetailedMenu: false });
    }, 300);
  };

  tooltipButtonClickedHandler = async (type = PIECE_TYPES.snippet) => {
    if (this.state.annotation === null) {
      // make sure annotation is collected
      return false;
    }

    // preserve client rect
    let rect = this.props.captureWindow
      ? this.props.captureWindow.getBoundingClientRect()
      : this.props.range.getBoundingClientRect();

    chrome.runtime.sendMessage({
      msg: 'CREATE_NEW_ANNOTATION_BY_TOOLTIP_BUTTON_CLICKED',
      payload: {
        annotation: this.state.annotation,
        contextData: {
          url: window.location.href,
          hostname: window.location.hostname,
          pathname: window.location.pathname,
          pageTitle: document.title,
          shouldUseScreenshot: this.state.shouldUseScreenshot
        },
        annotationType: this.props.annotationType,
        type: type
      }
    });

    // fix for chrome 73
    // FirestoreManager.createPiece(
    //   this.state.annotation,
    //   {
    //     url: window.location.href,
    //     hostname: window.location.hostname,
    //     pathname: window.location.pathname,
    //     pageTitle: document.title,
    //     shouldUseScreenshot: this.state.shouldUseScreenshot
    //   },
    //   this.props.annotationType,
    //   type
    // )
    //   .then(pieceId => {
    //     chrome.runtime.sendMessage({
    //       msg: 'SHOW_SUCCESS_STATUS_BADGE',
    //       success: true
    //     });

    //     if (type === PIECE_TYPES.option) {
    //       FirestoreManager.putOptionIntoDefaultTable({ pieceId });
    //     } else if (type === PIECE_TYPES.criterion) {
    //       FirestoreManager.putCriterionIntoDefaultTable({ pieceId });
    //     }
    //   })
    //   .catch(error => {
    //     console.log(error);
    //     chrome.runtime.sendMessage({
    //       msg: 'SHOW_SUCCESS_STATUS_BADGE',
    //       success: false
    //     });
    //   });

    this.removeTooltipButton();

    // take screenshot (works fine under chrome 73)
    setTimeout(() => {
      chrome.runtime.sendMessage(
        {
          msg: 'SCREENSHOT_WITH_COORDINATES',
          rect,
          windowSize: this.props.windowSize,
          pieceId: this.state.annotation.key
        },
        response => {}
      );
    }, 5);
    // console.log(`should save as a type ${type} piece`);
  };

  render() {
    return (
      <React.Fragment>
        <div className={styles.TooltipButtonContainer}>
          <div
            className={styles.TooltipButton}
            // style={{ color: `${PIECE_COLOR.snippet}` }}
            onMouseEnter={e => this.mouseEnterTooltipButton()}
            onMouseLeave={e => this.mouseLeaveTooltipButton()}
            onClick={e => this.tooltipButtonClickedHandler()}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon
                icon={fasBookmark}
                style={{
                  marginRight: '5px'
                  // color: PIECE_COLOR.snippet
                }}
              />
              <div
                style={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span>Save to</span>
                <Logo size={'18px'} style={{ marginLeft: '5px' }} />
              </div>
            </div>
          </div>
          {this.state.displayDetailedMenu ? (
            <div
              className={styles.TooltipButtonDetailedMenu}
              onMouseEnter={e => this.mouseEnterDetailedMenu()}
              onMouseLeave={e => this.mouseLeaveDetailedMenu()}
            >
              <div className={styles.DetailedMenuItem}>
                <a
                  data-tip
                  data-for="add_pc"
                  onClick={e =>
                    this.tooltipButtonClickedHandler(PIECE_TYPES.snippet)
                  }
                  className={styles.DetailedMenuItemIcon}
                  style={{ backgroundColor: PIECE_COLOR.snippet }}
                >
                  <FontAwesomeIcon icon={fasBookmark} />
                </a>
                <ReactTooltip
                  id="add_pc"
                  type="dark"
                  effect="solid"
                  place={'bottom'}
                  // globalEventOff="click"
                  className={styles.TooltipContainer}
                >
                  Snippet
                </ReactTooltip>
              </div>
              <div className={styles.DetailedMenuItem}>
                <a
                  data-tip
                  data-for="add_op"
                  onClick={e =>
                    this.tooltipButtonClickedHandler(PIECE_TYPES.option)
                  }
                  className={styles.DetailedMenuItemIcon}
                  style={{ backgroundColor: PIECE_COLOR.option }}
                >
                  <FontAwesomeIcon icon={fasListUl} />
                </a>
                <ReactTooltip
                  id="add_op"
                  type="dark"
                  effect="solid"
                  place={'bottom'}
                  // globalEventOff="click"
                  className={styles.TooltipContainer}
                >
                  Option
                </ReactTooltip>
              </div>
              <div className={styles.DetailedMenuItem}>
                <a
                  data-tip
                  data-for="add_rq"
                  onClick={e =>
                    this.tooltipButtonClickedHandler(PIECE_TYPES.criterion)
                  }
                  className={styles.DetailedMenuItemIcon}
                  style={{ backgroundColor: PIECE_COLOR.criterion }}
                >
                  <FontAwesomeIcon icon={fasFlagCheckered} />
                </a>
                <ReactTooltip
                  id="add_rq"
                  type="dark"
                  effect="solid"
                  place={'bottom'}
                  // globalEventOff="click"
                  className={styles.TooltipContainer}
                >
                  Criterion
                </ReactTooltip>
              </div>
            </div>
          ) : null}
        </div>
      </React.Fragment>
    );
  }
}

export default SelectTooltipButton;
