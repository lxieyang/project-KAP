import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farClock from '@fortawesome/fontawesome-free-regular/faClock';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasListAlt from '@fortawesome/fontawesome-free-solid/faListAlt';
import fasSave from '@fortawesome/fontawesome-free-solid/faSave';
import fasArrowsAlt from '@fortawesome/fontawesome-free-solid/faArrowsAlt';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import Input from '../../UI/Input/Input';
import styles from './HoverInteraction.css';
import {
  tasksRef,
  currentTaskIdRef
} from '../../../firebase/index';
import * as FirebaseStore from '../../../firebase/store';
import ordinal from 'ordinal';
import { sortBy } from 'lodash';


class HoverInteraction extends Component {
  state = {
    type: this.props.type !== undefined ? this.props.type : 'OP',   // 'OP' or 'RQ'
    currentTaskName: null,
    newOptionInput: this.props.content ? this.props.content : '',
    existingOptions: [],
    existingRequirements: [],
    canSubmit: false
  }

  componentDidMount() {
    currentTaskIdRef.on('value', (snapshot) => {
      tasksRef.child(snapshot.val()).child('name').once('value', (databack) => {
        this.setState({currentTaskName: databack.val()})
      });
      tasksRef.child(snapshot.val() + '/options').on('value', (data) => {
        let transformedOptions = [];
        data.forEach((opSnapshot) => {
          transformedOptions.push({
            id: opSnapshot.key,
            name: opSnapshot.val().name
          });
        });
        this.setState({existingOptions: transformedOptions});
      });
      tasksRef.child(snapshot.val() + '/requirements').on('value', (data) => {
        let transformedRequirements = [];
        data.forEach((rqSnapshot) => {
          transformedRequirements.push({
            ...rqSnapshot.val(),
            id: rqSnapshot.key
          });
        });
        this.setState({existingRequirements: sortBy(transformedRequirements, ['order'])});
      });
    });

    // add enter listener
    document.body.addEventListener('keyup', (event) => {
      if(document.getElementById('kap-add-option-input-box') === document.activeElement && event.keyCode === 13) {
        this.submitHandler(event);
      }
    });
  }


  inputChangedHandler = (event) => {
    this.setState({newOptionInput: event.target.value});
  }

  submitHandler = (event) => {
    event.preventDefault();
    const { newOptionInput } = this.state;

    if (newOptionInput !== '') {
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.ADD_AN_OPTION_TO_CURRENT_TASK,
      //   payload: {
      //     optionName: this.state.newOptionInput
      //   }
      // });
      if (this.state.type === 'OP') {
        FirebaseStore.addAnOptionForCurrentTask(this.state.newOptionInput);
      } else {
        FirebaseStore.addARequirementForCurrentTask(this.state.newOptionInput);
      }

    }

    this.setState({newOptionInput: ''});

    this.setState({canSubmit: true});

    if (this.props.clip !== undefined){
      setTimeout(() => {
        this.props.clip();
      }, 600);
    }
  }

  closeBoxHandler = (event) => {
    if (this.props.clip !== undefined){
      this.props.clip();
    }
  }

  render() {
    const { type, newOptionInput, existingOptions, existingRequirements } = this.state;

    return (
      <div className={styles.HoverInteraction}>
        <div
          id="hover-box-header"
          className={styles.InteractionBoxDragHandle}>
          <FontAwesomeIcon icon={fasArrowsAlt}/>
        </div>
        <div
          className={styles.CloseBoxContainer}
          onClick={(event) => this.closeBoxHandler(event)}>
          &#10005;
        </div>

        <div className={styles.AddPane}>
          {/*<span style={{marginBottom: '10px'}}>Add this option: </span>*/}
          <div className={styles.CurrentTaskNContainer}>
            <div className={styles.CurrentTaskLabel}>
              <FontAwesomeIcon icon={farClock} /> &nbsp;
              Current Task:
            </div>
            <div className={styles.CurrentTaskName}>{this.state.currentTaskName}</div>
          </div>
          <div style={{margin: '10px'}}>
            <Input
              id="kap-add-option-input-box"
              elementType='input'
              elementConfig={{placeholder: type === 'OP' ? 'Add an Option' : 'Add a Criterion'}}
              value={newOptionInput}
              changed={this.inputChangedHandler}
              />
            <br />
            <div className={styles.ClipButtonContainer}>
              <button
                title={type === 'OP' ? 'Save this Option' : 'Save this Criterion'}
                className={styles.ClipButton}
                onClick={(event) => this.submitHandler(event)}
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
                    <FontAwesomeIcon icon={fasSave} className={styles.ClipButtonIcon}/> Save as {type === 'OP' ? 'an Option' : 'a Criterion'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.showPane}>
          <div className={styles.CurrentTaskLabel}>
            <FontAwesomeIcon icon={type === 'OP' ? fasListAlt : fasFlagCheckered} /> &nbsp;
            Existing {type === 'OP' ? 'Options' : 'Criteria'}:
          </div>
          <div className={styles.OptionList}>
            <ul>
              {
                type === 'OP'
                ? existingOptions.map((op, idx) => (
                    <li key={op.id}>
                      <span className={styles.Option}>{op.name}</span>
                    </li>
                  ))
                : existingRequirements.map((rq, idx) => (
                    <li key={rq.id}>
                      <span className={styles.Ordinal}>{ordinal(idx + 1)}</span>
                      <div className={styles.Requirement}>
                        <div
                          className={[styles.RequirementStar, (
                            rq.starred === true ? styles.ActiveStar : null
                          )].join(' ')}
                          onClick={(event) => this.props.switchStarStatusOfRequirement(rq.id)}>
                          <FontAwesomeIcon icon={fasStar} />
                        </div>
                        {rq.name}
                      </div>
                    </li>
                  ))
              }
            </ul>
        </div>
        </div>
      </div>
    );
  }

}

export default HoverInteraction;
