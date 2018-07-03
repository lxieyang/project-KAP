import React, { Component }from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasShareSquare from '@fortawesome/fontawesome-free-solid/faShareSquare';
// import fasLink from '@fortawesome/fontawesome-free-solid/faLink';
import fasSave from '@fortawesome/fontawesome-free-solid/faSave';
import hamburger from '@fortawesome/fontawesome-free-solid/faBars';
// import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasListAlt from '@fortawesome/fontawesome-free-solid/faListAlt';
import fasPaperPlane from '@fortawesome/fontawesome-free-solid/faPaperPlane';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import ThumbV1 from '../../components/UI/Thumbs/ThumbV1/ThumbV1';
import QuestionMark from '../../components/UI/Thumbs/QuestionMark/QuestionMark';
import Input from '../../components/UI/Input/Input';
import styles from './InteractionBox.css';
import {
  tasksRef,
  currentTaskIdRef
} from '../../firebase/index';
import { SNIPPET_TYPE } from '../../shared/constants';
import { sortBy, reverse } from 'lodash';
import * as FirebaseStore from '../../firebase/store';
import { openLinkInTextEditorExtension, getFirstNWords, getFirstSentence } from '../../shared/utilities';

const dummyText = 'Please select some text';
const dummyHtml = [`<p>Please lasso select some text</p>`];

const selectKeyCode = 18;

class interactionBox extends Component {
  // update state with :
  // - highlightedText
  // - candidateOptions
  state = {
    mode: this.props.mode !== undefined ? this.props.mode : 'NEW',
    id: this.props.id !== undefined ? this.props.id : '',
    type: this.props.type !== undefined ? this.props.type : SNIPPET_TYPE.LASSO,
    url: this.props.url !== undefined ? this.props.url : '',
    postTags: this.props.postTags !== undefined ? this.props.postTags : [],
    htmls: this.props.htmls !== undefined ? this.props.htmls : dummyHtml,
    snippetDimension: this.props.originalDimensions !== undefined ? this.props.originalDimensions : null,
    selectedText: this.props.selectedText !== undefined ? this.props.selectedText : dummyText,
    codeSnippetTexts: this.props.codeSnippetTexts !== undefined ? this.props.codeSnippetTexts : [],
    codeSnippetHTMLs: this.props.codeSnippetHTMLs !== undefined ? this.props.codeSnippetHTMLs : [],
    existingOptions: [],
    existingRequirements: [],
    notes: this.props.notes !== undefined ? this.props.notes : '',
    title: this.props.title !== undefined ? this.props.title : getFirstSentence(this.props.selectedText),
    autoSuggestedTitle: this.props.autoSuggestedTitle !== undefined ? this.props.autoSuggestedTitle : true,
    used: this.props.used !== undefined ? this.props.used : [],

    inputSource: 'OP',
    canSubmit: false
  }

  constructor (props) {
    super(props);
    this.onMouseUp = this.selectTextListener.bind(this);
    this.onKeyup = this.keyUpListener.bind(this);
    this.onKeyDown = this.keyDownListener.bind(this);
    this.onCopy = this.copyCodeListener.bind(this);
  }

