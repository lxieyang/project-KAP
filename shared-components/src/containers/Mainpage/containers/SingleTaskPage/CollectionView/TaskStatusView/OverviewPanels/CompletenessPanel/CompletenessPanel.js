import React, { Component } from 'react';
import styles from './CompletenessPanel.css';

import { sortBy, reverse } from 'lodash';
import CountArrayValues from 'count-array-values';

import { AiOutlineSearch } from 'react-icons/ai';
import { GiTargeting, GiMicroscope, GiBinoculars } from 'react-icons/gi';
import Avatar from '@material-ui/core/Avatar';
import {
  IoIosArrowDropup,
  IoIosArrowDropdown,
  IoMdMedal
} from 'react-icons/io';
import { FaFlagCheckered, FaListUl, FaBookmark } from 'react-icons/fa';
import { MdPinDrop } from 'react-icons/md';
import { TiUser } from 'react-icons/ti';

import {
  PIECE_TYPES,
  SECTION_TYPES
} from '../../../../../../../../shared/types';
import { PIECE_COLOR } from '../../../../../../../../shared/theme';

import TaskContext from '../../../../../../../../shared/task-context';
import InfoTooltip from '../components/InfoTooltip/InfoTooltip';

import axios from 'axios';

import lemmatize from 'wink-lemmatizer';

import moment from 'moment';

import Section from '../components/Section/Section';
import Entry from '../components/Section/Entry/Entry';

import RandGen from 'random-seed';

import TimelineComponent from '../components/TimelineComponent/TimelineComponent';

class EffortSection extends Component {
  state = {
    queries: [],
    pages: [],
    pieces: [],
    cells: [],
    task: null,

    effortSpentStatus: 'neutral',
    taskDuration: 0,
    taskUpdateDate: new Date(),
    infoCollectedStatus: 'neutral'
  };

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate(prevProps) {
    if (
      (prevProps.pieces !== this.props.pieces &&
        this.props.pieces.length > 0) ||
      (prevProps.task !== this.props.task && this.props.task !== null) ||
      (prevProps.pages !== this.props.pages && this.props.pages.length > 0) ||
      (prevProps.queries !== this.props.queries &&
        this.props.queries.length > 0) ||
      (prevProps.cells !== this.props.cells && this.props.cells.length > 0)
    ) {
      this.updateData();
    }
  }

  updateData = () => {
    let { queries, pieces, pages, task, cells } = this.props;

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

    this.setState({ queries, pieces, pages, task, cells });

    let { creationDate, updateDate } = task;
    creationDate = creationDate.toDate();
    updateDate = updateDate ? updateDate.toDate() : new Date();
    const approxDuration = updateDate - creationDate;
    this.setState({ taskUpdateDate: updateDate });

    /* effort spent */
    // TODO: actually do this
    this.setState({ effortSpentStatus: 'good' });
    if (task) {
      let taskId = task.id;
      let gen = RandGen.create(taskId);
      let duration = (gen.range(120) + 45) * 60 * 1000;
      this.setState({ taskDuration: duration });
    }

    /* stuff collected */
    if (
      pages.length <= 3 ||
      pieces.length < 6 ||
      pieces.filter(p => p.pieceType === PIECE_TYPES.option).length < 2 ||
      pieces.filter(p => p.pieceType === PIECE_TYPES.criterion).length < 2 ||
      pieces.filter(p => p.pieceType === PIECE_TYPES.snippet).length < 2
    ) {
      this.setState({ infoCollectedStatus: 'bad' });
    } else {
      this.setState({ infoCollectedStatus: 'good' });
    }
  };

