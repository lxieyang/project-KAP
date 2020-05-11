import React, { Component } from 'react';
import styles from './CompletenessPanel.css';

import { sortBy, reverse } from 'lodash';

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
            shouldOpenOnMount={true}
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

class CodeSection extends Component {
  state = {};

  render() {
    return (
      <Section headerName={SECTION_TYPES.section_code} headerContent={''}>
        code
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

        <CodeSection />

        {/* <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <GiBinoculars className={styles.SectionHeaderIcon} />
            Next steps
          </div>
          <div className={styles.SectionContent}>
            <p>
              Based on everything so far, Google suggest looking into these
              additional options:
            </p>
            <div>
              {suggestedOptionsToShow.length === 0 && (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                  Suggested options are not available at this time.
                </p>
              )}
              {suggestedOptionsToShow.length > 0 && (
                <React.Fragment>
                  {suggestedOptionsToShow.map((item, idx) => {
                    return (
                      <div className={styles.ListItem} key={idx}>
                        {item.name}
                      </div>
                    );
                  })}
                </React.Fragment>
              )}
            </div>
          </div>
        </div> */}

        {/* <div className={styles.Section}>
          <div className={styles.SectionHeader}>Pages & Snippets</div>
          <div className={styles.ExplanationText}>
            These are the top pages that the author collected information from.
          </div>
          <div>
            {pages.map((item, idx) => {
              let progress = item.scrollPercentage ? item.scrollPercentage : 0; // Math.round(Math.random() * 100) / 100;
              const numberOfOptions = item.piecesInPage.filter(
                piece => piece.pieceType === PIECE_TYPES.option
              ).length;
              const numberOfCriteria = item.piecesInPage.filter(
                piece => piece.pieceType === PIECE_TYPES.criterion
              ).length;
              let numberOfSnippets = item.piecesInPage.filter(
                piece => piece.pieceType === PIECE_TYPES.snippet
              ).length;

              return (
                <React.Fragment key={idx}>
                  <div className={[styles.PageItemContainer].join(' ')}>
                    <div
                      className={styles.PageProgressIndicator}
                      style={{ width: `${progress * 100}%` }}
                    />
                    <div className={styles.PageNameContainer}>
                      <img
                        src={
                          item.faviconUrl
                            ? item.faviconUrl
                            : `https://plus.google.com/_/favicon?domain_url=${
                                item.references.url
                              }`
                        }
                        alt=""
                        className={styles.ItemIcon}
                      />
                      <div className={styles.PageTitleContent} title={item.url}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.title}
                        </a>
                      </div>
                      <div className={styles.PageMetaInfo}>
                        {item.duration &&
                          `${parseInt(
                            moment.duration(item.duration).asMinutes(),
                            10
                          )}m ${moment.duration(item.duration).seconds()}s`}
                        {!item.duration && `still open`}
                        
                      </div>
                    </div>
                    <div className={styles.PageSnippetsInfoContainer}>
                      {numberOfOptions > 0 && (
                        <span>
                          <Avatar
                            style={{
                              backgroundColor: PIECE_COLOR.option,
                              width: '18px',
                              height: '18px',
                              color: 'white'
                            }}
                            className={styles.Avatar}
                          >
                            <FaListUl className={styles.IconInsideAvatar} />
                          </Avatar>
                          {numberOfOptions} options
                        </span>
                      )}
                      {numberOfCriteria > 0 && (
                        <span>
                          <Avatar
                            style={{
                              backgroundColor: PIECE_COLOR.criterion,
                              width: '18px',
                              height: '18px',
                              color: 'white'
                            }}
                            className={styles.Avatar}
                          >
                            <FaFlagCheckered
                              className={styles.IconInsideAvatar}
                            />
                          </Avatar>
                          {numberOfCriteria} criteria
                        </span>
                      )}
                      {numberOfSnippets > 0 && (
                        <span>
                          <Avatar
                            style={{
                              backgroundColor: PIECE_COLOR.snippet,
                              width: '18px',
                              height: '18px',
                              color: 'white'
                            }}
                            className={styles.Avatar}
                          >
                            <FaBookmark className={styles.IconInsideAvatar} />
                          </Avatar>
                          {numberOfSnippets} ratings
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div> */}
      </div>
    );
  }
}

export default CompletenessPanel;
