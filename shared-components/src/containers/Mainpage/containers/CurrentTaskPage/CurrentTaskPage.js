import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';
import Aux from '../../../../hoc/Aux/Aux';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCopy from '@fortawesome/fontawesome-free-solid/faCopy';
import TaskStatusView from './TaskStatusView/TaskStatusView';
import CollectionView from './CollectionView/CollectionView';
import TableView from './TableView/TableView';
import styles from './CurrentTaskPage.css';
import * as FirebaseStore from '../../../../firebase/store';

class CurrentTaskPage extends Component {
  constructor(props) {
    super(props);
    this.incrementSelectedSnippetNumber = this.incrementSelectedSnippetNumber.bind(this);
    this.decrementSelectedSnippetNumber = this.decrementSelectedSnippetNumber.bind(this)
  }

  state = {
    isTable: false,
    specific: this.props.specific,
    specificTask: null,
    specificPieceId: null,
    errorMsg: null,
    selectedSnippets: 0
  }

  switchView = (event, toState) => {
    if (toState === false) {
      const query = {
        ...qs.parse(this.props.location.search),
        view: 'collection'
      };
      this.props.history.push({
        search: qs.stringify(query)
      });
    } else {
      const query = {
        ...qs.parse(this.props.location.search),
        view: 'table'
      };
      this.props.history.push({
        search: qs.stringify(query)
      });
    }
  }

  UNSAFE_componentWillReceiveProps (newProps) {
    this.setState({specific: newProps.specific});
    if (newProps.specific === true) {
      this.setState({isTable: false});
      let userId = newProps.match.params.userId;
      let taskId = newProps.match.params.taskId;
      let pieceId = this.props.match.params.pieceId;
      this.setState({specificPieceId: pieceId});
      this.updateTask({database: newProps.database, userId, taskId});
    }

    if (newProps.task.id !== this.props.task.id) {
      const query = {
        ...qs.parse(this.props.location.search),
        view: 'collection'
      };
      this.props.history.push({
        search: qs.stringify(query)
      });
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

    const query = {
      ...qs.parse(this.props.location.search),
      view: 'collection'
    };
    this.props.history.push({
      search: qs.stringify(query)
    });

    this.unlisten = this.props.history.listen((location, action) => {
      const search = qs.parse(location.search);
      if (search.view === 'collection') {
        this.setState({isTable: false});

      } else {
        this.setState({isTable: true});
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
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
          showOptionNotes: childSnapshot.val().showOptionNotes,
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

  copyButtonClicked = (event) => {
    if (window.userId !== this.props.match.params.userId) {
      FirebaseStore.cloneATaskForCurrentUser(this.props.match.params.userId, this.props.match.params.taskId);
    } else {
      FirebaseStore.switchCurrentTask(this.props.match.params.taskId);
    }
    this.props.history.push('/currtask');
  }

  incrementSelectedSnippetNumber(event) {
    // console.log('# of currently selected snippets, incrementing', this.state.selectedSnippets+1);
    this.setState(prevState => {
      return {selectedSnippets: ++prevState.selectedSnippets};
    })
  }

  decrementSelectedSnippetNumber = (event) => {
    console.log('# of currently selected snippets, decrementing', this.state.selectedSnippets-1);
    this.setState(prevState => {
      return {selectedSnippets: --prevState.selectedSnippets};
    })
  }

  willUnselectAlllSnippets = (event) => {
    this.setState(prevState => {
      return {selectedSnippets: true};
    })
  }

  finishedUnselectingAllSnippets = (event) => {
    this.setState(prevState => {
      return {selectedSnippets: false};
    })
  }

  render () {
    const { isTable } = this.state;

    let content = null;
    if (this.state.specific === true) {
      if (this.state.specificTask !== null) {

        content =
        <Aux>
          <TableView task={this.state.specificTask} specificPieceId={this.state.specificPieceId}
          incrementSelectedSnippetNumber={this.incrementSelectedSnippetNumber}
          decrementSelectedSnippetNumber={this.decrementSelectedSnippetNumber}
          selectedSnippets={this.state.selectedSnippets}
          />
          <CollectionView task={this.state.specificTask} specificPieceId={this.state.specificPieceId}
          incrementSelectedSnippetNumber={this.incrementSelectedSnippetNumber}
          decrementSelectedSnippetNumber={this.decrementSelectedSnippetNumber}
          selectedSnippets={this.state.selectedSnippets}
          />
        </Aux>
      //
      //   content = !isTable
      //     ? <CollectionView task={this.state.specificTask} specificPieceId={this.state.specificPieceId}/>
      //     : <TableView task={this.state.specificTask} specificPieceId={this.state.specificPieceId}/>
      } else {
        content = this.state.errorMsg !== null ? <div style={{marginTop: '40px'}}>{this.state.errorMsg}</div> : null;
      }
    } else {
      content =
      <Aux>
        <TaskStatusView task={this.props.task}/>
        <TableView task={this.props.task}
          incrementSelectedSnippetNumber={this.incrementSelectedSnippetNumber}
          decrementSelectedSnippetNumber={this.decrementSelectedSnippetNumber}
          selectedSnippets={this.state.selectedSnippets}
          />
        <CollectionView
          task={this.props.task}
          shouldDisplayAllPages={this.props.shouldDisplayAllPages}
          incrementSelectedSnippetNumber={this.incrementSelectedSnippetNumber}
          decrementSelectedSnippetNumber={this.decrementSelectedSnippetNumber}
          selectedSnippets={this.state.selectedSnippets}
          />
      </Aux>
      // content = !isTable
      //   ? <CollectionView
      //     task={this.props.task}
      //     shouldDisplayAllPages={this.props.shouldDisplayAllPages} />
      //   : <TableView task={this.props.task}/>
    }

    return (
      <div className={styles.CurrentTaskContainer}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            {
              this.state.specific === true && this.state.specificTask !== null
              ? <div className={styles.SpecificTaskNameContainer}>
                  Reviewing task:
                  <span className={styles.SpecificTaskName}>
                    {this.state.specificTask.displayName}
                  </span>
                  <span
                    className={styles.CopyButton}
                    onClick={(event) => this.copyButtonClicked(event)}>
                    <FontAwesomeIcon icon={fasCopy}/>
                  </span>
                </div>
              : null
            }
          </div>
        </div>


        <div className={styles.Content}>
          {content}
        </div>
      </div>
    );
  }
}
// previous toggle button between collection view and comparison table
// <div className={styles.Switcher}>
  // <button
  //   onClick={(event) => this.switchView(event, false)}
  //   className={[isTable ? null : styles.Active]}>
  //   Collections
  // </button>
  //
  // <button
  //   onClick={(event) => this.switchView(event, true)}
  //   className={[isTable ? styles.Active : null]}>
  //   Comparison Table
  // </button>
// </div>
export default withRouter(CurrentTaskPage);
