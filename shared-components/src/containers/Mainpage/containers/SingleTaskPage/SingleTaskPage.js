import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from './matchPath';
import Spinner from '../../../../components/UI/Spinner/Spinner';
import styles from './SingleTaskPage.css';
import * as FirestoreManager from '../../../../firebase/firestore_wrapper';

import SplitPane from 'react-split-pane';
import './SplitPane.css';
import './ContextMenu.css';
import CollectionView from './CollectionView/CollectionView';
import WorkspaceView from './WorkspaceView/WorkspaceView';

import TaskContext from '../../../../shared/task-context';

import { FaMedal } from 'react-icons/fa';
import { GoPackage, GoTasklist } from 'react-icons/go';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

class SingleTaskPage extends Component {
  state = {
    leftPaneSize: 400,

    currentWorkspaceId: '0',

    taskLoading: true,
    taskExists: false,

    taskId: null,
    isDemoTask: false,
    selectedDomains: [],
    selectedUrls: [],
    selectedQueries: [],

    currentTaskView: 'default',
    honestSignalsInTable: {
      sourceDomain: true,
      sourcePage: false,
      sourcePageDuration: false,
      updateTime: true,
      captureTime: false,
      popularity: true,
      versions: false,
      searchQuery: false,
      code: false
    }
  };

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    this.setState({
      taskId
      // isDemoTask: taskId === 'z2Xs6eFIvi7sw1fCl1a6' // taskId === 'fnbS9l31Y6rMBj0CrsQA'
    });

    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let task = { id: snapshot.id, ...snapshot.data() };
          const isDemoTask =
            task.creationDate.toDate() > new Date('2020-02-01');
          // console.log(isDemoTask);
          this.setState({ isDemoTask });

