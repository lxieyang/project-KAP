/* global chrome */
import React, { Component } from 'react';
import { debounce } from 'lodash';
import moment from 'moment';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasDiagnoses from '@fortawesome/fontawesome-free-solid/faDiagnoses';
import fasClock from '@fortawesome/fontawesome-free-solid/faClock';
import fasCircleNotch from '@fortawesome/fontawesome-free-solid/faCircleNotch';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import Logo from '../../../../../shared-components/src/components/UI/Logo/Logo';
import { 
  tasksRef,
  currentTaskIdRef
} from '../../../../../shared-components/src/firebase/index';
import { APP_NAME_SHORT, APP_NAME_LONG } from '../../../../../shared-components/src/shared/constants';
import ThreeDotsSpinner from '../../../../../shared-components/src/components/UI/ThreeDotsSpinner/ThreeDotsSpinner';
import * as FirebaseStore from '../../../../../shared-components/src/firebase/store';
import styled from 'styled-components';



const Wrapper = styled.div`
  display: inline-block;
  max-width: 500px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);
  border-radius: 2px;

  z-index: 10000;
`;

const Container = styled.div`
  font-family: sans-serif;
  font-size: 14px;
`;

const AppTitleContainer = styled.div`
  margin-bottom: 0px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 1px 3px 0 rgba(60,64,67,.15);
  background-color: rgba(251, 251, 251, 1);

`;

const AppTitle = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  opacity: 0.7;
  cursor: pointer;

  transition: all 0.1s ease-in;

  &:hover {
    opacity: 1;
  }
`;

const ContentContainer = styled.div`
  padding: 8px 12px 10px 12px;
`;

const SectionContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 0px 0px;
`;



const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled.div`
  font-size: 1.1em;
  font-weight: bold;
  cursor: default;
  margin-right: 8px;
  flex-shrink: 0;
`;

const TaskNameContainer = styled.div`
  font-size: 1.1em;
  background-color: #f8f8f8;
  padding: 4px 6px;
  border-radius: 5px;

  transition: all 0.1s ease-in;

  &:hover,
  &:focus {
    outline: none;
    background-color: #efefef;
    box-shadow: 2px 2px 3px rgba(0,0,0,0.2);
  }

`;

const PromptAutoSaved = styled.div`
  position: absolute;
  bottom: -1.0rem;
  left: 0px;

  font-size: 0.8rem;
  color: inherit;
  opacity: 0.8;
  margin-top: 5px;
  margin-left: 5px;
`;

const ButtonsContainer = styled.div`
  margin-top: 1.0rem;
  display: flex;
  align-items: stretch;
`;

const Button = styled.div`
  display: flex;
  align-items: center;

  padding: 3px 8px;
  margin: 0px 5px;
  border-radius: 4px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.08), 0 2px 2px 0 rgba(0,0,0,0.06);

  color: rgb(210, 210, 210);
  background-color: rgb(254, 254, 254);

  cursor: pointer;
  transition: 0.1s all ease-in;

  &:hover {
    transform: scale(1.05);
  }
`;


const activeWorkingButtonStyle = {
  color: '#fff',
  backgroundColor: '#4CAF50',
  boxShadow: '0 2px 2px 0 rgba(0,0,0,0.16), 0 2px 2px 0 rgba(0,0,0,0.12)'
};

const activeFinishButtonStyle = {
  color: '#fff',
  backgroundColor: 'rgb(236, 123, 2)',
  boxShadow: '0 2px 2px 0 rgba(0,0,0,0.16), 0 2px 2px 0 rgba(0,0,0,0.12)'
};


class GoogleInPageTaskPrompt extends Component {

  state = {
    currentTaskId: null,
    currentTaskName: null,
    taskOngoing: true,
    completionTimestamp: null,

    // prompt
    shouldShowPrompt: false,
    isEditingTaskName: false
  }

