import React, { Component } from 'react';
import styles from './ContextPanel.css';

import ReactHoverObserver from 'react-hover-observer';
import { sortBy, reverse } from 'lodash';

import { AiOutlineSearch } from 'react-icons/ai';
import { AiFillGoogleCircle as SearchIcon } from 'react-icons/ai';
import { GiTargeting } from 'react-icons/gi';
import Avatar from '@material-ui/core/Avatar';
import {
  IoIosArrowDropup,
  IoIosArrowDropdown,
  IoIosTimer,
  IoMdGlobe
} from 'react-icons/io';
import { FaFlagCheckered, FaListUl, FaBookmark } from 'react-icons/fa';
import moment from 'moment';
import {
  PIECE_TYPES,
  SECTION_TYPES
} from '../../../../../../../../shared/types';
import { PIECE_COLOR } from '../../../../../../../../shared/theme';

import TaskContext from '../../../../../../../../shared/task-context';

import InfoTooltip from '../components/InfoTooltip/InfoTooltip';

import Textarea from 'react-textarea-autosize';

import * as FirestoreManager from '../../../../../../../../firebase/firestore_wrapper';

import Section from '../components/Section/Section';
import Entry from '../components/Section/Entry/Entry';

class QuerySection extends Component {
  static contextType = TaskContext;
  state = {
    queries: [],

    sortByOption: 'number of snippets' // 'timestamp', 'duration' 'number of snippets'
  };

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.queries !== this.props.queries &&
      this.props.queries.length > 0
    ) {
      this.updateData();
    }
  }

  updateData = () => {
    let { queries, pieces, pages } = this.props;

    pages = pages.map(page => {
      const piecesInPage = pieces.filter(
        item => item.references.url === page.url
      );
      // .map(item => item.id);
      page.piecesInPage = piecesInPage;
      page.piecesNumber = piecesInPage.length;
      return page;
    });

    pages = reverse(sortBy(pages, ['piecesNumber']));

    queries = sortBy(
      queries.map((q, idx) => {
        return {
          ...q,
          creationDate: new Date(q.creationDate).getTime()
        };
      }),
      ['creationDate']
    );

    for (let i = 0; i < queries.length; i++) {
      let query = queries[i];
      let nextQuery = null;
      if (i !== queries.length - 1) {
        nextQuery = queries[i + 1];
      }

      if (nextQuery) {
        query.pages = pages.filter(
          p =>
            p.creationDate >= query.creationDate &&
            p.creationDate < nextQuery.creationDate
        );
      } else {
        query.pages = pages.filter(p => p.creationDate >= query.creationDate);
      }

      query.pagesNumber = query.pages.length;

      // TODO: remove this
      // rectify page duration for older versions
      query.pages = query.pages.map(p => {
        const minDuration = p.duration / 1000 / 60;
        const secDuration = p.duration / 1000;

        if (minDuration > 10) {
          p.duration = 10 * 60 * 1000;
        } else if (secDuration < 5) {
          p.duration = 2 * 60 * 1000;
        }
        return p;
      });

      // calculate query duration
      query.duration = query.pages
        .map(p => p.duration)
        .reduce((a, b) => {
          return a + b;
        }, 0);

      // gather pieces in the query
      query.piecesInQuery = [];
      query.pages.forEach(p => {
        let pieceIds = p.piecesInPage.map(piece => piece.id);
        query.piecesInQuery = query.piecesInQuery.concat(pieceIds);
      });

      query.piecesNumber = query.piecesInQuery.length;
    }

    this.setState({ queries });
  };

  render() {
    let { queries, sortByOption } = this.state;

    if (sortByOption === 'timestamp') {
      queries = sortBy(queries, ['creationDate']);
    } else if (sortByOption === 'duration') {
      queries = reverse(sortBy(queries, ['duration']));
    } else if (sortByOption === 'number of snippets') {
      queries = reverse(sortBy(queries, ['piecesNumber']));
    }

    return (
      <Section headerName={SECTION_TYPES.section_queries} headerContent={''}>
        The searches that the author made:
        <div className={styles.QuerySortByContainer}>
          <strong>Sort by</strong>:&nbsp;
          <div
            className={[
              styles.SortByOption,
              sortByOption === 'timestamp' ? styles.Active : null
            ].join(' ')}
            onClick={_ => this.setState({ sortByOption: 'timestamp' })}
          >
            timestamp
          </div>
          <div
            className={[
              styles.SortByOption,
              sortByOption === 'duration' ? styles.Active : null
            ].join(' ')}
            onClick={_ => this.setState({ sortByOption: 'duration' })}
          >
            duration
          </div>
          <div
            className={[
              styles.SortByOption,
              sortByOption === 'number of snippets' ? styles.Active : null
            ].join(' ')}
            onClick={_ => this.setState({ sortByOption: 'number of snippets' })}
          >
            number of snippets
          </div>
        </div>
        <div className={styles.SearchQueriesContainer}>
          {queries.map((query, idx) => {
            return (
              <ReactHoverObserver
                key={idx}
                {...{
                  onHoverChanged: ({ isHovering }) => {
                    if (isHovering) {
                      this.context.setSelectedSnippets(query.piecesInQuery);
                    } else {
                      this.context.clearSelectedSnippets();
                    }
                  }
                }}
              >
                <div className={styles.QueryItem}>
                  <SearchIcon className={styles.QueryIcon} /> {query.query}
                  <div style={{ flex: 1 }} />
                  <div className={styles.QueryMetadata}>
                    {/* Timestamp */}
                    {sortByOption === 'timestamp' &&
                      moment(query.creationDate).format('h:mma')}
                    {/* duration */}
                    {sortByOption === 'duration' &&
                      moment.duration(query.duration).humanize()}
                    {/* number of snippets */}
                    {sortByOption === 'number of snippets' &&
                      `${query.piecesNumber} snippets`}
                  </div>
                </div>
              </ReactHoverObserver>
            );
          })}
        </div>
      </Section>
    );
  }
}

