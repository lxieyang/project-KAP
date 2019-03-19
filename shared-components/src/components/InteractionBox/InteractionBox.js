/* global chrome */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasShareSquare from '@fortawesome/fontawesome-free-solid/faShareSquare';
// import fasLink from '@fortawesome/fontawesome-free-solid/faLink';
import fasSave from '@fortawesome/fontawesome-free-solid/faSave';
// import hamburger from '@fortawesome/fontawesome-free-solid/faBars';
// import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import fasDelete from '@fortawesome/fontawesome-free-solid/faTimes';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasPuzzlePiece from '@fortawesome/fontawesome-free-solid/faPuzzlePiece';
import fasListAlt from '@fortawesome/fontawesome-free-solid/faListAlt';
import fasPaperPlane from '@fortawesome/fontawesome-free-solid/faPaperPlane';
import fasMore from '@fortawesome/fontawesome-free-solid/faEllipsisV';
import Popover from 'react-tiny-popover';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import ThumbV1 from '../../components/UI/Thumbs/ThumbV1/ThumbV1';
import QuestionMark from '../../components/UI/Thumbs/QuestionMark/QuestionMark';
import Input from '../../components/UI/Input/Input';
import styles from './InteractionBox.css';
import { tasksRef, currentTaskIdRef } from '../../firebase/index';
import { SNIPPET_TYPE } from '../../shared/constants';
import { sortBy, reverse } from 'lodash';
import * as FirebaseStore from '../../firebase/store';
import {
  openLinkInTextEditorExtension,
  getFirstNWords,
  getFirstSentence
} from '../../shared/utilities';
import APP_LOGO from '../../assets/images/icon-128.png';

import OptionPiece from './Components/OptionPiece/OptionPiece';
import ReactTooltip from 'react-tooltip';

const dummyText = 'Please select some text';
const dummyHtml = [`<p>Please lasso select some text</p>`];

const selectKeyCode = 18;

class interactionBox extends Component {
  // update state with :
  // - highlightedText
  // - candidateOptions
  state = {
    showoff: this.props.showoff,
    mode: this.props.mode !== undefined ? this.props.mode : 'NEW',
    id: this.props.id !== undefined ? this.props.id : '',
    type: this.props.type !== undefined ? this.props.type : SNIPPET_TYPE.LASSO,
    url: this.props.url !== undefined ? this.props.url : '',
    postTags: this.props.postTags !== undefined ? this.props.postTags : [],
    htmls: this.props.htmls !== undefined ? this.props.htmls : dummyHtml,
    snippetDimension:
      this.props.originalDimensions !== undefined
        ? this.props.originalDimensions
        : null,
    selectedText:
      this.props.selectedText !== undefined
        ? this.props.selectedText
        : dummyText,
    codeSnippetTexts:
      this.props.codeSnippetTexts !== undefined
        ? this.props.codeSnippetTexts
        : [],
    codeSnippetHTMLs:
      this.props.codeSnippetHTMLs !== undefined
        ? this.props.codeSnippetHTMLs
        : [],
    existingOptions: [],
    existingRequirements: [],
    notes: this.props.notes !== undefined ? this.props.notes : '',
    title:
      this.props.title !== undefined
        ? this.props.title
        : getFirstSentence(this.props.selectedText),
    autoSuggestedTitle:
      this.props.autoSuggestedTitle !== undefined
        ? this.props.autoSuggestedTitle
        : true,
    used: this.props.used !== undefined ? this.props.used : [],
    app_logo_url: APP_LOGO,

    inputSource: 'OP',
    inputValue: '',
    canSubmit: false
  };

  constructor(props) {
    super(props);
    this.onMouseUp = this.selectTextListener.bind(this);
    this.onKeyup = this.keyUpListener.bind(this);
    this.onKeyDown = this.keyDownListener.bind(this);
    this.onCopy = this.copyCodeListener.bind(this);
  }

  updateOptionName = (id, name) => {
    FirebaseStore.updateOptionName(id, name);
  };