  componentDidMount() {
    if (this.props.specificPieceId !== undefined && this.props.specificPieceId !== null) {
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
        if(attitudeList !== undefined) {
          let attitudeRequirementPairs = attitudeList[opKey] !== undefined ? attitudeList[opKey] : {};
          transformedOptions.push({
            id: opKey,
            name: this.props.options[opKey].name,
            active: false,
            attitudeRequirementPairs: attitudeRequirementPairs
          });
        } else {
          transformedOptions.push({
            id: opKey,
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

      currentTaskIdRef.on('value', (snapshot) => {
        tasksRef.child(snapshot.val() + '/options').on('value', (dataOptions) => {
          tasksRef.child(snapshot.val() + '/requirements').on('value', (dataRequirements) => {
            let transformedRequiremennts = [];
            dataRequirements.forEach(rqSnapshpt => {
              transformedRequiremennts.push({
                ...rqSnapshpt.val(),
                id: rqSnapshpt.key
              });
            });
            transformedRequiremennts = sortBy(transformedRequiremennts, ['order']);
            if (this.state.mode !== 'UPDATE') {   // new ones
              tasksRef.child(snapshot.val() + '/currentOptionId').once('value', (databack) => {
                let currentOptionId = databack.val();
                let transformedOptions = [];
                dataOptions.forEach((opSnapshot) => {
                  transformedOptions.push({
                    id: opSnapshot.key,
                    name: opSnapshot.val().name,
                    active: opSnapshot.key === currentOptionId,
                    attitudeRequirementPairs: {}
                  });
                });
                transformedOptions = reverse(sortBy(transformedOptions, ['active', 'id']));
                this.setState({
                  existingOptions: transformedOptions,
                  existingRequirements: transformedRequiremennts
                });
              });
            } else {  // with existing one
              let transformedOptions = [];
              dataOptions.forEach((opSnapshot) => {
                let opKey = opSnapshot.key;
                let attitudeList = this.props.attitudeList;
                if(attitudeList !== undefined) {
                  let attitudeRequirementPairs = attitudeList[opKey] !== undefined ? attitudeList[opKey] : {};
                  transformedOptions.push({
                    id: opKey,
                    name: opSnapshot.val().name,
                    active: false,
                    attitudeRequirementPairs: attitudeRequirementPairs
                  });
                } else {
                  transformedOptions.push({
                    id: opKey,
                    name: opSnapshot.val().name,
                    active: false,
                    attitudeRequirementPairs: {}
                  });
                }
              });
              transformedOptions = reverse(sortBy(transformedOptions, ['id']));
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

  componentWillUnmount () {
    // console.log('unmount interaction box');
    window.removeEventListener('mouseup', this.onMouseUp, false);
    window.removeEventListener('keyup', this.onKeyup, false);
    window.removeEventListener('keydown', this.onKeyDown, false);
    window.removeEventListener('copy', this.onCopy, false);
  }

  copyCodeListener () {
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
      timestamp: (new Date()).toString()
    };
    FirebaseStore.setCopyData(payload);
  }

  keyDownListener (event) {
    if (event.keyCode === selectKeyCode) {
      this.hotKeyIsDown = true;
    }
  }

  selectTextListener (event) {
    if (this.hotKeyIsDown) {
      let selection = window.getSelection();
      // console.log(selection.containsNode(document.querySelector('#interaction-box-editable-selected-text'), true));
      // console.log(window.getSelection().toString());
      if (selection.containsNode(document.querySelector('#interaction-box-editable-selected-text'), true)) {
        this.setState({
          title: selection.toString(),
          autoSuggestedTitle: false
        });
      }
    }
  }

  attitudeSwitchHandler = (event, idx, intendedFor) => {
    // event.preventDefault();
    let targetOption = {...this.state.existingOptions[idx]};
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
    this.setState({existingOptions: updatedOptions});
  }

  attitudeChangeHandler = (event, optionId, requirementId, intendedFor) => {
    // find idx of target option
    const { existingOptions }  = this.state
    let idx = 0;
    let targetOption = {};
    for (; idx < existingOptions.length; idx++) {
      if (existingOptions[idx].id === optionId) {
        targetOption = {...existingOptions[idx]}; // clone
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
    this.setState({existingOptions: updatedExistingOptions});

  }

  optionSwitchHandler = (event, idx) => {
    // event.preventDefault();
    let targetOption = {...this.state.existingOptions[idx]};
    targetOption.active = !targetOption.active;
    targetOption.attitude = null;
    let updatedOptions = [...this.state.existingOptions];
    updatedOptions[idx] = targetOption;
    this.setState({existingOptions: updatedOptions});
  }

  inputChangedHandler = (event) => {
    this.setState({notes: event.target.value});
  }

  closeBoxHandler = (event) => {
    if (this.props.clip !== undefined){
      this.props.clip();
    }
  }

  switchStarStatusOfRequirement = (id) => {
    FirebaseStore.switchStarStatusOfARequirementWithId(id);
  }

  submitPieceHandler = (event) => {
    console.log(this.state.htmls);
    console.log(this.state.selectedText);
    if (this.state.htmls.length === 0 || this.state.selectedText === '') {
      alert('Please make sure you clipped something before submiting.');
      return;
    }

    event.preventDefault();
    let piece = {
      timestamp: (new Date()).getTime(),
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
      texts: this.state.selectedText
    }

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

    this.setState({canSubmit: true});

    if (this.props.clip !== undefined){
      setTimeout(() => {
        this.props.clip();
      }, 1000);
    }
  }

  getHTML () {
    let htmlString = ``;
    for (let html of this.state.htmls) {
      htmlString += html;
    }
    return {__html: htmlString};
  }

  titleInputChangeHandler = (event) => {
    this.setState({
      title: event.target.value,
      autoSuggestedTitle: false
    });
  }

  submitNewlyAddedItem(type) {
    if (type === 'OP') {
      FirebaseStore.addAnOptionForCurrentTask(document.querySelector('#add-option-in-piece-input').value.trim());
      document.querySelector('#add-option-in-piece-input').value = "";
    } else {
      FirebaseStore.addARequirementForCurrentTask(document.querySelector('#add-requirement-in-piece-input').value.trim());
      document.querySelector('#add-requirement-in-piece-input').value = "";
    }
  }

  keyUpListener (event) {
    if (event.key === 'Enter') {
      this.submitNewlyAddedItem(this.state.inputSource);
    }
    if (event.keyCode === selectKeyCode) {
      this.hotKeyIsDown = false;
    }
  }

  addButtonClicked = (event, type) => {
    this.submitNewlyAddedItem(type);
  }

  switchInputSourceHandler = (event, type) => {
    this.setState({inputSource: type});
  }

  deleteOption = (event, optionId) => {
    FirebaseStore.deleteOptionWithId(optionId);
  }

  render () {

    const { existingOptions, existingRequirements } = this.state;

    let addOptionRequirement = (
      <div className={styles.AddOptionRowContainer}>
      <div className={styles.AddSomthingInputContainer}>
      <FontAwesomeIcon icon={fasListAlt}/> &nbsp;
      <input
      id="add-option-in-piece-input"
      placeholder={'Add an Option'}
      onInput={(event) => this.switchInputSourceHandler(event, 'OP')}/> &nbsp;
      <div
      className={styles.AddSomethingButton}
      onClick={(event) => this.addButtonClicked(event, 'OP')}>
      <FontAwesomeIcon icon={fasPaperPlane}/> &nbsp; Add
      </div>
      </div>
      <div
      className={styles.AddSomthingInputContainer}
      onClick={(event) => this.addButtonClicked(event, 'RQ')}>
      <FontAwesomeIcon icon={fasFlagCheckered}/> &nbsp;
      <input
      id="add-requirement-in-piece-input"
      placeholder={'Add a Criterion'}
      onInput={(event) => this.switchInputSourceHandler(event, 'RQ')}
      /> &nbsp;
      <div className={styles.AddSomethingButton}>
      <FontAwesomeIcon icon={fasPaperPlane}/> &nbsp; Add
      </div>
      </div>

      </div>
    );

    let experimentalOptionList = (
      <div className={styles.OptionList}>
      <table className={styles.Table}>
      <tbody>
      <tr>
      <td></td>
      <td>
      <div className={styles.TableTitle}>
      <FontAwesomeIcon icon={fasListAlt}/> &nbsp;Options
      </div>
      </td>
      <td>
      </td>
      <td>
      <div className={styles.TableTitle}>
      <FontAwesomeIcon icon={fasFlagCheckered}/> &nbsp;
      Criteria / Features
      </div>
      </td>
      </tr>
      {existingOptions.map((op, idx) => {
        return (
          <tr key={op.id} className={styles.OptionTableRow}>
          <td>
          {/*
            <div
            title="Delete this option"
            className={styles.DeleteOptionIconContainer}
            onClick={(event) => this.deleteOption(event, op.id)}>
            <FontAwesomeIcon icon={fasTrash} />
            </div>
            */}
            </td>
            <td>
            <div
            className={styles.OptionRowContainer}>
            <span
            className={[styles.Option]}>
            {op.name}
            </span>
            </div>
            </td>
            {/*
              <td>
              <div
              className={[styles.AttitudeThumbContainer, (
              op.attitude === true
              ? styles.Active
              : styles.Inactive
            )].join(' ')}
            onClick={(event) => this.attitudeSwitchHandler(event, idx, 'good')}>
            <ThumbV1 type={'up'}/>
            </div>
            </td>
            <td>
            <div
            className={[styles.AttitudeThumbContainer, (
            op.attitude === false
            ? styles.Active
            : styles.Inactive
          )].join(' ')}
          onClick={(event) => this.attitudeSwitchHandler(event, idx, 'bad')}>
          <ThumbV1 type={'down'}/>
          </div>
          </td>
          <td>
          <div
          className={[styles.AttitudeThumbContainer, (
          op.active && op.attitude === null
          ? styles.Active
          : styles.Inactive
        )].join(' ')}
        onClick={(event) => this.attitudeSwitchHandler(event, idx, null)}>
        <QuestionMark />
        </div>
        </td>
        */}
        <td>
        {/*
          <div className={styles.InTermsOf}>
          is
          </div>
          */}
          </td>
          <td>
          <div className={styles.RequirementsContainer}>
          {existingRequirements.map((rq, idx) => {
            let attitude = op.attitudeRequirementPairs[rq.id];
            let attitudeDisplay = null;
            switch (attitude) {
              case 'good':
              attitudeDisplay = (<ThumbV1 type={'up'} />);
              break;
              case 'bad':
              attitudeDisplay = (<ThumbV1 type={'down'} />);
              break;
              case 'idk':
              attitudeDisplay = (<QuestionMark />);
              break;
              default:
              break;
            }
            return (
              <div
              key={idx}
              title={rq.name}
              className={[styles.Requirement, (
                attitude === undefined
                ? styles.InactiveRequirement
                : null
              )].join(' ')}>
              <div
              className={[styles.RequirementStar, (
                rq.starred === true ? styles.ActiveStar : null
              )].join(' ')}>
              {/* onClick={(event) => this.switchStarStatusOfRequirement(rq.id)} */}
              <FontAwesomeIcon icon={fasStar}/>
              </div>
              <div
              className={styles.RequirementAttitude}
              onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, attitude)}>
              {attitudeDisplay}
              </div>
              <div
              title={rq.name}
              className={styles.RequirementName}>
              {getFirstNWords(4, rq.name)}
              </div>

              <div className={styles.RequirementAttitudeContainer}>
              <div
              className={[styles.RequirementAttitudeThumbContainer].join(' ')}
              onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'good')}>
              <ThumbV1 type={'up'}/>
              </div>

              <div
              className={[styles.RequirementAttitudeThumbContainer].join(' ')}
              onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'bad')}>
              <ThumbV1 type={'down'}/>
              </div>

              <div
              className={[styles.RequirementAttitudeThumbContainer].join(' ')}
              onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'idk')}>
              <QuestionMark />
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
        id="interaction-box-editable-selected-text"
        contentEditable={true}
        suppressContentEditableWarning={true}
        className={styles.selectedText}
        style={{width:
          this.state.snippetDimension !== null
          ? this.state.snippetDimension.width+'px'
          : '600px'}}>
          {this.state.selectedText}
          </div>
        );
      } else if (this.state.type === SNIPPET_TYPE.LASSO || this.state.type === SNIPPET_TYPE.POST_SNAPSHOT  || this.state.type === SNIPPET_TYPE.COPIED_PIECE) {
        snippet = (
          <div
          id="interaction-box-editable-selected-text"
          contentEditable={true}
          suppressContentEditableWarning={true}
          className={styles.snappedText}
          style={{width:
            this.state.snippetDimension !== null
            ? this.state.snippetDimension.width+'px'
            : '600px'}}
            dangerouslySetInnerHTML={this.getHTML()}>
            </div>
          );
        }

        return (
          <div
          id="interaction-box-content"
          className={styles.InteractionBox}>
          {this.state.mode === 'NEW'
          ? <div
          id="interaction-box-header"
          className={styles.InteractionBoxDragHandle}>
          Some space
          <div
          className={styles.CloseBoxContainer}
          onClick={(event) => this.closeBoxHandler(event)}>
          &#10005;
          </div>
          <div style={{display: 'flex', width: '100%', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', width: '80%', alignItems: 'center'}}>
          <span style={{display: 'flex', fontSize: '16px', fontWeight: '600', margin:'20px 10px 10px 20px', color: 'rgba(0,0,0,1)'}}>Title: &nbsp;</span>
          <input
          type="text"
          value={this.state.title}
          placeholder={'Please select to add a title'}
          className={styles.TitleInput}
          onChange={(event) => this.titleInputChangeHandler(event)}/> &nbsp;
          {
            // // this.state.mode === 'NEW' &&
            // this.state.autoSuggestedTitle === true
            // ? <span className={styles.AutoSuggestedBadge}>Auto Suggested</span>
            // : null
          }
          </div>
          {
            this.state.mode !== 'NEW'
            ? <div style={{marginRight: '20px', fontSize: '16px', opacity: '0.6'}}>
            <a target="_blank" href={this.state.url} style={{color: 'black', textDecoration: 'none', fontSize: '13px'}} onClick={(event) => openLinkInTextEditorExtension(event, this.state.url)} title="Open the original page in a new tab"><FontAwesomeIcon icon={fasShareSquare}/> Open in new tab</a>
            </div>
            : null
          }
          </div>

          </div>
          : null
        }

        <div style={{display: 'flex', width: '100%', justifyContent:'space-between', marginTop:'60px', marginBottom: '10px', alignItems: 'flex-end'}}>
        {snippet}
        </div>

        {experimentalOptionList}

        {this.props.specificPieceId === undefined || this.props.specificPieceId === null ? addOptionRequirement : null}


        <div className={styles.FooterContainer}>
        <div className={styles.NoteContainer}>
        <Input
        elementType='textarea'
        elementConfig={{placeholder: 'Type some notes'}}
        value={this.state.notes}
        changed={this.inputChangedHandler}/>
        </div>
        <div className={styles.ClipButtonContainer}>
        <button
        title="Save this Snippet"
        className={styles.ClipButton}
        onClick={(event) => this.submitPieceHandler(event)}
        >
        <div className={styles.CheckmarkContainer}>
        <div className={[styles.Checkmark,
          (
            this.state.canSubmit
            ? styles.CheckmarkSpin
            : null)].join(' ')}></div>
            </div>
            <div className={styles.ButtonTextContainer}>
            <span className={[styles.ButtonText,
              (
                this.state.canSubmit
                ? styles.ButtonTextDisappear
                : null
              )].join(' ')}>
              <FontAwesomeIcon icon={fasSave} className={styles.ClipButtonIcon}/>
              </span>
              </div>

              </button>
              </div>
              </div>

              </div>
            );
          }

        }

        export default interactionBox;
