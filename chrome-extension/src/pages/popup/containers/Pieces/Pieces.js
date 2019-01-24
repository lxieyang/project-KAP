import React, { Component } from 'react';
import styled from 'styled-components';

const PiecesContainer = styled.div`
  background-color: #eee;
  margin: 5px 0px;
  box-sizing: border-box;
  width: 100%;
  height: 600px;
  padding: 0px 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

class Pieces extends Component {
  render() {
    return (
      <React.Fragment>
        <PiecesContainer>Pieces go here</PiecesContainer>
      </React.Fragment>
    );
  }
}

export default Pieces;
