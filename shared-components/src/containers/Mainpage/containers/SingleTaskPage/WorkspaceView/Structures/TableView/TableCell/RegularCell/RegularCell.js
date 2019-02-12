import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RegularCell.css';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

class RegularCell extends Component {
  state = {};

  componentDidMount() {
    // this.unsubscribeCell = FirestoreManager.get
  }

  componentWillUnmount() {}

  render() {
    let { cell } = this.props;
    return <td>{cell.id}</td>;
  }
}

export default RegularCell;
