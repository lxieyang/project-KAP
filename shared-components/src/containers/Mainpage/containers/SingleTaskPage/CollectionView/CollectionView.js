import React, { Component } from 'react';
// import { withRouter } from 'react-router-dom';
import styles from './CollectionView.css';

import TaskStatusView from './TaskStatusView/TaskStatusView';
import PiecesView from './PiecesView/PiecesView';

import { withStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import SwipeableViews from 'react-swipeable-views';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

import { FaSearch, FaBookmark, FaCode } from 'react-icons/fa';
import { MdDomain } from 'react-icons/md';
import { IoIosBrowsers } from 'react-icons/io';

import TaskContext from '../../../../../shared/task-context';
import SourceDomainsView from './SourceDomainsView/SourceDomainsView';
import SourcePagesView from './SourcePagesView/SourcePagesView';
import SourceQueriesView from './SourceQueriesView/SourceQueriesView';
import CodeSnippetsView from './CodeSnippetsView/CodeSnippetsView';

import OverviewPanelV2 from './OverviewPanelV2/OverviewPanelV2';
import OverviewPanelV3 from './OverviewPanelV3/OverviewPanelV3';

import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import moment from 'moment';

const StyledTab = withStyles({
  root: {
    minWidth: 40,
    minHeight: 36
  },
  label: {
    fontSize: '14px',
    textTransform: 'capitalize',
    overflow: 'hidden'
  },
  labelContainer: {
    padding: '6px 4px'
  }
})(Tab);

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && <React.Fragment>{children}</React.Fragment>}
    </Typography>
  );
}

class CollectionView extends Component {
  static contextType = TaskContext;

  state = {
    tabValue: 0,

    searchQueries: [],
    visitedPages: [],
    pieces: [],
    cells: []
  };

  componentDidMount() {
    this.unsubSearchQueries = FirestoreManager.getAllSearchQueriesInTask(
      this.context.currentTaskId
    ).onSnapshot(querySnapshot => {
      let queries = [];
      querySnapshot.forEach(snapshot => {
        queries.push({
          id: snapshot.id,
          ...snapshot.data(),
          creationDate: snapshot.data().creationDate.toDate(),
          updateDate: snapshot.data().updateDate.toDate()
        });
      });
      // console.log(queries);
      this.setState({ searchQueries: queries });
    });

    this.unsubVisitedPages = FirestoreManager.getVisitedPagesInTask(
      this.context.currentTaskId
    ).onSnapshot(querySnapshot => {
      let pages = [];
      querySnapshot.forEach(snapshot => {
        const data = snapshot.data();
        const creationDate = data.creationDate.toDate().getTime();
        const updateDate = data.updateDate.toDate().getTime();
        const leaveDate = data.leaveDate
          ? data.leaveDate.toDate().getTime()
          : new Date().getTime();

        let duration = null;
        if (leaveDate !== null) {
          duration = leaveDate - updateDate;
        }

        pages.push({
          id: snapshot.id,
          ...snapshot.data(),
          creationDate,
          updateDate,
          leaveDate,
          duration,
          domain: new URL(snapshot.data().url).hostname
        });
      });
      this.setState({ visitedPages: pages });
    });

    this.unsubscribePieces = FirestoreManager.getAllPiecesInTask(
      this.context.currentTaskId
    )
      .orderBy('creationDate', 'desc')
      .onSnapshot(querySnapshot => {
        let pieces = [];
        querySnapshot.forEach(doc => {
          pieces.push({ id: doc.id, ...doc.data() });
        });
        this.setState({ pieces });
      });

    FirestoreManager.getAllWorkspacesInTask(this.context.currentTaskId)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          let workspaceId = snapshot.docs[0].id;
          FirestoreManager.getAllTableCellsInTableById(workspaceId)
            .get()
            .then(cellsSnapshot => {
              if (!cellsSnapshot.empty) {
                let cells = [];
                cellsSnapshot.forEach(snapshot => {
                  cells.push({
                    id: snapshot.id,
                    ...snapshot.data()
                  });
                });
                this.setState({ cells });
              }
            });
        }
      });
  }

  componentWillUnmount() {
    if (this.unsubSearchQueries) {
      this.unsubSearchQueries();
    }

    if (this.unsubVisitedPages) {
      this.unsubVisitedPages();
    }

    if (this.unsubscribePieces) {
      this.unsubscribePieces();
    }
  }

  handleChange = (event, newValue) => {
    this.setState({ tabValue: newValue });
  };

  render() {
    const { isDemoTask } = this.context;
    const { tabValue } = this.state;

    return (
      <React.Fragment>
        <TaskStatusView
          userId={this.props.userId}
          queries={this.state.searchQueries}
          pages={this.state.visitedPages}
          pieces={this.state.pieces}
          cells={this.state.cells}
          changeTab={this.handleChange}
        />
        <Divider light />

        {/* <OverviewPanelV2
          userId={this.props.userId}
          queries={this.state.searchQueries}
          pages={this.state.visitedPages}
          pieces={this.state.pieces}
        /> */}

        {/* <OverviewPanelV3
          userId={this.props.userId}
          queries={this.state.searchQueries}
          pages={this.state.visitedPages}
          pieces={this.state.pieces}
        /> */}

        {/* <Tabs
          value={tabValue}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          onChange={this.handleChange}
        >
          <StyledTab
            label={
              <div className={styles.TabLabelContainer}>
                <MdDomain className={styles.TabLabelIcon} /> Sources
              </div>
            }
          />
         
          <StyledTab
            label={
              <div className={styles.TabLabelContainer}>
                <FaSearch className={styles.TabLabelIcon} /> Queries
              </div>
            }
          />
          <StyledTab
            label={
              <div className={styles.TabLabelContainer}>
                <FaCode className={styles.TabLabelIcon} /> Code Snippets
              </div>
            }
          />
          <StyledTab
            label={
              <div className={styles.TabLabelContainer}>
                <FaBookmark className={styles.TabLabelIcon} /> Snippets
              </div>
            }
          />
        </Tabs>

        <SwipeableViews
          index={tabValue}
          onChangeIndex={this.handleChange}
          style={{ height: '100%' }}
          containerStyle={{ height: '100%' }}
          disableLazyLoading
        >
          <TabPanel value={tabValue} index={0}>
            <SourceDomainsView
              queries={this.state.searchQueries}
              pages={this.state.visitedPages}
              pieces={this.state.pieces}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <SourceQueriesView
              queries={this.state.searchQueries}
              pages={this.state.visitedPages}
              pieces={this.state.pieces}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <CodeSnippetsView
              queries={this.state.searchQueries}
              pages={this.state.visitedPages}
              pieces={this.state.pieces}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <PiecesView
              userId={this.props.userId}
              currentWorkspaceId={this.props.currentWorkspaceId}
            />
          </TabPanel>
        </SwipeableViews> */}
      </React.Fragment>
    );
  }
}

// export default withRouter(CollectionView);
export default CollectionView;
