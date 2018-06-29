import React, { Component } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: inline-block;
  padding: 4px 6px;
  font-size: 14px;
  z-index: 10000;
`;

const Button = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.1em;

  padding: 3px 6px;
  border-radius: 4px;
  margin: 0px 5px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.08), 0 2px 2px 0 rgba(0,0,0,0.06);

  color: #fff;
  background-color: rgb(3, 155, 229);

  cursor: pointer;
  transition: 0.1s all ease-in;

  &:hover {
    transform: scale(1.05);
  }
`;

class SetAsNewTaskButton extends Component {
  render () {
    return (
      <Wrapper>
        <Button
          onClick={(event) => this.props.setAsNewTaskHandler(this.props.searchTerm)}>
          Start as a NEW task
        </Button>
      </Wrapper>
    );
  }
}

export default SetAsNewTaskButton;