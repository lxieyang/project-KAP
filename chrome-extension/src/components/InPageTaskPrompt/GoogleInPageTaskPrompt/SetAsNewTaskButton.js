import React, { Component } from 'react';
import Logo from '../../../../../shared-components/src/components/UI/Logo/Logo';
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

  padding: 6px 12px;
  border-radius: 4px;
  margin: 0px 5px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,0.08), 0 2px 2px 0 rgba(0,0,0,0.06);

  color: #444;
  background-color: rgba(251, 251, 251, 1);

  cursor: pointer;
  transition: 0.1s all ease-in;

  &:hover {
    color: #fff;
    background-color: rgb(76, 175, 80);
    box-shadow: 4px 4px 6px rgba(0,0,0,0.2);
  }
`;

class SetAsNewTaskButton extends Component {
  render () {
    return (
      <Wrapper>
        <Button
          onClick={(event) => this.props.setAsNewTaskHandler(this.props.searchTerm)}>
          <Logo size="25px"/> &nbsp; <span>Start a <strong> new task </strong> with this search</span>
        </Button>
      </Wrapper>
    );
  }
}

export default SetAsNewTaskButton;