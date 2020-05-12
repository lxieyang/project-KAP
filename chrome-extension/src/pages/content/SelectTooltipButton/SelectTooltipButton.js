/* global chrome */
import $ from 'jquery';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ReactTooltip from 'react-tooltip';
import autobind from 'autobind-decorator';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import {
  APP_NAME_SHORT,
  supportedLanguages,
  supportedWebFrameworks,
  supportedOtherFrameworksLibrariesTools,
  supportedPlatforms,
  versionRegex
} from '../../../../../shared-components/src/shared/constants';
import Logo from '../../../../../shared-components/src/components/UI/Logo/Logo';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES
} from '../../../../../shared-components/src/shared/types';
import { PIECE_COLOR } from '../../../../../shared-components/src/shared/theme';
import { Highlight, Snippet } from 'siphon-tools';
import { ANNOTATION_TYPES } from '../../../../../shared-components/src/shared/types';
import styles from './SelectTooltipButton.css';

const runVersionDetectors = annotation => {
  let versionInfo = { languages: {}, frameworks: {}, platforms: {} };
  let text = annotation.text.toLowerCase();

  const runDetection = supported => {
    let detected = [];
    supported.forEach(item => {
      const { detectors, versionDetectors } = item;
      let hitDetectors = [];
      detectors.forEach(detector => {
        let matches = [...text.matchAll(RegExp(detector, 'g'))];
        if (matches.length > 0) {
          // find item hit
          let hitVersions = [];
          if (versionDetectors && versionDetectors.includes(detector)) {
            // detect versions
            matches.forEach(match => {
              const { index } = match;
              if (index === 0 || /\s/.test(text[index - 1])) {
                let possibleStringWithVersionNumber = text.slice(
                  index,
                  index + detector.length + 8
                );
                let detectedVersion = possibleStringWithVersionNumber.match(
                  versionRegex
                );
                if (detectedVersion) {
                  detectedVersion = detectedVersion[0];
                  hitVersions.push(detectedVersion);
                }
              }
            });
          }
          hitDetectors.push({ detector, versions: hitVersions });
        }
      });
      if (hitDetectors.length > 0) {
        detected.push({ id: item.id, hitDetectors });
      }
    });
    return detected;
  };

  // detect languages
  let detectedLanguages = runDetection(supportedLanguages);
  versionInfo.languages = detectedLanguages;

  // detect frameworks
  let detectedFrameworks = runDetection(
    supportedOtherFrameworksLibrariesTools.concat(supportedWebFrameworks)
  );
  versionInfo.frameworks = detectedFrameworks;

  // detect platforms
  let detectedPlatforms = runDetection(supportedPlatforms);
  versionInfo.platforms = detectedPlatforms;

  return null;
};