  componentDidMount() {
    currentTaskIdRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const currentTaskId = snapshot.val();
        this.setState({currentTaskId});
        const currentTaskRef = tasksRef.child(currentTaskId);

        currentTaskRef.on('value', (snap) => {
          if (snap.key === this.state.currentTaskId) {
            this.setState({currentTaskName: snap.val().name});
            this.setState({taskOngoing: snap.val().taskOngoing});
            if (snap.val().taskOngoing === false) {
              this.setState({completionTimestamp: snap.val().completionTimestamp});
            } else {
              this.setState({completionTimestamp: null});
            }
          }
        });
      }
    });

    this.inputCallback = debounce((event, id) => {
      FirebaseStore.updateTaskName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
      this.setState({shouldShowPrompt: false});
    }, 2000);
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.setState({shouldShowPrompt: true});
    this.inputCallback(event, id);
  }

  switchEditingTaskNameStatus = () => {
    this.setState(prevState => {
      return {isEditingTaskName: !prevState.isEditingTaskName}
    })
  }

  openKAPinNewTabClickedHandler = () => {
    console.log('open new kap tab');
    chrome.runtime.sendMessage({
      msg: 'OPEN_IN_NEW_TAB'
    });
  }

  switchTaskOngoinghandler = (taskId, shouldTaskBeOngoing, originalShouldTaskBeOngoing) => {
    FirebaseStore.switchTaskWorkingStatus(
      taskId, 
      shouldTaskBeOngoing, 
      shouldTaskBeOngoing !== originalShouldTaskBeOngoing
    );
  }
  
  render () {
    const { currentTaskId, taskOngoing, currentTaskName, completionTimestamp } = this.state;

    return (
      <Wrapper>
        <Container>
          <AppTitleContainer>
            <AppTitle 
              title={`Open ${APP_NAME_SHORT} in a new tab`}
              onClick={(event) => this.openKAPinNewTabClickedHandler()}>
              <Logo size="25px"/>&nbsp; {APP_NAME_LONG}
            </AppTitle>
          </AppTitleContainer>
          <ContentContainer>
            <SectionContainer>
              <TitleContainer>
                <Title> 
                  <FontAwesomeIcon icon={fasClock} style={{marginRight: '2px'}}/> Current Task:
                </Title>
                <div style={{position: 'relative'}}>
                  <TaskNameContainer
                    title={'Click to edit'}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(event) => this.inputChangedHandler(event, currentTaskId)}
                    onFocus={() => this.switchEditingTaskNameStatus()}
                    onBlur={() => this.switchEditingTaskNameStatus()}>
                    {currentTaskName} 
                  </TaskNameContainer>
                  <PromptAutoSaved>
                    {this.state.shouldShowPrompt === true 
                      ? <span>
                          Edits will automatically be saved <ThreeDotsSpinner />
                        </span>
                      : null}
                  </PromptAutoSaved>
                </div>
              </TitleContainer>    
            </SectionContainer>        

            <SectionContainer>
              <ButtonsContainer>
                <Button
                  style={
                    taskOngoing === true ? activeWorkingButtonStyle : null
                  }
                  onClick={(event) => this.switchTaskOngoinghandler(currentTaskId, true, taskOngoing)} >
                  <FontAwesomeIcon icon={fasCircleNotch} style={{marginRight: '4px'}}/>
                  Ongoing...
                </Button>

                <Button
                  style={
                    taskOngoing === false ? activeFinishButtonStyle : null
                  }
                  onClick={(event) => this.switchTaskOngoinghandler(currentTaskId, false, taskOngoing)} >
                  <FontAwesomeIcon icon={fasCheck} style={{marginRight: '4px'}}/>
                  Completed! 
                  {
                    completionTimestamp !== null ? ` (${moment(completionTimestamp).fromNow()})` : null
                  }
                </Button>

              </ButtonsContainer>
            </SectionContainer>

          </ContentContainer>

        </Container>
      </Wrapper>
    );
  }
}

export default GoogleInPageTaskPrompt;