import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './TopLeftCell.css';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

class TopLeftCell extends Component {
  state = {};

  render() {
    return <th className={styles.TopLeftCellContainer} />;
  }
}

export default TopLeftCell;
