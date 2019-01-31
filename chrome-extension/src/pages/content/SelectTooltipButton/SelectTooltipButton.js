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
import { PIECE_TYPES } from '../../../../../shared-components/src/shared/types';
import { Highlight, Snippet } from 'siphon-tools';
import firebase from '../../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../../shared-components/src/firebase/firestore_wrapper';
import { ANNOTATION_TYPES } from '../../../../../shared-components/src/shared/types';
import styles from './SelectTooltipButton.css';

class SelectTooltipButton extends Component {
  state = {
    displayDetailedMenu: false,

    userId: FirestoreManager.getCurrentUserId(),
    annotation: {}
  };

  componentDidMount() {
    window.addEventListener('mousedown', this.mouseDown, true);

    this.setState({ userId: FirestoreManager.getCurrentUserId() });
    let annotation;
    if (this.props.annotationType === ANNOTATION_TYPES.Highlight) {
      annotation = new Highlight(this.props.range);
    } else if (this.props.annotationType === ANNOTATION_TYPES.Snippet) {
      annotation = new Snippet(
        this.props.captureWindow.getBoundingClientRect()
      );
    }
    console.log(annotation);
    this.setState({ annotation });
  }

  componentWillUnmount() {
    window.removeEventListener('mousedown', this.mouseDown, true);
  }

  @autobind
  removeTooltipButton() {
    if (this.props.captureWindow) {
      this.props.captureWindow.remove();
    }
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this).parentNode);
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
  }

  // collectButtonClickHandler = btnType => {
  //   const { selectedText, addPiece, clip } = this.props;
  //   if (btnType === 'task') {
  //     // console.log('task option clicked');
  //     FirebaseStore.addTaskFromSearchTerm(selectedText);
  //     this.setState({ canSubmitTask: true });
  //     if (clip !== undefined) {
  //       setTimeout(() => {
  //         clip();
  //       }, 900);
  //     }
  //   } else if (btnType === 'option') {
  //     // console.log('add option clicked');
  //     FirebaseStore.addAnOptionForCurrentTask(selectedText);
  //     this.setState({ canSubmitOption: true });
  //     if (clip !== undefined) {
  //       setTimeout(() => {
  //         clip();
  //       }, 900);
  //     }
  //   } else if (btnType === 'requirement') {
  //     FirebaseStore.addARequirementForCurrentTask(selectedText);
  //     this.setState({ canSubmitRequirement: true });
  //     if (clip !== undefined) {
  //       setTimeout(() => {
  //         clip();
  //       }, 900);
  //     }
  //   } else if (btnType === 'snippet') {
  //     if (addPiece !== undefined) {
  //       setTimeout(() => {
  //         addPiece();
  //       }, 10);
  //     }
  //   }
  // };

  mouseEnterTooltipButton = () => {
    this.tooltipButtonHoverTimeout = setTimeout(() => {
      this.setState({ displayDetailedMenu: true });
    }, 600);
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
    }, 600);
  };

  tooltipButtonClickedHandler = (type = PIECE_TYPES.snippet) => {
    FirestoreManager.createPiece(
      this.state.annotation,
      { url: window.location.href },
      this.props.annotationType,
      type
    );

    chrome.runtime.sendMessage({
      msg: 'SHOW_SUCCESS_STATUS_BADGE',
      success: true
    });
    console.log(`should save as a type ${type} piece`);
    this.removeTooltipButton();
  };

  render() {
    return (
      <React.Fragment>
        <div className={styles.TooltipButtonContainer}>
          <div
            className={styles.TooltipButton}
            onMouseEnter={e => this.mouseEnterTooltipButton()}
            onMouseLeave={e => this.mouseLeaveTooltipButton()}
            onClick={e => this.tooltipButtonClickedHandler()}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon
                icon={fasBookmark}
                style={{ marginRight: '5px' }}
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
                  style={{ backgroundColor: 'rgb(193, 40, 27)' }}
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
                  style={{ backgroundColor: 'rgb(232, 173, 84)' }}
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
                  style={{ backgroundColor: 'rgb(73, 132, 233)' }}
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
