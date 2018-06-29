import React, { Component } from 'react';
import { debounce } from 'lodash';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasDiagnoses from '@fortawesome/fontawesome-free-solid/faDiagnoses';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import Logo from '../../../../../shared-components/src/components/UI/Logo/Logo';
import { 
  tasksRef,
  currentTaskIdRef
} from '../../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../../shared-components/src/firebase/store';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: inline-block;
  padding: 4px 6px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);
  border-radius: 2px;

  z-index: 10000;
`;

const Container = styled.div`
  padding: 4px;
  font-family: sans-serif;
  font-size: 14px;
  max-width: 440px;
  display: flex;
  align-items: center;
`;

const ContentContainer = styled.div`
  margin-right: 10px;
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled.div`
  font-size: 1.1em;
  font-weight: bold;
  cursor: default;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: stretch;
  margin-left: 20px;
`;

const Button = styled.div`
  display: flex;
  align-items: center;

  padding: 3px 6px;
  border-radius: 4px;
  margin: 0px 5px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.08), 0 2px 2px 0 rgba(0,0,0,0.06);

  color: rgb(210, 210, 210);
  background-color: rgb(254, 254, 254);

  cursor: pointer;
  transition: 0.1s all ease-in;

  &:hover {
    transform: scale(1.05);
  }
`;

const TaskNameContainer = styled.div`
  margin-top: 8px;
  font-size: 1.1em;
  text-decoration: underline;

  &:focus {
    outline: none;
  }
`;

const StatsContainer = styled.div`

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
          }
        });
      }
    });

    this.inputCallback = debounce((event, id) => {
      FirebaseStore.updateTaskName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
    }, 2000);
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.inputCallback(event, id);
  }

  switchTaskOngoinghandler = (taskId, shouldTaskBeOngoing, originalShouldTaskBeOngoing) => {
    FirebaseStore.switchTaskWorkingStatus(
      taskId, 
      shouldTaskBeOngoing, 
      shouldTaskBeOngoing !== originalShouldTaskBeOngoing
    );
  }
  
  render () {
    const { currentTaskId, taskOngoing, currentTaskName } = this.state;

    return (
      <Wrapper>
        <Container>
          <ContentContainer>
            <TitleContainer>
              <Title> 
                Current Task
              </Title>
              <ButtonsContainer>
                <Button
                  style={
                    taskOngoing === true ? activeWorkingButtonStyle : null
                  }
                  onClick={(event) => this.switchTaskOngoinghandler(currentTaskId, true, taskOngoing)} >
                  <FontAwesomeIcon icon={fasDiagnoses} style={{marginRight: '4px'}}/>
                  Still working on it...
                </Button>

                <Button
                  style={
                    taskOngoing === false ? activeFinishButtonStyle : null
                  }
                  onClick={(event) => this.switchTaskOngoinghandler(currentTaskId, false, taskOngoing)} >
                  <FontAwesomeIcon icon={fasCheck} style={{marginRight: '4px'}}/>
                  Completed!
                </Button>

              </ButtonsContainer>
            </TitleContainer>

            <TaskNameContainer
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={(event) => this.inputChangedHandler(event, currentTaskId)}>
              {currentTaskName} 
            </TaskNameContainer>

            {/*<StatsContainer>
              <div>1 options</div>
              <div>2 criteria</div>
              <div>
                Search queries
              </div>

            </StatsContainer>*/}
          </ContentContainer>

          <LogoContainer>
            <Logo size={'20px'} />
          </LogoContainer>
        </Container>
      </Wrapper>
    );
  }
}

export default GoogleInPageTaskPrompt;