import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RegularCell.css';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

const dropTarget = {
  canDrop(props, monitor, component) {
    if (!props.editAccess) {
      return false;
    }
    return true;
  },

  drop(props, monitor, component) {
    console.log(`Dropped on cell ${props.cell.id}`);
    const item = monitor.getItem();
    console.log(item);

    return {
      id: props.cell.id
    };
  }
};

const collectDrop = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
};

class RegularCell extends Component {
  state = {};

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  componentDidMount() {
    // this.unsubscribeCell = FirestoreManager.get
  }

  componentWillUnmount() {}

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { cell } = this.props;
    return connectDropTarget(
      <td style={{ backgroundColor: isOver ? '#f5b7b1' : null }}>{cell.id}</td>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RegularCell);
