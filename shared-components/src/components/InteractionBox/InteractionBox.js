import React, { Component }from 'react';

import FontAwesome from 'react-fontawesome';
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
import { openLinkInTextEditorExtension } from '../../shared/utilities';

const dummyText = 'Please select some text';
const dummyHtml = [`<p>Please lasso select some text</p>`];


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
    selectedText: this.props.selectedText ? this.props.selectedText : dummyText,
    codeSnippetTexts: this.props.codeSnippetTexts !== undefined ? this.props.codeSnippetTexts : [],
    codeSnippetHTMLs: this.props.codeSnippetHTMLs !== undefined ? this.props.codeSnippetHTMLs : [],
    existingOptions: [],
    notes: this.props.notes !== undefined ? this.props.notes : '',
    title: this.props.title !== undefined ? this.props.title : '',
    used: this.props.used !== undefined ? this.props.used : [],
    canSubmit: false
  }

  constructor (props) {
    super(props);
    this.onMouseUp = this.selectTextListener.bind(this);
    this.onKeyup = this.addOption.bind(this);
    this.onKeyDown = this.keyDownListener.bind(this);
    this.onCopy = this.copyCodeListener.bind(this);
  }

  componentDidMount() {
    if (this.props.specificPieceId !== null) {
      let transformedOptions = [];
      for (let opKey in this.props.options) {
        let attitudeOptionPairs = this.props.attitudeOptionPairs;
        if(attitudeOptionPairs !== undefined) {
          let matchingPair = attitudeOptionPairs.filter(pair => pair.optionId === opKey);
          let active = matchingPair.length !== 0;
          let attitude = active && matchingPair[0].attitude !== undefined ? matchingPair[0].attitude : null
          transformedOptions.push({
            id: opKey,
            name: this.props.options[opKey].name,
            active: active,
            attitude: attitude
          });
        } else {
          transformedOptions.push({
            id: opKey,
            name: this.props.options[opKey].name,
            active: false,
            attitude: null
          });
        }
      }
      transformedOptions = reverse(sortBy(transformedOptions, ['active']));
      this.setState({existingOptions: transformedOptions});
    } else {
      currentTaskIdRef.on('value', (snapshot) => {
        tasksRef.child(snapshot.val() + '/options').on('value', (data) => {
          if (this.state.mode !== 'UPDATE') {
            tasksRef.child(snapshot.val() + '/currentOptionId').once('value', (databack) => {
              let currentOptionId = databack.val();
              let transformedOptions = [];
              data.forEach((opSnapshot) => {
                transformedOptions.push({
                  id: opSnapshot.key,
                  name: opSnapshot.val().name,
                  active: opSnapshot.key === currentOptionId,
                  attitude: null
                });
              });
              transformedOptions = reverse(sortBy(transformedOptions, ['active']));
              this.setState({existingOptions: transformedOptions});
            });  
          } else {  // with existing one
            let transformedOptions = [];
            data.forEach((opSnapshot) => {
              let opKey = opSnapshot.key;
              let attitudeOptionPairs = this.props.attitudeOptionPairs;
              if(attitudeOptionPairs !== undefined) {
                let matchingPair = attitudeOptionPairs.filter(pair => pair.optionId === opKey);
                let active = matchingPair.length !== 0;
                let attitude = active && matchingPair[0].attitude !== undefined ? matchingPair[0].attitude : null
                transformedOptions.push({
                  id: opKey,
                  name: opSnapshot.val().name,
                  active: active,
                  attitude: attitude
                });
              } else {
                transformedOptions.push({
                  id: opKey,
                  name: opSnapshot.val().name,
                  active: false,
                  attitude: null
                });
              }
            });
            transformedOptions = reverse(sortBy(transformedOptions, ['active']));
            this.setState({existingOptions: transformedOptions});
          }
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
    let msg = {
      secret: 'secret-transmission-from-iframe',
      type: 'COPY_DETECTED',
      payload: {
        title: this.state.title,
        content: window.getSelection().toString(),
        originalCodeSnippet: this.state.codeSnippetTexts,
        notes: this.state.notes,
        url: this.state.url,
        existingOptions: this.state.existingOptions,
        userId: window.userId,
        taskId: window.currentTaskId,
        pieceId: this.state.id
      }
    };
    window.parent.postMessage(JSON.stringify(msg), '*');
    console.log(msg);
  }

  keyDownListener (event) {
    if (event.keyCode === 83) {
      this.hotKeyIsDown = true;
    }
  }

  selectTextListener (event) {
    if (this.hotKeyIsDown) {
      let selection = window.getSelection();
      // console.log(selection.containsNode(document.querySelector('#interaction-box-editable-selected-text'), true));
      // console.log(window.getSelection().toString());
      if (selection.containsNode(document.querySelector('#interaction-box-editable-selected-text'), true)) {
        this.setState({title: selection.toString()});
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

  submitPieceHandler = (event) => {
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
      texts: this.state.selectedText
    }
    let attitudeOptionPairs = [];
    for (let op of this.state.existingOptions) {
      if (op.active) {
        attitudeOptionPairs.push({
          optionId: op.id,
          attitude: op.attitude
        });
      }
    }
    piece.attitudeOptionPairs = attitudeOptionPairs;
    // console.log(piece);
    if (this.state.mode !== 'UPDATE') {
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.ADD_A_PIECE_TO_CURRENT_TASK,
      //   payload: {piece}
      // });
      FirebaseStore.addAPieceToCurrentTask(piece);
    } else {
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.UPDATE_A_PIECE_WITH_ID,
      //   payload: {
      //     id: this.props.id,
      //     piece
      //   }
      // });
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
    this.setState({title: event.target.value});
  }

  addOption (event) {
    if (event.key === 'Enter') {
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.ADD_AN_OPTION_TO_CURRENT_TASK,
      //   payload: {
      //     optionName: document.querySelector('#add-option-in-piece-input').value
      //   }
      // });
      FirebaseStore.addAnOptionForCurrentTask(document.querySelector('#add-option-in-piece-input').value.trim());
      document.querySelector('#add-option-in-piece-input').value = "";
    }
    if (event.keyCode === 83) {
      this.hotKeyIsDown = false;
    }
  }

  deleteOption = (event, optionId) => {
    // chrome.runtime.sendMessage({
    //   msg: actionTypes.DELETE_OPTION_WITH_ID,
    //   payload: {
    //     id: optionId
    //   }
    // });
    FirebaseStore.deleteOptionWithId(optionId);
  }

  render () {

    const { existingOptions } = this.state;

    let addOption = (
      <div className={styles.AddOptionRowContainer}>
        <input id="add-option-in-piece-input" placeholder={'Add an option'} />
      </div>
    );

    let experimentalOptionList = (
      <div className={styles.OptionList}>
        <table className={styles.Table}>
        <tbody>
          {existingOptions.map((op, idx) => {
            return (
              <tr key={op.id} className={styles.OptionTableRow}>
                <td>
                  <div 
                  className={styles.DeleteOptionIconContainer}
                    onClick={(event) => this.deleteOption(event, op.id)}>
                    <FontAwesome name={'trash'} />
                  </div>
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
    } else if (this.state.type === SNIPPET_TYPE.LASSO || this.state.type === SNIPPET_TYPE.POST_SNAPSHOT) {
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
              <FontAwesome name={'arrows-alt'}/>
            </div>
         : null
        }
        <div 
          className={styles.CloseBoxContainer}
          onClick={(event) => this.closeBoxHandler(event)}>
          &#10005;
        </div>
        <div style={{display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', width: '80%', marginBottom: '10px', alignItems: 'center'}}>  
            <span style={{fontWeight: '600'}}>Title: &nbsp;</span>
            <input 
              type="text" 
              value={this.state.title} 
              placeholder={'Please select to add a title'}
              className={styles.TitleInput}
              onChange={(event) => this.titleInputChangeHandler(event)}/>
            
          </div>
          <div style={{marginRight: '20px', fontSize: '16px', opacity: '0.6'}}>
            <a target="_blank" href={this.state.url} style={{color: 'black'}} onClick={(event) => openLinkInTextEditorExtension(event, this.state.url)}><FontAwesome name={'link'}/></a>
          </div>
        </div>
        
        <div style={{display: 'flex', width: '100%', marginBottom: '10px', alignItems: 'flex-end'}}>
          {snippet}
        </div>

        {this.props.specificPieceId === null ? addOption : null}
        {experimentalOptionList}

        { /* optionList */ }
        
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
                  <FontAwesome name={'save'} className={styles.ClipButtonIcon}/>
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