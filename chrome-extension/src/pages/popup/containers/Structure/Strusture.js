import React, { Component } from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  background-color: #eee;
  margin: 5px 0px;
  box-sizing: border-box;
  width: 100%;
  height: 300px;
  padding: 0px 10px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

class Structure extends Component {
  render() {
    return (
      <React.Fragment>
        <TableContainer>Table goes here</TableContainer>
      </React.Fragment>
    );
  }
}

export default Structure;
