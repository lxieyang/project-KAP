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

import {
  FaBoxOpen as ContextIcon,
  FaHandshake as TrustIcon,
  FaTasks as CompletenessIcon
} from 'react-icons/fa';
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
    selectedSnippets: [],
    selectedCells: [],
    cellColors: {},
    otherOptions: [],

    currentTaskView: 'default',
    activeSections: [],
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

    this.setCurrentTaskView('context');
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
              }
              this.setState({ selectedDomains });
            },
            removeSelectedDomain: item => {
              let selectedDomains = [...this.state.selectedDomains];
              if (selectedDomains.indexOf(item) === -1) {
                return;
              } else {
                selectedDomains = selectedDomains.filter(i => i !== item);
              }
              this.setState({ selectedDomains });
            },
            setSelectedDomains: (domains = []) => {
              this.setState({ selectedDomains: domains });
            },
            clearSelectedDomains: () => {
              this.setState({ selectedDomains: [] });
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
            setSelectedUrls: urls => {
              this.setState({ selectedUrls: urls });
            },
            clearSelectedUrls: () => {
              this.setState({ selectedUrls: [] });
            },
            selectedSnippets: this.state.selectedSnippets,
            setSelectedSnippets: ids => {
              this.setState({ selectedSnippets: ids });
            },
            clearSelectedSnippets: () => {
              this.setState({ selectedSnippets: [] });
            },
            selectedCells: this.state.selectedCells,
            setSelectedCells: cells => {
              this.setState({ selectedCells: cells });
            },
            clearSelectedCells: () => {
              this.setState({ selectedCells: [] });
            },
            cellColors: this.state.cellColors,
            setCellColors: cellColors => {
              this.setState({ cellColors });
            },
            otherOptions: this.state.otherOptions,
            addToOtherOptions: ({ original, alternatives }) => {
              if (
                this.state.otherOptions.filter(o => o.original === original)
                  .length > 0
              ) {
                let otherOptions = [...this.state.otherOptions];
                otherOptions = otherOptions.map(o => {
                  if (o.original === original) {
                    o.alternatives = alternatives;
                  }
                  return o;
                });
                this.setState({ otherOptions });
              } else {
                let otherOptions = [...this.state.otherOptions];
                otherOptions.push({ original, alternatives });
                this.setState({ otherOptions });
              }
            },
            currentTaskView: this.state.currentTaskView,
            setCurrentTaskView: this.setCurrentTaskView,
            activeSections: this.state.activeSections,
            setActiveSections: sectionNames => {
              this.setState({ activeSections: sectionNames });
            },
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
                  this.setState({ activeSections: [] });
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'default'
                    ? styles.ViewControlButtonActive // styles.CurrentViewControlButtonDefault
                    : null
                ].join(' ')}
              >
                Default View
              </Button>
              <Button
                variant={'outlined'}
                onClick={() => {
                  this.setCurrentTaskView('context');
                  this.setState({ activeSections: [] });
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'context'
                    ? styles.ViewControlButtonActive // styles.CurrentViewControlButtonTaskContext
                    : null
                ].join(' ')}
              >
                <ContextIcon className={styles.ViewControlButtonIcon} />
                Context View
              </Button>
              <Button
                variant={'outlined'}
                onClick={() => {
                  this.setCurrentTaskView('trustworthiness');
                  this.setState({ activeSections: [] });
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'trustworthiness'
                    ? styles.ViewControlButtonActive // styles.CurrentViewControlButtonTrustworthiness
                    : null
                ].join(' ')}
              >
                <TrustIcon className={styles.ViewControlButtonIcon} />
                Trustworthiness View
              </Button>
              <Button
                variant={'outlined'}
                onClick={() => {
                  this.setCurrentTaskView('thoroughness');
                  this.setState({ activeSections: [] });
                }}
                size="small"
                className={[
                  styles.ViewControlButton,
                  this.state.currentTaskView === 'thoroughness'
                    ? styles.ViewControlButtonActive // styles.CurrentViewControlButtonThoroughness
                    : null
                ].join(' ')}
              >
                <CompletenessIcon className={styles.ViewControlButtonIcon} />
                Thoroughness View
              </Button>
            </div>

            {/* Split pane: overview + table */}
            <div className={styles.SplitPaneContainer}>
              <SplitPane
                split="vertical"
                style={{ height: '100%' }}
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
            </div>
          </div>
        </TaskContext.Provider>
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskPage);