          this.setState({
            taskLoading: false,
            taskExists: task.trashed ? false : true
          });
          if (!task.trashed) {
            this.props.setDisplayingTaskIdAndName(task.id, task.name);
          }
        } else {
          this.setState({ taskLoading: false, taskExists: false });
        }
      }
    );

    this.setState({
      leftPaneSize: localStorage.getItem('split-pane-left-size')
        ? parseInt(localStorage.getItem('split-pane-left-size'), 10)
        : 400
    });

    this.setCurrentTaskView('trustworthiness');
  }

  setCurrentWorkspaceId = workspaceId => {
    this.setState({ currentWorkspaceId: workspaceId });
  };

  componentWillUnmount() {
    this.unsubscribeTaskId();
  }

  setCurrentTaskView = toView => {
    let honestSignals = {
      sourceDomain: false,
      sourcePage: false,
      sourcePageDuration: false,
      updateTime: false,
      captureTime: false,
      popularity: false,
      versions: false,
      searchQuery: false,
      code: false
    };
    switch (toView) {
      case 'default':
        // honestSignals.sourceDomain = true;
        break;
      case 'context':
        honestSignals.sourceDomain = true;
        honestSignals.searchQuery = true;
        honestSignals.versions = true;
        break;
      case 'trustworthiness':
        honestSignals.sourceDomain = true;
        honestSignals.updateTime = true;
        honestSignals.popularity = true;
        break;
      case 'thoroughness':
        honestSignals.sourceDomain = true;
        honestSignals.sourcePage = true;
        honestSignals.sourcePageDuration = true;
        honestSignals.captureTime = true;
        honestSignals.code = true;
        break;
      default:
        break;
    }
    this.setState({
      currentTaskView: toView,
      honestSignalsInTable: honestSignals
    });
  };

  render() {
    const { taskLoading, taskExists } = this.state;

    if (taskLoading) {
      return (
        <div className={styles.TaskNotExistsContainer}>
          <Spinner size="40px" />
        </div>
      );
    }

    if (!taskExists) {
      return (
        <div className={styles.TaskNotExistsContainer}>
          <div style={{ width: '80%', textAlign: 'center' }}>
            Oops, the task you want to visit has not been created yet, or the
            owner has deleted it.
          </div>
        </div>
      );
    }

    return (
      <React.Fragment>
        <TaskContext.Provider
          value={{
            currentTaskId: this.state.taskId,
            isDemoTask: this.state.isDemoTask,
            selectedDomains: this.state.selectedDomains,
            addSelectedDomain: item => {
              let selectedDomains = [...this.state.selectedDomains];
              if (selectedDomains.indexOf(item) === -1) {
                selectedDomains.push(item);
              } else {
                selectedDomains = selectedDomains.filter(i => i !== item);
              }
              this.setState({ selectedDomains });
            },
            selectedQueries: this.state.selectedQueries,
            addSelectedQuery: item => {
              let selectedQueries = [...this.state.selectedQueries];
              if (selectedQueries.indexOf(item) === -1) {
                selectedQueries.push(item);
              } else {
                selectedQueries = selectedQueries.filter(i => i !== item);
              }
              this.setState({ selectedQueries });
            },
            selectedUrls: this.state.selectedUrls,
            addSelectedUrl: item => {
              let selectedUrls = [...this.state.selectedUrls];
              if (selectedUrls.indexOf(item) === -1) {
                selectedUrls.push(item);
              } else {
                selectedUrls = selectedUrls.filter(i => i !== item);
              }
              this.setState({ selectedUrls });
            },
            currentTaskView: this.state.currentTaskView,
            setCurrentTaskView: this.setCurrentTaskView,
            honestSignalsInTable: this.state.honestSignalsInTable
          }}
        >
          <div className={styles.SingleTaskPageContainer}>
            {/* Task View Tabs */}
            <div className={styles.TaskViewTabsContainer}>
              <Button
                variant={'outlined'}
                onClick={() => {
                  this.setCurrentTaskView('default');
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'default'
                    ? styles.CurrentViewControlButtonDefault
                    : null
                ].join(' ')}
              >
                Default View
              </Button>
              <Button
                variant={'outlined'}
                onClick={() => {
                  this.setCurrentTaskView('context');
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'context'
                    ? styles.CurrentViewControlButtonTaskContext
                    : null
                ].join(' ')}
              >
                <GoPackage className={styles.ViewControlButtonIcon} />
                Context View
              </Button>
              <Button
                variant={'outlined'}
                onClick={() => {
                  this.setCurrentTaskView('trustworthiness');
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'trustworthiness'
                    ? styles.CurrentViewControlButtonTrustworthiness
                    : null
                ].join(' ')}
              >
                <FaMedal className={styles.ViewControlButtonIcon} />
                Trustworthiness View
              </Button>
              <Button
                variant={'outlined'}
                onClick={() => {
                  this.setCurrentTaskView('thoroughness');
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'thoroughness'
                    ? styles.CurrentViewControlButtonThoroughness
                    : null
                ].join(' ')}
              >
                <GoTasklist className={styles.ViewControlButtonIcon} />
                Thoroughness View
              </Button>
            </div>

            {/* Split pane: overview + table */}
            <SplitPane
              split="vertical"
              minSize={50}
              maxSize={800}
              pane2Style={{ width: '100%' }} //     ? parseInt(localStorage.getItem('split-pane-left-size'), 10) //   localStorage.getItem('split-pane-left-size') // defaultSize={
              //     : 400
              // }
              size={this.state.leftPaneSize}
              onChange={size => {
                // console.log('size');
                // this.setState({ leftPaneSize: size });
              }}
              onDragFinished={size => {
                // console.log('finish');
                this.setState({ leftPaneSize: size });
                localStorage.setItem('split-pane-left-size', size);
              }}
            >
              <div className={styles.LeftPane}>
                <CollectionView
                  userId={this.props.userId}
                  currentWorkspaceId={this.state.currentWorkspaceId}
                />
              </div>
              <div className={styles.RightPane}>
                <WorkspaceView
                  userId={this.props.userId}
                  setCurrentWorkspaceId={this.setCurrentWorkspaceId}
                />
              </div>
            </SplitPane>
            {/*
          <div className={styles.LeftPane}>
            <CollectionView />
          </div>
          <div className={styles.RightPane}>
            <WorkspaceView />
          </div>
      */}
          </div>
        </TaskContext.Provider>
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskPage);
