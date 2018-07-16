import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasPuzzlePiece from '@fortawesome/fontawesome-free-solid/faPuzzlePiece';
import * as FirebaseStore from '../../../firebase/store';
import HoverInteraction from '../HoverInteraction/HoverInteraction';
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
    const { selectedText, clip } = this.props;
    if (btnType === 'task') {
      // console.log('task option clicked');
      FirebaseStore.addTaskFromSearchTerm(selectedText);
      this.setState({canSubmitTask: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 800);}
    }

    else if (btnType === 'option') {
      // console.log('add option clicked');
      FirebaseStore.addAnOptionForCurrentTask(selectedText);
      this.setState({canSubmitOption: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 800);}
    }

    else if (btnType === 'requirement') {
      FirebaseStore.addARequirementForCurrentTask(selectedText);
      this.setState({canSubmitRequirement: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 800);}
    }

    else if (btnType === 'snippet') {
      // console.log('add snippet clicked');
      let interactionBoxAnchor = annotation.interactionBoxAnchor;
      // let interactionBoxIsMounted =  annotation.interactionBoxIsMounted;
      let postTags = [];
      // if(window.location.hostname === "stackoverflow.com") {
      //   $(document.body).find('.post-taglist .post-tag').each((idx, tagNode) => {
      //     postTags.push($(tagNode).text().toLowerCase());
      //   });
      // }

      ReactDOM.render(

        <InteractionBox
        type={SNIPPET_TYPE.SELECTION}
        url={window.location.href}
        selectedText={selectedText}
        postTags={postTags}
        originalDimensions={null}
        clip={annotation.clipClicked}
        />,
        interactionBoxAnchor);
        // interactionBoxIsMounted  = true;
        dragElement(document.getElementById("interaction-box"));
        // console.log('rendering selection interaction box');
        if (clip !== undefined) {setTimeout(() => {clip();}, 800);}
        // console.log('set up interactionbox, is mounted? ', interactionBoxIsMounted);
        // TODO: bring down interaction box with close button
      }

    }

    render () {

      return (
        <div className={styles.SelectInteractionContainer}>
        <div className={styles.Title}>
        Collect as:
        </div>
        <div className={styles.ButtonContainer}>

        {/*
          Task Button begins
          */}
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
        icon={faPlus}
        className={styles.ButtonIcon} />
        </div>
        <div className={styles.ButtonText}>
        New Task
        </div>
        </div>
        </div>
        <div className={styles.CheckmarkContainer}>
        <div className={[styles.Checkmark,
          (this.state.canSubmitTask
            ? styles.CheckmarkSpin
            : null)].join(' ')}></div>
        </div>
        </div>

        {/*
          Option Button begins
          */}
        <div
        className={styles.Button}
        style={{width: '42px'}}
        onClick={(event) => this.collectButtonClickHandler('option')}>
        <div>
        <div className={[styles.ButtonContentWrapper, (
          this.state.canSubmitOption
          ? styles.ButtonTextDisappear
          : null
        )].join(' ')}>
        <div className={styles.ButtonIconWrapper}>
        <FontAwesomeIcon
        icon={fasListUl}
        className={styles.ButtonIcon} />
        </div>
        <div className={styles.ButtonText}>
        Option
        </div>
        </div>
        </div>
        <div className={styles.CheckmarkContainer}>
        <div className={[styles.Checkmark,
          (this.state.canSubmitOption
            ? styles.CheckmarkSpin
            : null)].join(' ')}></div>
        </div>
        </div>

        {/*
          Criterion Button begins
          */}
        <div
        className={styles.Button}
        style={{width: '42px'}}
        onClick={(event) => this.collectButtonClickHandler('requirement')}>
        <div>
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
        Criterion /Feature
        </div>
        </div>
        </div>
        <div className={styles.CheckmarkContainer}>
        <div className={[styles.Checkmark,
          (this.state.canSubmitRequirement
            ? styles.CheckmarkSpin
            : null)].join(' ')}></div>
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
