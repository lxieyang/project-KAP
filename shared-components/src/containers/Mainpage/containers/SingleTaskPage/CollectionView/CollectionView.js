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

import { FaSearch, FaBookmark } from 'react-icons/fa';
import { MdDomain } from 'react-icons/md';
import { IoIosBrowsers } from 'react-icons/io';

import TaskContext from '../../../../../shared/task-context';
import SourceDomainsView from './SourceDomainsView/SourceDomainsView';
import SourcePagesView from './SourcePagesView/SourcePagesView';
import SourceQueriesView from './SourceQueriesView/SourceQueriesView';

import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';

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
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <div>{children}</div>}
    </Typography>
  );
}

class CollectionView extends Component {
  static contextType = TaskContext;

  state = {
    tabValue: 2,

    searchQueries: [],
    visitedPages: []
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
      console.log(queries);
      this.setState({ searchQueries: queries });
    });

    this.unsubVisitedPages = FirestoreManager.getVisitedPagesInTask(
      this.context.currentTaskId
    ).onSnapshot(querySnapshot => {
      let pages = [];
      querySnapshot.forEach(snapshot => {
        pages.push({
          id: snapshot.id,
          ...snapshot.data(),
          creationDate: snapshot.data().creationDate.toDate(),
          updateDate: snapshot.data().updateDate.toDate(),
          domain: new URL(snapshot.data().url).hostname
        });
      });
      this.setState({ visitedPages: pages });
    });
  }

  componentWillUnmount() {
    if (this.unsubSearchQueries) {
      this.unsubSearchQueries();
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
        <TaskStatusView userId={this.props.userId} />
        <Divider light />

        <Tabs
          value={tabValue}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          onChange={this.handleChange}
          aria-label="disabled tabs example"
        >
          <StyledTab
            label={
              <div className={styles.TabLabelContainer}>
                <MdDomain className={styles.TabLabelIcon} /> Domains
              </div>
            }
          />
          <StyledTab
            label={
              <div className={styles.TabLabelContainer}>
                <IoIosBrowsers className={styles.TabLabelIcon} /> Pages
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
                <FaBookmark className={styles.TabLabelIcon} /> Snippets
              </div>
            }
          />
        </Tabs>

        <SwipeableViews
          index={tabValue}
          onChangeIndex={this.handleChange}
          disableLazyLoading
        >
          <TabPanel value={tabValue} index={0}>
            <SourceDomainsView />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <SourcePagesView
              queries={this.state.searchQueries}
              pages={this.state.visitedPages}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <SourceQueriesView
              queries={this.state.searchQueries}
              pages={this.state.visitedPages}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <PiecesView
              userId={this.props.userId}
              currentWorkspaceId={this.props.currentWorkspaceId}
            />
          </TabPanel>
        </SwipeableViews>
      </React.Fragment>
    );
  }
}

// export default withRouter(CollectionView);
export default CollectionView;