  switchStarStatusOfOption = id => {
    FirebaseStore.switchStarStatusOfAnOptionWithId(id);
  };

  componentDidMount() {
    if (chrome.extension !== undefined) {
      this.setState({
        app_logo_url: chrome.extension.getURL(APP_LOGO)
      });
    }
    if (
      (this.props.specificPieceId !== undefined &&
        this.props.specificPieceId !== null) ||
      this.props.showoff
    ) {
      // reviewing

      let transformedOptions = [];
      let transformedRequiremennts = [];
      for (let rqKey in this.props.requirements) {
        transformedRequiremennts.push({
          id: rqKey,
          ...this.props.requirements[rqKey]
        });
      }
      transformedRequiremennts = sortBy(transformedRequiremennts, ['order']);

      for (let opKey in this.props.options) {
        let attitudeList = this.props.attitudeList;
        if (attitudeList !== undefined) {
          let attitudeRequirementPairs =
            attitudeList[opKey] !== undefined ? attitudeList[opKey] : {};
          transformedOptions.push({
            id: opKey,
            starred: this.props.options[opKey].starred,
            name: this.props.options[opKey].name,
            active: false,
            attitudeRequirementPairs: attitudeRequirementPairs
          });
        } else {
          transformedOptions.push({
            id: opKey,
            starred: this.props.options[opKey].starred,
            name: this.props.options[opKey].name,
            active: false,
            attitudeRequirementPairs: {}
          });
        }
      }
      transformedOptions = reverse(sortBy(transformedOptions, ['active']));
      this.setState({
        existingOptions: transformedOptions,
        existingRequirements: transformedRequiremennts
      });
    } else {
      // working
      currentTaskIdRef.on('value', snapshot => {
        let taskId = snapshot.val();

        tasksRef.child(taskId + '/options').on('value', dataOptions => {
          tasksRef
            .child(taskId + '/requirements')
            .on('value', dataRequirements => {
              let transformedRequiremennts = [];
              dataRequirements.forEach(rqSnapshpt => {
                transformedRequiremennts.push({
                  ...rqSnapshpt.val(),
                  id: rqSnapshpt.key
                });
              });
              transformedRequiremennts = sortBy(transformedRequiremennts, [
                'order'
              ]);
              if (this.state.mode !== 'UPDATE') {
                // new ones
                tasksRef
                  .child(taskId + '/currentOptionId')
                  .once('value', databack => {
                    let currentOptionId = databack.val();
                    let transformedOptions = [];
                    dataOptions.forEach(opSnapshot => {
                      transformedOptions.push({
                        id: opSnapshot.key,
                        starred: opSnapshot.val().starred,
                        name: opSnapshot.val().name,
                        active: opSnapshot.key === currentOptionId,
                        attitudeRequirementPairs: {}
                      });
                    });
                    transformedOptions = reverse(
                      sortBy(transformedOptions, ['active', 'id'])
                    );
                    this.setState({
                      existingOptions: transformedOptions,
                      existingRequirements: transformedRequiremennts
                    });
                  });
              } else {
                // with existing one
                let transformedOptions = [];
                dataOptions.forEach(opSnapshot => {
                  let opKey = opSnapshot.key;
                  let attitudeList = this.props.attitudeList;
                  if (attitudeList !== undefined) {
                    let attitudeRequirementPairs =
                      attitudeList[opKey] !== undefined
                        ? attitudeList[opKey]
                        : {};
                    transformedOptions.push({
                      id: opKey,
                      starred: opSnapshot.val().starred,
                      name: opSnapshot.val().name,
                      active: false,
                      attitudeRequirementPairs: attitudeRequirementPairs
                    });
                  } else {
                    transformedOptions.push({
                      id: opKey,
                      starred: opSnapshot.val().starred,
                      name: opSnapshot.val().name,
                      active: false,
                      attitudeRequirementPairs: {}
                    });
                  }
                });
                transformedOptions = reverse(
                  sortBy(transformedOptions, ['id'])
                );
                this.setState({
                  existingOptions: transformedOptions,
                  existingRequirements: transformedRequiremennts
                });
              }
            });
        });
      });
    }

    window.addEventListener('mouseup', this.onMouseUp, false);
    window.addEventListener('keyup', this.onKeyup, false);
    window.addEventListener('keydown', this.onKeyDown, false);
    window.addEventListener('copy', this.onCopy, false);
  }

