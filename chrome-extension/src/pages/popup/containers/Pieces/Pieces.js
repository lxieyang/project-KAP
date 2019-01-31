import React, { Component } from 'react';
import styled from 'styled-components';
import Piece from './Piece/Piece';
import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';

const PiecesContainer = styled.div`
  /* background-color: #eee; */
  margin: 5px 0px;
  box-sizing: border-box;
  width: 100%;
  height: 600px;
  padding: 0px 10px;
  /* display: flex;
  justify-content: space-around;
  align-items: center; */
`;

const PiecesUL = styled.ul`
  list-style-type: none;
  padding: 0px;
`;

const PieceLI = styled.li`
  margin: 0px;
  padding: 0px;
`;

class Pieces extends Component {
  state = {
    pieces: []
  };

  componentDidMount() {
    this.unsubscribeCurrentTaskId = FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(
      doc => {
        let currentTaskId = doc.data().id;
        this.unsubscribeAllPieces = FirestoreManager.getAllPiecesInTask(
          currentTaskId
        ).onSnapshot(querySnapshot => {
          let pieces = [];
          querySnapshot.forEach(doc => {
            pieces.push({ id: doc.id, ...doc.data() });
          });
          this.setState({ pieces });
        });
      }
    );
  }

  componentWillUnmount() {
    this.unsubscribeCurrentTaskId();
    this.unsubscribeAllPieces();
  }

  render() {
    let { pieces } = this.state;
    return (
      <React.Fragment>
        {/*<PiecesContainer>Pieces go here</PiecesContainer>*/}
        <PiecesContainer>
          <PiecesUL>
            {pieces.map((p, idx) => {
              return (
                <PieceLI key={idx}>
                  <Piece piece={p} />
                </PieceLI>
              );
            })}
          </PiecesUL>
        </PiecesContainer>
      </React.Fragment>
    );
  }
}

export default Pieces;