const getAnswerInfoOnStackOverflow = (
  anchorNode = window.getSelection().focusNode
) => {
  if (window.location.href.indexOf('stackoverflow.com/questions') !== -1) {
    let answerPost = $(anchorNode).parents('.answer');
    answerPost = answerPost ? answerPost[0] : null;
    if (answerPost) {
      let answerMetaInfo = {
        answerVoteCount: null,
        answerLink: null,
        answerCreatedTime: null,
        answerEditedTime: null,
        answerAccepted: null,
        questionTags: []
      };
      answerMetaInfo.answerVoteCount = $(answerPost).find(
        '.js-vote-count'
      )[0].textContent;

      answerMetaInfo.answerLink = $(answerPost).find('div.post-menu a')[0].href;

      const editTime = $(answerPost).find(
        '.post-signature .user-action-time a span.relativetime'
      )[0];
      if (editTime) {
        answerMetaInfo.answerEditedTime = editTime.title;
      }

      const createdTime = $(answerPost)
        .find('.post-signature .user-action-time')
        .children('span.relativetime');
      if (createdTime.length > 0) {
        answerMetaInfo.answerCreatedTime = createdTime[0].title;
      }

      let accepted = $(answerPost).find('.js-accepted-answer-indicator');
      if (accepted.length > 0) {
        accepted = accepted[0];
        if (!$(accepted).hasClass('d-none')) {
          answerMetaInfo.answerAccepted = true;
        } else {
          answerMetaInfo.answerAccepted = false;
        }
      } else {
        answerMetaInfo.answerAccepted = false;
      }

      let questionTagNodes = $(document).find('.post-tag.js-gps-track');
      let questionTags = [];
      questionTagNodes.each((idx, tag) => {
        questionTags.push(tag.text);
      });
      answerMetaInfo.questionTags = questionTags;

      return answerMetaInfo;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

class SelectTooltipButton extends Component {
  state = {
    displayDetailedMenu: false,

    // userId: null,
    annotation: null,
    shouldUseScreenshot: false,

    createdPieceId: null,
    createdPieceRect: null,

    codeSnippets: [],

    answerMetaInfo: null,
    versionInfo: null
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
      let answerMetaInfo = null;
      let versionInfo = null;
      if (this.props.annotationType === ANNOTATION_TYPES.Highlight) {
        annotation = new Highlight(this.props.range);
        answerMetaInfo = getAnswerInfoOnStackOverflow();
        versionInfo = runVersionDetectors(annotation);
        this.setState({ annotation, answerMetaInfo, versionInfo });
      } else if (this.props.annotationType === ANNOTATION_TYPES.Snippet) {
        annotation = new Snippet(
          this.props.captureWindow.getBoundingClientRect()
        );

        answerMetaInfo = getAnswerInfoOnStackOverflow(annotation.anchor);
        versionInfo = runVersionDetectors(annotation);

        const nodes = annotation.nodes;

        /** context object support */
        if (nodes.length > 0) {
          let focusElement = nodes[0];
          $(focusElement).addClass('kap-approx-focus');
          // console.log(focusElement);
        }

        /** code snippets support */
        let codeSnippets = [];
        nodes.forEach(node => {
          if (node.nodeName === 'PRE') {
            const codeAnnotationSnippet = new Snippet(
              node.getBoundingClientRect()
            );
            codeSnippets.push({
              html: codeAnnotationSnippet.html,
              text: codeAnnotationSnippet.text
            });
          } else {
            const pres = $(node).find('pre');
            if (pres.length > 0) {
              // console.log(pres);
              for (let i = 0; i < pres.length; i++) {
                const codeAnnotationSnippet = new Snippet(
                  pres[i].getBoundingClientRect()
                );
                codeSnippets.push({
                  html: codeAnnotationSnippet.html,
                  text: codeAnnotationSnippet.text
                });
              }
            }
          }
        });
        // console.log(codeSnippets);
        this.setState({
          annotation,
          answerMetaInfo,
          versionInfo,
          codeSnippets
        });
      }
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

        let saveAnnotationTimestamp = new Date().getTime();

        let payload = {
          annotation: this.state.annotation,
          contextData: {
            url: window.location.href,
            hostname: window.location.hostname,
            pathname: window.location.pathname,
            pageTitle: document.title,
            shouldUseScreenshot: this.state.shouldUseScreenshot,
            answerMetaInfo: this.state.answerMetaInfo,
            versionInfo: this.state.versionInfo,
            codeSnippets: this.state.codeSnippets
          },
          annotationType: this.props.annotationType,
          type: PIECE_TYPES.snippet,
          timer: {
            startAnnotationTimestamp: this.props.timer.startTimestamp,
            finishAnnotationTimestamp: this.props.timer.endTimestamp,
            saveAnnotationTimestamp: saveAnnotationTimestamp,
            annotationDuration:
              this.props.timer.endTimestamp - this.props.timer.startTimestamp,
            totalDuration:
              saveAnnotationTimestamp - this.props.timer.startTimestamp
          },
          tableId,
          cellId,
          cellType,
          ratingType
        };

        chrome.runtime.sendMessage({
          msg: 'CREATE_NEW_ANNOTATION_AND_PUT_IN_TABLE',
          payload
        });

        // console.log(payload.timer.annotationDuration);
        // console.log(payload.timer.totalDuration);

        this.setState({
          createdPieceId: this.state.annotation.key,
          createdPieceRect: rect
        });

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

    let saveAnnotationTimestamp = new Date().getTime();
    let payload = {
      annotation: this.state.annotation,
      contextData: {
        url: window.location.href,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        pageTitle: document.title,
        shouldUseScreenshot: this.state.shouldUseScreenshot,
        answerMetaInfo: this.state.answerMetaInfo,
        codeSnippets: this.state.codeSnippets
      },
      annotationType: this.props.annotationType,
      type: type,
      timer: {
        startAnnotationTimestamp: this.props.timer.startTimestamp,
        finishAnnotationTimestamp: this.props.timer.endTimestamp,
        saveAnnotationTimestamp: saveAnnotationTimestamp,
        annotationDuration:
          this.props.timer.endTimestamp - this.props.timer.startTimestamp,
        totalDuration: saveAnnotationTimestamp - this.props.timer.startTimestamp
      }
    };

    chrome.runtime.sendMessage({
      msg: 'CREATE_NEW_ANNOTATION_BY_TOOLTIP_BUTTON_CLICKED',
      payload
    });

    // console.log(payload.timer.annotationDuration);
    // console.log(payload.timer.totalDuration);

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