  updateLayoutAccordingToWindow = () => {
    let boxHeight = this.interactionBoxContent.clientHeight;
    let quoteHeight = this.interactionBoxSelectedText.clientHeight;
    let quoteRealHeight = this.interactionBoxSelectedText.scrollHeight;
    let tableHeight = this.interactionBoxOptionList.clientHeight;
    let tableRealHeight = this.interactionBoxOptionList.scrollHeight;
    let windowHeight = window.innerHeight;
    let windowCutOffHeight = windowHeight * 0.95;

    let newTableHeight = tableHeight;
    if (tableRealHeight >= tableHeight) {
      newTableHeight = Math.floor(
        windowCutOffHeight - boxHeight + tableRealHeight
      );
      newTableHeight =
        boxHeight - tableHeight + newTableHeight > windowCutOffHeight
          ? Math.floor(windowCutOffHeight - boxHeight + tableHeight)
          : newTableHeight;
      this.interactionBoxOptionList.style.maxHeight = newTableHeight + 'px';
    }
  };

  UNSAFE_componentWillUpdate() {
    if (
      this.state.existingOptions !== [] &&
      this.state.existingRequirements !== []
    ) {
      // this.updateLayoutAccordingToWindow();
    }
  }

  componentWillUnmount() {
    // console.log('unmount interaction box');
    window.removeEventListener('mouseup', this.onMouseUp, false);
    window.removeEventListener('keyup', this.onKeyup, false);
    window.removeEventListener('keydown', this.onKeyDown, false);
    window.removeEventListener('copy', this.onCopy, false);
  }

  copyCodeListener() {
    console.log('copied!');
    let payload = {
      title: this.state.title,
      content: window.getSelection().toString(),
      originalCodeSnippet: this.state.codeSnippetTexts,
      notes: this.state.notes,
      url: this.state.url,
      existingOptions: this.state.existingOptions,
      existingRequirements: this.state.existingRequirements,
      userId: window.userId,
      taskId: window.currentTaskId,
      taskName: window.taskName,
      pieceId: this.state.id,
      timestamp: new Date().toString()
    };
    FirebaseStore.setCopyData(payload);
  }

  keyDownListener(event) {
    if (event.keyCode === selectKeyCode) {
      this.hotKeyIsDown = true;
    }
  }

  selectTextListener(event) {
    if (this.hotKeyIsDown) {
      let selection = window.getSelection();
      // console.log(selection.containsNode(document.querySelector('#interaction-box-editable-selected-text'), true));
      // console.log(window.getSelection().toString());
      if (
        selection.containsNode(
          document.querySelector('#interaction-box-editable-selected-text'),
          true
        )
      ) {
        this.setState({
          title: selection.toString(),
          autoSuggestedTitle: false
        });
      }
    }
  }

  attitudeSwitchHandler = (event, idx, intendedFor) => {
    // event.preventDefault();
    let targetOption = { ...this.state.existingOptions[idx] };
    if (intendedFor === 'good') {
      if (targetOption.attitude === true) {
        targetOption.attitude = null;
        targetOption.active = false;
      } else {
        targetOption.attitude = true;
        targetOption.active = true;
      }
    } else if (intendedFor === 'bad') {
      if (targetOption.attitude === false) {
        targetOption.attitude = null;
        targetOption.active = false;
      } else {
        targetOption.attitude = false;
        targetOption.active = true;
      }
    } else if (intendedFor === null) {
      if (targetOption.attitude === null && targetOption.active) {
        targetOption.attitude = null;
        targetOption.active = false;
      } else {
        targetOption.attitude = null;
        targetOption.active = true;
      }
    }
    let updatedOptions = [...this.state.existingOptions];
    updatedOptions[idx] = targetOption;
    this.setState({ existingOptions: updatedOptions });
  };

