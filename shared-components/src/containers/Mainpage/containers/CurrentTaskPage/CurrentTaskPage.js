import React, { Component } from 'react';

import CollectionView from './CollectionView/CollectionView';
import TableView from './TableView/TableView';
import styles from './CurrentTaskPage.css';

// import InteractionBox from '../../../../components/InteractionBox/InteractionBox';
// import HoverInteraction from '../../../../components/InteractionBox/HoverInteraction/HoverInteraction';

class CurrentTaskPage extends Component {

  state = {
    isTable: false
  }

  switchView = (event, toState) => {
    this.setState(prevState => {
      return {isTable: prevState.isTable !== toState ? !prevState.isTable : prevState.isTable}
    });
  }
  

  render () {
    const { isTable } = this.state;
    let content = !isTable 
    ? <CollectionView task={this.props.task}/> 
    : <TableView task={this.props.task}/>

    return (
      <div className={styles.CurrentTaskContainer}>
        <div className={styles.Switcher}>
          <button
            onClick={(event) => this.switchView(event, false)}
            className={[isTable ? null : styles.Active]}>
            Collections
          </button>

          <button
            onClick={(event) => this.switchView(event, true)}
            className={[isTable ? styles.Active : null]}>
            Make comparisons
          </button>
        </div>

        <div className={styles.Content}>

          {content}
        </div>
      </div>
    );
  }
}

export default CurrentTaskPage;