class VersionSection extends Component {
  render() {
    return (
      <Section headerName={SECTION_TYPES.section_versions} headerContent={''}>
        versions
      </Section>
    );
  }
}

class GoalSection extends Component {
  render() {
    return (
      <Section headerName={SECTION_TYPES.section_goals} headerContent={''}>
        goals and constraints
      </Section>
    );
  }
}

class ContextPanel extends Component {
  state = {
    goalText: '',
    isGoalTheFirstQuery: false,

    environments: [],
    constraints: [],

    isAddingNewEnv: false, // false,
    newEnvType: 'constraint',
    newEnvText: ''
  };

  componentDidMount() {
    this.updatePanelState();

    this.unsubEnv = FirestoreManager.getTaskEnvironmentsAndConstraints(
      this.props.task.id
    ).onSnapshot(querySnapshot => {
      let environments = [];
      let constraints = [];
      querySnapshot.forEach(snapshot => {
        let data = { ...snapshot.data(), id: snapshot.id };
        if (data.type === 'environment') {
          environments.push(data);
        } else if (data.type === 'constraint') {
          constraints.push(data);
        }
      });
      environments = sortBy(environments, ['creationDate']);
      constraints = sortBy(constraints, ['creationDate']);
      this.setState({ environments, constraints });
      // console.log(environments, constraints);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.task !== this.props.task ||
      prevProps.queries !== this.props.queries
    ) {
      this.updatePanelState();
    }
  }

  updatePanelState = () => {
    let { queries, task } = this.props;
    queries = sortBy(queries, ['creationDate']);
    if (task.goal === undefined || task.goal === null || task.goal === '') {
      // check query
      if (queries.length > 0) {
        this.setState({
          goalText: queries[0].query,
          isGoalTheFirstQuery: true
        });
      }
    } else {
      this.setState({ goalText: task.goal });
      if (queries.length > 0 && queries[0].query === task.goal) {
        this.setState({ isGoalTheFirstQuery: true });
      } else {
        this.setState({ isGoalTheFirstQuery: false });
      }
    }
  };

  handleGoalTextChange = e => {
    this.setState({ goalText: e.target.value });
  };

  updateTaskGoal = () => {
    let goal = this.state.goalText.trim();
    if (goal !== null && goal !== this.props.task.goal) {
      FirestoreManager.updateTaskGoal(this.props.task.id, goal);
    }
  };

  addNewEnvButtonClickedHandler = () => {
    this.setState({ isAddingNewEnv: true });
    setTimeout(() => {
      this.newEnvTextarea.focus();
    }, 50);
  };

  switchNewEnvType = e => {
    this.setState({ newEnvType: e.target.value });
  };

  handleNewEnvTextChange = e => {
    this.setState({ newEnvText: e.target.value });
  };

  addNewEnvClickedHandler = () => {
    let newEnvText = this.state.newEnvText.trim();

    let newEnvType = this.state.newEnvType;
    this.setState({ isAddingNewEnv: false, newEnvText: '' });

    if (newEnvText === '') {
      return;
    }

    if (newEnvType === 'constraint') {
      FirestoreManager.addTaskConstraint(this.props.task.id, {
        name: newEnvText
      });
    } else {
      FirestoreManager.addTaskEnvironment(this.props.task.id, {
        name: newEnvText,
        suggested: false
      });
    }
  };

  cancelNewEnvClickedHandler = () => {
    this.setState({
      isAddingNewEnv: false,
      mewEnvText: ''
    });
  };

  deleteEnvClickedHandler = (id, name) => {
    console.log(id, name);
    if (window.confirm(`Are you sure you would like to delete '${name}'?`)) {
      FirestoreManager.removeTaskEnvrionmentOrConstraint(
        this.props.task.id,
        id
      );
    }
  };

  render() {
    let { queries, pieces, pages } = this.props;
    queries = sortBy(queries, ['creationDate']);
    // console.log(queries);

    const queriesToDisplay = queries
      ? queries.filter((q, idx) => {
          if (idx > 2) {
            return false;
          }
          return true;
        })
      : [];

    const piecesWithEnvironments = pieces.filter(
      p =>
        p.answerMetaInfo &&
        p.answerMetaInfo.questionTags &&
        p.answerMetaInfo.questionTags.length > 0
    );

    const existingEnvTags = {};
    piecesWithEnvironments.forEach(p => {
      const tags = p.answerMetaInfo.questionTags;
      tags.forEach(t => {
        if (existingEnvTags[t]) {
          // existingEnvTags[t]
          existingEnvTags[t].pieceIds.push(p.id);
          existingEnvTags[t].count += 1;
          existingEnvTags[t].urls.add(p.references.url);
        } else {
          existingEnvTags[t] = {
            pieceIds: [p.id],
            count: 1,
            urls: new Set([p.references.url])
          };
        }
      });
    });
    let existingEnvTagsList = [];
    for (let t in existingEnvTags) {
      existingEnvTagsList.push({ name: t, ...existingEnvTags[t] });
    }
    existingEnvTagsList = reverse(sortBy(existingEnvTagsList, ['count']));
    // console.log(existingEnvTagsList);

    const envList = existingEnvTagsList.concat(this.state.environments);

    return (
      <div className={styles.PanelContainer}>
        {/* query section */}
        <QuerySection queries={queries} pieces={pieces} pages={pages} />

        {/* version section */}
        <VersionSection />

        {/* goals section */}
        <GoalSection />

        <h3 style={{ color: 'red' }}>old stuff below</h3>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <GiTargeting className={styles.SectionHeaderIcon} />
            Goal{' '}
            <InfoTooltip id={'goal'}>
              This is the goal of the author (default is the first search query
              that the author used unless the author specifically edited it)
            </InfoTooltip>
          </div>
          <div
            className={[
              styles.SectionContent,
              styles.GoalTextareaContainer
            ].join(' ')}
          >
            {/* <p>{this.state.goalText}</p> */}
            <Textarea
              minRows={1}
              maxRows={3}
              className={styles.Textarea}
              value={this.state.goalText}
              placeholder={this.props.task.name}
              onChange={this.handleGoalTextChange}
              onBlur={() => this.updateTaskGoal()}
            />
          </div>
          <div className={styles.SectionFooter}>
            {this.state.isGoalTheFirstQuery === true && (
              <div>
                <div className={styles.FirstQueryIndicator}>
                  Using the author's first search query as a default.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <IoIosTimer className={styles.SectionHeaderIcon} />
            Information is <span className={styles.UpToDate}>
              up-to-date
            </span>{' '}
          </div>
          <div className={styles.SectionContent}>
            <p>The task was updated 4 days ago.</p>
            <p>The oldest information was from 1 year ago.</p>
          </div>
        </div> */}

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <AiOutlineSearch className={styles.SectionHeaderIcon} />
            The author searched for
            <InfoTooltip id={'criteria'}>
              These are the top search queries that the author used.
            </InfoTooltip>
          </div>
          <div className={styles.SectionContent}>
            {queriesToDisplay.map((item, idx) => {
              return (
                <div key={idx} className={styles.ListItem}>
                  {item.query}
                </div>
              );
            })}
          </div>
          <div className={styles.SectionFooter}>
            <div
              className={styles.LinkToElsewhere}
              onClick={e => this.props.changeTab(e, 1)}
            >
              See the complete list of search queries
            </div>
            <div style={{ color: 'red' }}>
              put the complete list of search queries here
            </div>
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <IoMdGlobe className={styles.SectionHeaderIcon} />
            Envrionment and Versions
            <div className={styles.HeaderButtonAlignRight}>
              <div
                className={styles.AddButton}
                onClick={() => this.addNewEnvButtonClickedHandler()}
              >
                Add
              </div>
            </div>
          </div>

          <div className={styles.SectionContent}>
            <div>
              {envList.map((item, idx) => {
                return (
                  <div key={idx} className={styles.ListItem}>
                    {item.name}
                    {item.id && (
                      <div
                        className={styles.DeleteIcon}
                        onClick={() =>
                          this.deleteEnvClickedHandler(item.id, item.name)
                        }
                      >
                        &#10005;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              {this.state.constraints.map((item, idx) => {
                return (
                  <div key={idx} className={styles.ListItem}>
                    {item.name}
                    <div
                      className={styles.DeleteIcon}
                      onClick={() =>
                        this.deleteEnvClickedHandler(item.id, item.name)
                      }
                    >
                      &#10005;
                    </div>
                  </div>
                );
              })}
            </div>

            {this.state.environments.length === 0 &&
              this.state.constraints.length === 0 && (
                <div style={{ fontStyle: 'italic', color: '#666' }}>
                  nothing yet
                </div>
              )}

            {this.state.isAddingNewEnv && (
              <div className={styles.AddingNewEnvContainer}>
                <div style={{ fontStyle: 'italic' }}>Adding new:</div>
                <div>
                  <input
                    type="radio"
                    name="env-type"
                    id="environment"
                    value="environment"
                    checked={this.state.newEnvType === 'environment'}
                    onChange={e => this.switchNewEnvType(e)}
                  />
                  <label htmlFor="environment">Environment</label> &nbsp;
                  <input
                    type="radio"
                    name="env-type"
                    id="constraint"
                    value="constraint"
                    checked={this.state.newEnvType === 'constraint'}
                    onChange={e => this.switchNewEnvType(e)}
                  />
                  <label htmlFor="constraint">Constraint</label>
                </div>
                <div>
                  <Textarea
                    minRows={1}
                    maxRows={3}
                    className={[styles.Textarea, styles.NewEnv].join(' ')}
                    placeholder={`New ${this.state.newEnvType}`}
                    value={this.state.newEnvText}
                    onChange={e => this.handleNewEnvTextChange(e)}
                    inputRef={ref => (this.newEnvTextarea = ref)}
                  />
                </div>
                <div
                  style={{
                    marginTop: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}
                >
                  <button
                    className={[
                      styles.AddNewEnvButton,
                      this.state.newEnvText === '' ? styles.Disabled : null
                    ].join(' ')}
                    onClick={this.addNewEnvClickedHandler}
                  >
                    Add
                  </button>
                  &nbsp;&nbsp;
                  <button
                    className={[styles.CancelEnvButton].join(' ')}
                    onClick={this.cancelNewEnvClickedHandler}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ContextPanel;