  attitudeChangeHandler = (event, optionId, requirementId, intendedFor) => {
    if (this.props.showoff) {
      return;
    }
    // find idx of target option
    const { existingOptions } = this.state;
    let idx = 0;
    let targetOption = {};
    for (; idx < existingOptions.length; idx++) {
      if (existingOptions[idx].id === optionId) {
        targetOption = { ...existingOptions[idx] }; // clone
        break;
      }
    }
    // add attitude / requirement pair to it
    let attitudeRequirementPairs = targetOption.attitudeRequirementPairs;
    switch (intendedFor) {
      case 'good':
        if (attitudeRequirementPairs[requirementId] === 'good') {
          delete attitudeRequirementPairs[requirementId];
        } else {
          attitudeRequirementPairs[requirementId] = 'good';
        }
        break;
      case 'bad':
        if (attitudeRequirementPairs[requirementId] === 'bad') {
          delete attitudeRequirementPairs[requirementId];
        } else {
          attitudeRequirementPairs[requirementId] = 'bad';
        }
        break;
      case 'idk':
        if (attitudeRequirementPairs[requirementId] === 'idk') {
          delete attitudeRequirementPairs[requirementId];
        } else {
          attitudeRequirementPairs[requirementId] = 'idk';
        }
        break;
      default:
        break;
    }

    // update state
    // console.log(targetOption);
    let updatedExistingOptions = [...existingOptions];
    updatedExistingOptions[idx] = targetOption;
    this.setState({ existingOptions: updatedExistingOptions });
  };

  optionSwitchHandler = (event, idx) => {
    // event.preventDefault();
    let targetOption = { ...this.state.existingOptions[idx] };
    targetOption.active = !targetOption.active;
    targetOption.attitude = null;
    let updatedOptions = [...this.state.existingOptions];
    updatedOptions[idx] = targetOption;
    this.setState({ existingOptions: updatedOptions });
  };

  inputChangedHandler = event => {
    this.setState({ notes: event.target.value });
  };

  closeBoxHandler = event => {
    if (this.props.clip !== undefined) {
      this.props.clip();
    }
  };

  switchStarStatusOfRequirement = id => {
    FirebaseStore.switchStarStatusOfARequirementWithId(id);
  };

  submitPieceHandler = event => {
    // console.log(this.state.htmls);
    // console.log(this.state.selectedText);
    if (this.state.htmls.length === 0 || this.state.selectedText === '') {
      alert('Please make sure you clipped something before submiting.');
      return;
    }

    event.preventDefault();
    let piece = {
      timestamp: new Date().getTime(),
      url: this.state.url,
      type: this.state.type,
      notes: this.state.notes,
      htmls: this.state.htmls,
      postTags: this.state.postTags,
      originalDimensions: this.state.snippetDimension,
      codeSnippetHTMLs: this.state.codeSnippetHTMLs,
      codeSnippetTexts: this.state.codeSnippetTexts,
      title: this.state.title,
      autoSuggestedTitle: this.state.autoSuggestedTitle,
      texts: this.state.selectedText,
      selected: false
    };

    let attitudeList = {};
    for (let op of this.state.existingOptions) {
      attitudeList[op.id] = op.attitudeRequirementPairs;
    }
    piece.attitudeList = attitudeList;

    // console.log(piece);
    if (this.state.mode !== 'UPDATE') {
      FirebaseStore.addAPieceToCurrentTask(piece);
    } else {
      FirebaseStore.updateAPieceWithId(this.props.id, piece);
    }

    this.setState({ canSubmit: true });

    if (this.props.clip !== undefined) {
      setTimeout(() => {
        this.props.clip();
      }, 300);
    }
  };