  render() {
    const { queries, pieces, pages, task, cells } = this.state;

    return (
      <Section
        headerName={SECTION_TYPES.section_effort}
        headerContent={''}
        footer={
          <TimelineComponent
            shouldOpenOnMount={false}
            queries={queries}
            pieces={pieces}
            pages={pages}
            cells={cells}
          />
        }
        numOfWarnings={[
          this.state.effortSpentStatus === 'bad' ? 1 : 0,
          this.state.infoCollectedStatus === 'bad' ? 1 : 0
        ].reduce((a, b) => a + b)}
      >
        <Entry
          status={this.state.effortSpentStatus}
          content={
            <React.Fragment>
              <strong>Time spent </strong> - The author spent a total of{' '}
              <strong>
                {moment.duration(this.state.taskDuration).humanize()}
              </strong>{' '}
              on the task. The task was updated{' '}
              <strong>{moment(this.state.taskUpdateDate).fromNow()}</strong>.
            </React.Fragment>
          }
        />

        <Entry
          status={this.state.infoCollectedStatus}
          content={
            <React.Fragment>
              <strong>Information collected</strong> - The author went through{' '}
              <strong>{pages.length}</strong> pages, and collected{' '}
              <strong>{pieces.length}</strong> snippets, of which{' '}
              <strong>
                {pieces.filter(p => p.pieceType === PIECE_TYPES.option).length}
              </strong>{' '}
              are options,{' '}
              <strong>
                {
                  pieces.filter(p => p.pieceType === PIECE_TYPES.criterion)
                    .length
                }
              </strong>{' '}
              are criteria, and{' '}
              <strong>
                {pieces.filter(p => p.pieceType === PIECE_TYPES.snippet).length}
              </strong>{' '}
              are evidence snippets.
            </React.Fragment>
          }
        />
      </Section>
    );
  }
}

const getHTML = htmls => {
  let htmlString = ``;
  if (htmls !== undefined) {
    for (let html of htmls) {
      htmlString += html;
    }
  }
  return { __html: htmlString };
};

class CodeSection extends Component {
  state = {};

  render() {
    const { pieces } = this.props;
    const piecesWithCode = pieces
      .filter(p => p.codeSnippets.length > 0)
      .map(p => {
        let codeSnippets = p.codeSnippets.map(item => {
          return { content: item, pieceId: p.id };
        });
        return { ...p, codeSnippets };
      });
    console.log(piecesWithCode);

    const codeSnippets = piecesWithCode
      .map(p => p.codeSnippets)
      .reduce((a, b) => a.concat(b), []);
    console.log(codeSnippets);

    return (
      <Section headerName={SECTION_TYPES.section_code} headerContent={''}>
        <div className={styles.CodeContainer}>
          {codeSnippets.length > 0 && (
            <React.Fragment>
              <div>
                The author <strong>copied and used</strong> the following code:
              </div>
              <div
                className={styles.CodeHTML}
                dangerouslySetInnerHTML={getHTML(codeSnippets[0].content.html)}
              />
              {codeSnippets.length > 1 && (
                <React.Fragment>
                  <div>Other code examples from snippets:</div>
                  {codeSnippets.slice(1).map((code, idx) => {
                    return (
                      <div
                        key={idx}
                        className={styles.CodeHTML}
                        dangerouslySetInnerHTML={getHTML(code.content.html)}
                      />
                    );
                  })}
                </React.Fragment>
              )}
            </React.Fragment>
          )}
          {codeSnippets.length === 0 && (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              No code examples detected
            </div>
          )}
        </div>
      </Section>
    );
  }
}

class OtherOptionsSection extends Component {
  static contextType = TaskContext;
  state = {};

  render() {
    let { otherOptions } = this.context;

    const existingOptions = otherOptions.map(o => o.original);
    let alternatives = otherOptions
      .map(o => o.alternatives)
      .reduce((a, b) => a.concat(b), [])
      .filter(a => {
        if (existingOptions.includes(a)) {
          return false;
        } else if (existingOptions.some(op => op.includes(a))) {
          return false;
        } else {
          return true;
        }
      });

    const ordered = CountArrayValues(alternatives);

    return (
      <Section
        headerName={SECTION_TYPES.section_other_options}
        headerContent={''}
      >
        <div>
          Developers who searched for options that are in the table{' '}
          <strong>also searched for these other alternatives</strong>:
        </div>
        <div>
          {ordered.map((item, idx) => {
            return (
              <div key={idx} className={styles.ListItem}>
                {item.value}
              </div>
            );
          })}
        </div>
      </Section>
    );
  }
}

