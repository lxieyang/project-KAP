import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
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
class SelectInteraction extends Component {

  state = {
    canSubmitOption: false,
    canSubmitRequirement: false
  }

  collectButtonClickHandler = (btnType) => {
    const { selectedText, clip } = this.props;
    if (btnType === 'option') {
      // console.log('add option clicked');
      FirebaseStore.addAnOptionForCurrentTask(selectedText);
      this.setState({canSubmitOption: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 800);}

    } else if (btnType === 'requirement') {
      // console.log('add criterion/feature clicked');
      FirebaseStore.addARequirementForCurrentTask(selectedText);
      this.setState({canSubmitRequirement: true});
      if (clip !== undefined) {setTimeout(() => {clip();}, 800);}

    } else if (btnType === 'snippet') {
      console.log('add snippet clicked');
      const interactionBoxAnchor = document.body.appendChild(document.createElement('div'));
      interactionBoxAnchor.className = classes.InteractionBoxAnchor;
      interactionBoxAnchor.setAttribute('id', 'interaction-box');

      const hoverAnchor = document.body.appendChild(document.createElement('div'));
      hoverAnchor.className = classes.InteractionBoxAnchor;
      hoverAnchor.setAttribute('id', 'hover-box');
      
      interactionBoxAnchor.style.left = `100px`;
      interactionBoxAnchor.style.top = `${Math.floor(window.innerHeight / 5) + window.scrollY}px`;
      let postTags = [];
      if(window.location.hostname === "stackoverflow.com") {
        $(document.body).find('.post-taglist .post-tag').each((idx, tagNode) => {
          postTags.push($(tagNode).text().toLowerCase());
        });
      }
      ReactDOM.render(
        <InteractionBox
          type={SNIPPET_TYPE.SELECTION}
          url={window.location.href}
          selectedText={selectedText}
          postTags={postTags}
          originalDimensions={null}
          clip={clip}
        />,
      interactionBoxAnchor);
      dragElement(document.getElementById("interaction-box"));
      // TODO: bring up interaction box

    }
  }

  render () {
    return (
      <div className={styles.SelectInteractionContainer}>
        <div className={styles.Title}>
          Collect as:
        </div>
        <div className={styles.ButtonContainer}>
          <div
            className={styles.Button}
              style={{width: '36px'}}
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
              (
                this.state.canSubmitOption
                ? styles.CheckmarkSpin
                : null)].join(' ')}></div>
            </div>
          </div>


          <div
            className={styles.Button}
              style={{width: '89px'}}
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
                Criterion/Feature
                </div>
              </div>
            </div>
            <div className={styles.CheckmarkContainer}>
              <div className={[styles.Checkmark,
              (
                this.state.canSubmitRequirement
                ? styles.CheckmarkSpin
                : null)].join(' ')}></div>
            </div>
          </div>


          <div
            className={styles.Button}
              style={{width: '41px'}}
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

        </div>
      </div>
    );
  }
}

export default SelectInteraction;