  getHTML() {
    let htmlString = ``;
    for (let html of this.state.htmls) {
      htmlString += html;
    }
    return { __html: htmlString };
  }

  titleInputChangeHandler = event => {
    this.setState({
      title: event.target.value,
      autoSuggestedTitle: false
    });
  };

  submitNewlyDroppedText(data, type) {
    type === 'OP'
      ? FirebaseStore.addAnOptionForCurrentTask(data)
      : FirebaseStore.addARequirementForCurrentTask(data);
  }

  submitNewlyAddedItem(type) {
    if (type === 'OP') {
      // FirebaseStore.addAnOptionForCurrentTask(document.querySelector('#add-option-in-piece-input').value.trim());
      // querySelector fails to find input source content in main page snippets, so we used ReactDOM instead
      // console.log(this.optionInput.value);
      FirebaseStore.addAnOptionForCurrentTask(this.optionInput.value);
      // console.log('submitted',this.optionInput.value);
      this.optionInput.value = '';
      this.setState({ inputValue: '' });
      // document.querySelector('#add-option-in-piece-input').value = "";
    } else {
      FirebaseStore.addARequirementForCurrentTask(this.CriterionInput.value);
      this.CriterionInput.value = '';
      this.setState({ inputValue: '' });
    }
  }

  keyUpListener(event) {
    if (event.key === 'Enter') {
      this.submitNewlyAddedItem(this.state.inputSource);
    }
    if (event.keyCode === selectKeyCode) {
      this.hotKeyIsDown = false;
    }
  }

  addButtonClicked = (event, type) => {
    this.submitNewlyAddedItem(type);
  };

  switchInputSourceHandler = (event, type) => {
    this.setState({
      inputSource: type,
      inputValue: event.target.value
    });
  };

  deleteOption = (optionId, optionName) => {
    var surety = window.confirm(
      `Are you sure you want to delete "${optionName}"?`
    );
    if (surety === true) {
      FirebaseStore.deleteOptionWithId(optionId);
    }
  };

  allowDrop = event => {
    event.preventDefault();
  };

