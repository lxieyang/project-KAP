import React, { Component } from 'react';

import CollectionView from './CollectionView/CollectionView';
import TableView from './TableView/TableView';
import styles from './CurrentTaskPage.css';

// import InteractionBox from '../../../../components/InteractionBox/InteractionBox';
// import HoverInteraction from '../../../../components/InteractionBox/HoverInteraction/HoverInteraction';

class CurrentTaskPage extends Component {

  state = {
    isTable: false,
    specific: this.props.specific,
    specificTask: null,
    specificPieceId: null,
    errorMsg: null
  }

  switchView = (event, toState) => {
    this.setState(prevState => {
      return {isTable: prevState.isTable !== toState ? !prevState.isTable : prevState.isTable}
    });
  }

  componentWillReceiveProps (newProps) {
    this.setState({specific: newProps.specific});
    if (newProps.specific === true) {
      this.setState({isTable: false});
      let userId = newProps.match.params.userId;
      let taskId = newProps.match.params.taskId;
      let pieceId = this.props.match.params.pieceId;
      this.setState({specificPieceId: pieceId});
      this.updateTask({database: newProps.database, userId, taskId});
    }
  }

  componentDidMount() {
    if (this.props.specific === true) {
      // console.log(this.props.match.params);
      let userId = this.props.match.params.userId;
      let taskId = this.props.match.params.taskId;
      let pieceId = this.props.match.params.pieceId;
      this.setState({specificPieceId: pieceId});
      this.updateTask({database: this.props.database, userId, taskId});
    }
  }

  updateTask (payload) {
    const { database, userId, taskId } = payload;
    database.ref(`users/${userId}`).child('tasks').child(taskId).once('value', (childSnapshot) => {
      // console.log(childSnapshot.val());
      if (childSnapshot.val() !== null) {
        let thisTask = {
          id: childSnapshot.key,
          displayName: childSnapshot.val().name,
          time: childSnapshot.val().timestamp,
          searchQueries: childSnapshot.val().searchQueries,
          options: (
            childSnapshot.val().options === undefined 
            ? {} 
            : childSnapshot.val().options
          ),
          pieces: (
            childSnapshot.val().pieces === undefined
            ? {}
            : childSnapshot.val().pieces
          ),
          requirements: (
            childSnapshot.val().requirements === undefined
            ? {}
            : childSnapshot.val().requirements
          ),
          pieceGroups: (
            childSnapshot.val().pieceGroups === undefined
            ? {}
            : childSnapshot.val().pieceGroups
          ),
          isStarred: childSnapshot.val().isStarred,
          currentOptionId: childSnapshot.val().currentOptionId,
          pageCountList: (
            childSnapshot.val().pageCountList === undefined
            ? {}
            : childSnapshot.val().pageCountList
          )
        };
        // console.log(thisTask);
        this.setState({specificTask: thisTask});

        database.ref('codebases').on('value', (snapshot) => {
          snapshot.forEach((snap) => {
            let codebase = snap.val();
            let entries = codebase.entries;
            if (entries !== undefined && entries !== null) {
              for (let entryKey in entries) {
                let entry = entries[entryKey];
                if (thisTask.pieces[entry.pieceId] !== undefined) {
                  if (thisTask.pieces[entry.pieceId].codeUseInfo === undefined) {
                    thisTask.pieces[entry.pieceId].codeUseInfo = [
                      {
                        codebase: codebase.name,
                        codebaseId: snap.key,
                        useInfo: [{usedBy: entry.usedBy, content: entry.content, timestamp: entry.timestamp}]
                      }
                    ];
                  } else {
                    let codeUseInfo = thisTask.pieces[entry.pieceId].codeUseInfo;
                    let isNewCodebase = true;
                    codeUseInfo = codeUseInfo.map((use) => {
                      if (use.codebaseId === snap.key) {
                        use.useInfo.push({usedBy: entry.usedBy, content: entry.content, timestamp: entry.timestamp});
                        isNewCodebase = false;
                      }
                      return use;
                    });
                    if (isNewCodebase) {
                      codeUseInfo.push({
                        codebase: codebase.name,
                        codebaseId: snap.key,
                        useInfo: [{usedBy: entry.usedBy, content: entry.content, timestamp: entry.timestamp}]
                      });
                    }
                  }
                }
              }
            }
          });
          // console.log(thisTask);
          this.setState({specificTask: thisTask});
        });       


      } else {
        this.setState({errorMsg: 'Sorry, there was an error retrieving the previous task!'});
      }
    })
  }
  

  render () {
    const { isTable } = this.state;
    let content = null;
    if (this.state.specific === true) {
      if (this.state.specificTask !== null) {
        content = !isTable 
          ? <CollectionView task={this.state.specificTask} specificPieceId={this.state.specificPieceId}/> 
          : <TableView task={this.state.specificTask} specificPieceId={this.state.specificPieceId}/>
      } else {
        content = this.state.errorMsg !== null ? <div style={{marginTop: '40px'}}>{this.state.errorMsg}</div> : null;
      }
    } else {
      content = !isTable 
        ? <CollectionView task={this.props.task}/> 
        : <TableView task={this.props.task}/>
    }

    return (
      <div className={styles.CurrentTaskContainer}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div >
          {
            this.state.specific === true && this.state.specificTask !== null 
            ? <div className={styles.SpecificTaskNameContainer}>
                Reviewing task:  
                <span className={styles.SpecificTaskName}>
                  {this.state.specificTask.displayName}
                </span>
              </div> 
            : null
          }
        </div>
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
      </div>
        

        <div className={styles.Content}>

          {content}
        </div>
      </div>
    );
  }
}

export default CurrentTaskPage;