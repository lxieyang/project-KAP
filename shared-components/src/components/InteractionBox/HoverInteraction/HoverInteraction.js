import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasLink from '@fortawesome/fontawesome-free-solid/faLink';
import fasSave from '@fortawesome/fontawesome-free-solid/faSave';
import fasArrowsAlt from '@fortawesome/fontawesome-free-solid/faArrowsAlt';
import Input from '../../UI/Input/Input';
import styles from './HoverInteraction.css';
import { 
  tasksRef,
  currentTaskIdRef
} from '../../../firebase/index';
import * as FirebaseStore from '../../../firebase/store';


class HoverInteraction extends Component {
  state = {
    currentTaskName: null,
    newOptionInput: this.props.content ? this.props.content : '',
    existingOptions: [],
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
      FirebaseStore.addAnOptionForCurrentTask(this.state.newOptionInput);
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
    const { newOptionInput, existingOptions } = this.state;

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
            <div className={styles.CurrentTaskLabel}>Current Task:</div>
            <div className={styles.CurrentTaskName}>{this.state.currentTaskName}</div>
          </div>
          <Input 
            id="kap-add-option-input-box"
            elementType='input' 
            elementConfig={{placeholder: 'Add an option'}} 
            value={newOptionInput}
            changed={this.inputChangedHandler}
            />
          <div style={{display: 'flex', justifyContent: 'center', margin: '10px'}}>
            <div className={styles.ClipButtonContainer}>
              <button
                title="Save this option"
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
                    <FontAwesomeIcon icon={fasSave} className={styles.ClipButtonIcon}/>
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className={styles.showPane}>
          <div className={styles.OptionList}>
            <ul>
              {existingOptions.map((op, idx) => (
                <li key={op.id}>
                  <span className={styles.Option}>{op.name}</span>
                </li>
              ))}
            </ul>
        </div>
        </div>
      </div>
    );
  }
  
}

export default HoverInteraction;