  render() {
    const { existingOptions, existingRequirements, showoff } = this.state;

    let addOptionRequirement = (
      <div className={styles.AddOptionRowContainer}>
        <div className={styles.AddSomthingInputContainer}>
          <div>
            <FontAwesomeIcon icon={fasListAlt} /> &nbsp;
            <input
              disabled={showoff !== true ? null : true}
              ref={input => {
                this.optionInput = input;
              }}
              id="add-option-in-piece-input"
              placeholder={'Add an Option'}
              onInput={event => this.switchInputSourceHandler(event, 'OP')}
            />
          </div>
          <div className={styles.PromptToHitEnter}>
            {this.state.inputSource === 'OP' && this.state.inputValue !== '' ? (
              <span>Press Enter &#x23ce; when done</span>
            ) : (
              ' '
            )}
          </div>
        </div>

        <div className={styles.AddSomthingInputContainer}>
          <div>
            <FontAwesomeIcon icon={fasFlagCheckered} /> &nbsp;
            <input
              disabled={showoff !== true ? null : true}
              ref={input => {
                this.CriterionInput = input;
              }}
              id="add-requirement-in-piece-input"
              placeholder={'Add a Criterion / Feature'}
              onInput={event => this.switchInputSourceHandler(event, 'RQ')}
            />
          </div>
          <div className={styles.PromptToHitEnter}>
            {this.state.inputSource === 'RQ' && this.state.inputValue !== '' ? (
              <span>Press Enter &#x23ce; when done</span>
            ) : (
              ' '
            )}
          </div>
        </div>
      </div>
    );

    let experimentalOptionList = (
      <div
        className={styles.OptionList}
        id="interaction-box-option-list"
        ref={node => (this.interactionBoxOptionList = node)}
      >
        <table className={styles.Table}>
          <tbody>
            <tr>
              <td />
              <td>
                <div
                  className={styles.TableTitle}
                  onDrop={event =>
                    this.submitNewlyDroppedText(
                      event.dataTransfer.getData('text'),
                      'OP'
                    )
                  }
                  onDragOver={event => this.allowDrop(event)}
                >
                  <span>
                    <FontAwesomeIcon icon={fasListAlt} /> &nbsp;Options
                  </span>
                </div>
              </td>
              <td />
              <td>
                <div
                  className={styles.TableTitle}
                  onDrop={event =>
                    this.submitNewlyDroppedText(
                      event.dataTransfer.getData('text'),
                      'RQ'
                    )
                  }
                  onDragOver={event => this.allowDrop(event)}
                >
                  <span>
                    <FontAwesomeIcon icon={fasFlagCheckered} /> &nbsp; Criteria
                    / Features
                  </span>
                </div>
              </td>
            </tr>
            {existingOptions.map((op, idx) => {
              return (
                <tr key={op.id} className={styles.OptionTableRow}>
                  <td />
                  <td>
                    <div className={styles.OptionRowContainer}>
                      <OptionPiece
                        showoff={showoff}
                        op={op}
                        hasAttitudes={
                          Object.keys(op.attitudeRequirementPairs).length > 0
                        }
                        updateOptionName={this.updateOptionName}
                        switchStarStatusOfOption={this.switchStarStatusOfOption}
                        deleteOptionWithId={this.deleteOption}
                      />
                    </div>
                  </td>

                  <td />

                  <td>
                    <div className={styles.RequirementsContainer}>
                      {existingRequirements
                        .filter(rq => rq.visibility !== false)
                        .map((rq, idx) => {
                          let attitude = op.attitudeRequirementPairs[rq.id];
                          let attitudeDisplay = null;
                          let attitudeText = null;
                          switch (attitude) {
                            case 'good':
                              attitudeDisplay = <ThumbV1 type={'up'} />;
                              attitudeText = 'Good!';
                              break;
                            case 'bad':
                              attitudeDisplay = <ThumbV1 type={'down'} />;
                              attitudeText = 'Bad.';
                              break;
                            case 'idk':
                              attitudeDisplay = <QuestionMark />;
                              attitudeText = `I don't know yet...`;
                              break;
                            default:
                              break;
                          }
                          return (
                            <div
                              key={idx}
                              className={[
                                styles.Requirement,
                                attitude === undefined
                                  ? styles.InactiveRequirement
                                  : null
                              ].join(' ')}
                            >
                              <div
                                className={[
                                  styles.RequirementStar,
                                  rq.starred === true ? styles.ActiveStar : null
                                ].join(' ')}
                              >
                                {/* onClick={(event) => this.switchStarStatusOfRequirement(rq.id)} */}
                                <FontAwesomeIcon icon={fasStar} />
                              </div>
                              <div
                                title={attitudeText}
                                className={styles.RequirementAttitude}
                                onClick={event =>
                                  this.attitudeChangeHandler(
                                    event,
                                    op.id,
                                    rq.id,
                                    attitude
                                  )
                                }
                              >
                                {attitudeDisplay}
                              </div>
                              <div className={styles.RequirementName}>
                                <a data-tip data-for={`${op.id}-${rq.id}`}>
                                  {getFirstNWords(4, rq.name)}
                                </a>
                                <ReactTooltip
                                  id={`${op.id}-${rq.id}`}
                                  type="dark"
                                  effect="solid"
                                  place={'bottom'}
                                  className={
                                    styles.RequirementNameTooltipContainer
                                  }
                                >
                                  {rq.name}
                                </ReactTooltip>
                              </div>

                              <div
                                className={styles.RequirementAttitudeContainer}
                              >
                                <div
                                  className={[
                                    styles.RequirementAttitudeThumbContainer
                                  ].join(' ')}
                                  onClick={event =>
                                    this.attitudeChangeHandler(
                                      event,
                                      op.id,
                                      rq.id,
                                      'good'
                                    )
                                  }
                                >
                                  <ThumbV1 type={'up'} />
                                </div>

                                <div
                                  className={[
                                    styles.RequirementAttitudeThumbContainer
                                  ].join(' ')}
                                  onClick={event =>
                                    this.attitudeChangeHandler(
                                      event,
                                      op.id,
                                      rq.id,
                                      'idk'
                                    )
                                  }
                                >
                                  <QuestionMark />
                                </div>

                                <div
                                  className={[
                                    styles.RequirementAttitudeThumbContainer
                                  ].join(' ')}
                                  onClick={event =>
                                    this.attitudeChangeHandler(
                                      event,
                                      op.id,
                                      rq.id,
                                      'bad'
                                    )
                                  }
                                >
                                  <ThumbV1 type={'down'} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    let snippet = null;
    if (this.state.type === SNIPPET_TYPE.SELECTION) {
      snippet = (
        <div
          ref={node => (this.interactionBoxSelectedText = node)}
          id="interaction-box-editable-selected-text"
          contentEditable={false}
          suppressContentEditableWarning={true}
          className={styles.selectedText}
          style={{
            width:
              this.state.snippetDimension !== null
                ? this.state.snippetDimension.width + 'px'
                : '600px'
          }}
        >
          {this.state.selectedText}
        </div>
      );
    } else if (
      this.state.type === SNIPPET_TYPE.LASSO ||
      this.state.type === SNIPPET_TYPE.POST_SNAPSHOT ||
      this.state.type === SNIPPET_TYPE.COPIED_PIECE
    ) {
      snippet = (
        <div
          ref={node => (this.interactionBoxSelectedText = node)}
          id="interaction-box-editable-selected-text"
          contentEditable={false}
          suppressContentEditableWarning={true}
          className={styles.snappedText}
          style={{
            width:
              this.state.snippetDimension !== null
                ? this.state.snippetDimension.width + 'px'
                : '600px'
          }}
          dangerouslySetInnerHTML={this.getHTML()}
        />
      );
    }

    return (
      // console.log(this.state);
      <div
        ref={node => (this.interactionBoxContent = node)}
        id="interaction-box-content"
        className={styles.InteractionBox}
      >
        <div
          id="interaction-box-header"
          className={
            this.state.mode === 'NEW'
              ? styles.InteractionBoxDragHandle // may want to enable auto-scroll on this draggable element
              : styles.InteractionBoxTopBar
          }
        >
          <div
            title={'Close'}
            className={styles.CloseBoxContainer}
            onClick={event => this.closeBoxHandler(event)}
          >
            &#10005;
          </div>
          <div className={styles.TitleContainer}>
            <span className={styles.TitleLabel}>Title:</span>
            <input
              type="text"
              disabled={showoff !== true ? null : true}
              // title={showoff !== true ? 'Click to edit' : false}
              value={this.state.title}
              placeholder={'Click to add a title'}
              className={styles.TitleInput}
              onChange={event => this.titleInputChangeHandler(event)}
            />{' '}
            &nbsp;
          </div>
        </div>

        <div className={styles.SnippetContainer}>{snippet}</div>

        {experimentalOptionList}

        {this.props.specificPieceId === undefined ||
        this.props.specificPieceId === null
          ? addOptionRequirement
          : null}

        <div className={styles.FooterContainer}>
          <div className={styles.NoteContainer}>
            <Input
              showoff={showoff}
              style={{ height: '100%' }}
              elementType="textarea"
              elementConfig={{ placeholder: 'Type some notes' }}
              value={this.state.notes}
              changed={this.inputChangedHandler}
            />
          </div>

          <div className={styles.ClipButtonContainer}>
            <button
              title="Save this Snippet"
              className={styles.ClipButton}
              onClick={event => this.submitPieceHandler(event)}
              disabled={showoff !== true ? null : true}
            >
              <div className={styles.ButtonTextContainer}>
                <img src={this.state.app_logo_url} alt={'Save Snippet'} />
                <span>{this.state.canSubmit ? 'Saved!' : 'Save Snippet'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default interactionBox;