class CompletenessPanel extends Component {
  state = {
    googleSuggestedOptions: []
  };

  componentDidMount() {
    this.updateGoogleSuggestedOptions();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pieces !== this.props.pieces) {
      this.updateGoogleSuggestedOptions();
    }
  }

  updateGoogleSuggestedOptions = async () => {
    const { pieces } = this.props;
    let optionPieces = pieces
      .filter(p => p.pieceType === PIECE_TYPES.option)
      .map(p => p.name.trim());

    const augmentedOptionPieces = await Promise.all(
      optionPieces.map(async p => {
        const lemmatizer = p => {
          return p
            .toLowerCase()
            .split(' ')
            .map(item => lemmatize.noun(item.trim()))
            .join(' ');
        };

        let lemmatizedOptionName = lemmatizer(p);

        let vsList = (await axios.get(
          // 'http://localhost:8800/kap-project-nsh-2504/us-central1/getGoogleAutoSuggests',
          'https://us-central1-kap-project-nsh-2504.cloudfunctions.net/getGoogleAutoSuggests',
          {
            params: {
              q: p
            }
          }
        )).data.list.slice(0, 10);
        let lemmatizedOptionVsList = vsList.map(item =>
          lemmatizer(item.toLowerCase())
        );

        const otherOptions = optionPieces
          .filter(item => item !== p)
          .map(item => lemmatizer(item.toLowerCase()));
        let filteredLemmatizedOptionVsList = lemmatizedOptionVsList.filter(
          item => {
            let retVal = true;
            otherOptions.forEach(op => {
              if (op.includes(item)) {
                retVal = false;
              }
            });
            return retVal;
          }
        );

        return {
          optionName: p,
          lemmatizedOptionName,
          optionVsList: vsList,
          lemmatizedOptionVsList,
          filteredLemmatizedOptionVsList
        };
      })
    );

    let rankedOptionVsMap = {};
    for (let i = 0; i < augmentedOptionPieces.length; i++) {
      let optionItem = augmentedOptionPieces[i];
      for (
        let j = 0;
        j < optionItem.filteredLemmatizedOptionVsList.length;
        j++
      ) {
        let item = optionItem.filteredLemmatizedOptionVsList[j];
        if (rankedOptionVsMap[item]) {
          rankedOptionVsMap[item] +=
            optionItem.filteredLemmatizedOptionVsList.length - j;
        } else {
          rankedOptionVsMap[item] =
            optionItem.filteredLemmatizedOptionVsList.length - j;
        }
      }
    }

    let rankedOptionVsList = reverse(
      sortBy(
        Object.keys(rankedOptionVsMap).map(key => {
          return { name: key, count: rankedOptionVsMap[key] };
        }),
        ['count']
      )
    );

    this.setState({ googleSuggestedOptions: rankedOptionVsList });
  };

  render() {
    let { queries, pieces, pages, task, cells } = this.props;

    const displayPieces = pieces.filter(
      p => p.pieceType === PIECE_TYPES.option
    );

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

    let { creationDate, updateDate } = task;
    creationDate = creationDate.toDate();
    updateDate = updateDate ? updateDate.toDate() : new Date();
    const approxDuration = updateDate - creationDate;

    /**
     * suggested options
     */
    const suggestedOptionsToShow = this.state.googleSuggestedOptions.slice(
      0,
      3
    );

    return (
      <div className={styles.PanelContainer}>
        {/* Research and Exploration Section */}
        <EffortSection
          pieces={pieces}
          pages={pages}
          task={task}
          queries={queries}
          cells={cells}
        />

        <CodeSection pieces={pieces} cells={cells} />

        <OtherOptionsSection />
      </div>
    );
  }
}

export default CompletenessPanel;
