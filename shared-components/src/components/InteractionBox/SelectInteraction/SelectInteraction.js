import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasBriefcase from '@fortawesome/fontawesome-free-solid/faBriefcase';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasPuzzlePiece from '@fortawesome/fontawesome-free-solid/faPuzzlePiece';
import Logo from '../../UI/Logo/Logo';
import * as FirebaseStore from '../../../firebase/store';
import InteractionBox from '../InteractionBox';
import { SNIPPET_TYPE } from '../../../shared/constants';
import styles from './SelectInteraction.css';
import { PageCountHelper, dragElement } from '../../../../../chrome-extension/src/pages/content/content.utility.js';
import classes from '../../../../../chrome-extension/src/pages/content/content.annotation.css';
import * as annotation from '../../../../../chrome-extension/src/pages/content/content.annotation.js';

class SelectInteraction extends Component {

  state = {
    canSubmitTask: false,
    canSubmitOption: false,
    canSubmitRequirement: false
  }


  collectButtonClickHandler = (btnType) => {
    const { selectedText, addPiece, clip } = this.props;
    if (btnType === 'task') {
      // console.log('task option clicked');
      FirebaseStore.addTaskFromSearchTerm(selectedText);
      this.setState({canSubmitTask: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 900);}
    }

    else if (btnType === 'option') {
      // console.log('add option clicked');
      FirebaseStore.addAnOptionForCurrentTask(selectedText);
      this.setState({canSubmitOption: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 900);}
    }

    else if (btnType === 'requirement') {
      FirebaseStore.addARequirementForCurrentTask(selectedText);
      this.setState({canSubmitRequirement: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 900);}
    }

    else if (btnType === 'snippet') {
      if (addPiece !== undefined) {setTimeout(() => {addPiece();}, 10);}
    }
  }

  render () {

    return (
      <div className={styles.SelectInteractionContainer}>
        <div className={styles.TitleContainer}>
          <div className={styles.Title}>
            <div className={styles.LogoContainer}><Logo size='20px'/></div> &nbsp;
            Collect as:
          </div>
        </div>
        <div className={styles.ButtonContainer}>

          {/* Task Button begins */}
          <div
            className={styles.Button}
            style={{width: '42px'}}
            onClick={(event) => this.collectButtonClickHandler('task')}>
            <div>
              <div className={[styles.ButtonContentWrapper, (
                this.state.canSubmitTask
                ? styles.ButtonTextDisappear
                : null
              )].join(' ')}>
                <div className={styles.ButtonIconWrapper}>
                  <FontAwesomeIcon
                    icon={fasBriefcase}
                    className={styles.ButtonIcon} />
                </div>
                <div className={styles.ButtonText}>
                  New Task
                </div>
              </div>
            </div>
            <div className={styles.CheckmarkContainer}>
              <div 
                className={[styles.AddedSomething, (this.state.canSubmitTask ? null : styles.TextAppear)].join(' ')}>
                Started New Task
              </div>
            </div>
          </div>

          {/* Option Button begins */}
          <div
            className={styles.Button}
            style={{width: '42px'}}
            onClick={(event) => this.collectButtonClickHandler('option')}>
            <div className={styles.ButtonOption}>
              <div 
                className={[styles.ButtonContentWrapper, (this.state.canSubmitOption ? styles.ButtonTextDisappear : null)].join(' ')}>
                <div className={styles.ButtonIconWrapper}>
                  <FontAwesomeIcon
                    icon={fasListUl}
                    className={styles.ButtonIcon} />
                </div>
                <div className={styles.ButtonText}>
                  Option
                </div>
              </div>
              <div className={styles.CheckmarkContainer}>
                <div 
                  className={[styles.AddedSomething, (this.state.canSubmitOption ? null : styles.TextAppear)].join(' ')}>
                  Added Option
                </div>
              </div>
            </div>
          </div>

          {/*
            Criterion Button begins
            */}
          <div
            className={styles.Button}
            style={{width: '42px'}}
            onClick={(event) => this.collectButtonClickHandler('requirement')}>
            <div className={styles.ButtonRequirement}>
              <div className={[styles.ButtonContentWrapper, (
                this.state.canSubmitRequirement
                ? styles.ButtonTextDisappear
                : null
              )].join(' ')}>
                <div className={styles.ButtonIconWrapper}>
                  <FontAwesomeIcon
                    icon={fasFlagCheckered}
                    className={styles.ButtonIcon} />
                </div>
                <div className={styles.ButtonText}>
                  Criterion
                </div>
              </div>
            </div>
            <div className={styles.CheckmarkContainer}>
              <div 
                className={[styles.AddedSomething, (this.state.canSubmitRequirement ? null : styles.TextAppear)].join(' ')}>
                Added Criterion
              </div>
            </div>
          </div>

          {/*
            Snippet Button begins
            */}
          <div
            className={styles.Button}
            style={{width: '42px'}}
            onClick={(event) => this.collectButtonClickHandler('snippet')}>
            <div>
              <div className={[styles.ButtonContentWrapper].join(' ')}>
                <div className={styles.ButtonIconWrapper}>
                  <FontAwesomeIcon
                  icon={fasPuzzlePiece}
                  className={styles.ButtonIcon} />
                </div>
                <div className={styles.ButtonText}>
                  Snippet
                </div>
              </div>
            </div>
          </div>
          {/*
            End of snippet button
            */}

        </div>
      </div>
    );
  }
}

export default SelectInteraction;
