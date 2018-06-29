import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasDiagnoses from '@fortawesome/fontawesome-free-solid/faDiagnoses';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import Logo from '../../../../../shared-components/src/components/UI/Logo/Logo';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: inline-block;
  padding: 4px 6px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);
  border-radius: 2px;
`;

const Container = styled.div`
  padding: 4px;
  font-family: sans-serif;
  font-size: 14px;
  max-width: 440px;
  display: flex;
  align-items: center;

  z-index: 10000;
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
    taskOngoing: false
  }

  render () {
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
                    this.state.taskOngoing ? activeWorkingButtonStyle : null
                  } >
                  <FontAwesomeIcon icon={fasDiagnoses} style={{marginRight: '4px'}}/>
                  Still working on it...
                </Button>

                <Button
                  style={
                    !this.state.taskOngoing ? activeFinishButtonStyle : null
                  } >
                  <FontAwesomeIcon icon={fasCheck} style={{marginRight: '4px'}}/>
                  Completed!
                </Button>

              </ButtonsContainer>
            </TitleContainer>

            <TaskNameContainer>
              Name of the task that you are currently working on 
            </TaskNameContainer>

            <StatsContainer>
              <div>1 options</div>
              <div>2 criteria</div>
              <div>
                Search queries
              </div>

            </StatsContainer>
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