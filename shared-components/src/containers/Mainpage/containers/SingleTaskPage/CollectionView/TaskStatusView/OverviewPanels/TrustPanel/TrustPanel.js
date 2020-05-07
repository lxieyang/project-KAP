import React, { Component } from 'react';
import styles from './TrustPanel.css';

import { sortBy, reverse } from 'lodash';

import { IoMdMedal, IoIosPeople, IoIosLink } from 'react-icons/io';
import { MdPinDrop } from 'react-icons/md';
import { TiUser } from 'react-icons/ti';
import { GiThreeKeys } from 'react-icons/gi';

import {
  PIECE_TYPES,
  RATING_TYPES
} from '../../../../../../../../shared/types';
import {
  PIECE_COLOR,
  DOMAIN_THEME_COLOR
} from '../../../../../../../../shared/theme';
import ColorAlpha from 'color-alpha';

import InfoTooltip from '../components/InfoTooltip/InfoTooltip';
import isURL from 'validator/lib/isURL';

import { Collapse } from 'react-collapse';
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';

import Textarea from 'react-textarea-autosize';
import ReactHoverObserver from 'react-hover-observer';

import axios from 'axios';

import * as FirestoreManager from '../../../../../../../../firebase/firestore_wrapper';

import moment from 'moment';
import { GET_FAVICON_URL_PREFIX } from '../../../../../../../../shared/constants';

import TaskContext from '../../../../../../../../shared/task-context';

import Section from '../components/Section/Section';
import Entry from '../components/Section/Entry/Entry';
import SourcesComponent from '../components/SourcesComponent/SourcesComponent';
import SnippetsComponent from '../components/SnippetsComponent/SnippetsComponent';

class SourcesSection extends Component {
  static contextType = TaskContext;
  state = {
    domains: [],
    pieces: [],
    pages: [],

    sourceDiversityStatus: 'neutral',
    sourceCredibilityStatus: 'neutral'
  };

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.pieces !== this.props.pieces &&
      this.props.pieces.length > 0 &&
      this.props.pages.length > 0
    ) {
      this.updateData();
    }
  }

  updateData() {
    let { pieces, pages } = this.props;
    // console.log(queries);

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

    // pages = pages.filter(page => page.piecesNumber > 0);
    // console.log(pages);

    let domains = [];
    pages.forEach(p => {
      if (domains.filter(d => d.domain === p.domain).length === 0) {
        domains.push({
          domain: p.domain,
          pages: [p],
          numberOfPages: 1,
          numberOfPieces: p.piecesNumber,
          favicon: p.faviconUrl ? p.faviconUrl : null
        });
      } else {
        domains = domains.map(d => {
          if (d.domain === p.domain) {
            d.pages.push(p);
            d.numberOfPages = d.pages.length;
            d.numberOfPieces += p.piecesNumber;
            if (d.favicon === null && p.faviconUrl) {
              d.favicon = p.faviconUrl;
            }
          }
          return d;
        });
      }
    });

    domains = domains.map(d => {
      let updateDate = d.pages[0].updateDate;
      d.pages.forEach(p => {
        if (p.updateDate > updateDate) {
          updateDate = p.updateDate;
        }
      });
      d.updateDate = updateDate;

      if (d.favicon === null) {
        d.favicon = GET_FAVICON_URL_PREFIX + d.pages[0].url;
      }

      return d;
    });

    domains = reverse(sortBy(domains, ['numberOfPieces', 'numberOfPages']));

    domains = domains.filter(d => d.numberOfPieces > 0);
    this.setState({ domains, pieces, pages });

    if (domains.length > 1) {
      this.setState({ sourceDiversityStatus: 'good' });
    } else {
      this.setState({ sourceDiversityStatus: 'bad' });
    }

    // TODO: source credibility status checker
    this.setState({ sourceCredibilityStatus: 'good' });
  }

  render() {
    const { domains, pieces } = this.state;

    return (
      <Section
        headerIcon={<GiThreeKeys className={styles.SectionHeaderIcon} />}
        headerName={'Sources'}
        headerContent={
          <React.Fragment>
            {domains.map((domain, idx) => {
              return (
                <img
                  title={domain.domain}
                  style={{ width: 16, height: 16, margin: '0px 3px' }}
                  src={domain.favicon}
                  alt=""
                  key={idx}
                />
              );
            })}
          </React.Fragment>
        }
        footer={
          <SourcesComponent
            domains={domains}
            pieces={pieces}
            shouldOpenOnMount={false}
          />
        }
        numOfWarnings={[
          this.state.sourceDiversityStatus === 'bad' ? 1 : 0,
          this.state.sourceCredibilityStatus === 'bad' ? 1 : 0
        ].reduce((a, b) => a + b)}
      >
        <Entry
          status={this.state.sourceCredibilityStatus}
          content={
            <div style={{ verticalAlign: 'middle' }}>
              <strong>Souce credibility </strong> - All sources (
              {domains.map((domain, idx) => {
                return (
                  <img
                    title={domain.domain}
                    style={{ width: 14, height: 13, margin: '0px 3px' }}
                    src={domain.favicon}
                    alt=""
                    key={idx}
                  />
                );
              })}
              ) are credibile.
            </div>
          }
        />

        <Entry
          status={this.state.sourceDiversityStatus}
          content={
            <React.Fragment>
              <strong>Source diversity </strong> -{' '}
              {domains.length > 1
                ? `Information are from ${domains.length} different sources,`
                : `Information are all from a single source,`}
              {domains.length > 0 && (
                <React.Fragment>
                  {' '}
                  the most-used one being{' '}
                  <ReactHoverObserver
                    className={styles.InlineHoverObserver}
                    {...{
                      onHoverChanged: ({ isHovering }) => {
                        if (isHovering) {
                          this.context.setSelectedDomains([domains[0].domain]);
                        } else {
                          this.context.clearSelectedDomains();
                        }
                      }
                    }}
                  >
                    <span
                      className={styles.DomainItem}
                      style={{
                        backgroundColor: DOMAIN_THEME_COLOR[domains[0].domain]
                          ? ColorAlpha(
                              DOMAIN_THEME_COLOR[domains[0].domain],
                              0.2
                            )
                          : ColorAlpha('gray', 0.3)
                      }}
                    >
                      <img src={domains[0].favicon} alt="" />
                      {domains[0].domain}
                    </span>
                  </ReactHoverObserver>
                  , which is where{' '}
                  {((domains[0].numberOfPieces / pieces.length) * 100).toFixed(
                    0
                  )}
                  % of the snippets are collected from.
                </React.Fragment>
              )}
            </React.Fragment>
          }
        />
      </Section>
    );
  }
}

const EVIDENCE_POPULARITY_THRESHOLD = 5;

class SnippetsSection extends Component {
  static contextType = TaskContext;
  state = {
    pieces: [],
    cells: [],

    evidencePopularityStatus: 'neutral',
    highUpVotedEvidenceSnippets: [],
    // optionsPopularityStatus: 'bad',
    upToDateNessStatus: 'neutral',
    withUpdateDateSnippets: [],
    corroboratingEvidenceStatus: 'neutral',
    multipleEvidenceCells: [],
    corroboratingCells: [],
    conflictingCells: []
  };

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate(prevProps) {
    if (
      (prevProps.pieces !== this.props.pieces &&
        this.props.pieces.length > 0) ||
      (prevProps.cells !== this.props.cells && this.props.cells.length > 0)
    ) {
      this.updateData();
    }
  }

  updateData = () => {
    let { pieces, cells } = this.props;
    this.setState({ pieces, cells });

    /* evidence popularity */
    let evidenceSnippets = pieces.filter(
      p => p.pieceType === PIECE_TYPES.snippet
    );
    // TODO: right now, all from stack overflow
    let SOEvidenceSnippets = evidenceSnippets.filter(p => {
      if (
        p.references.hostname &&
        p.references.hostname.includes('stackoverflow')
      ) {
        return true;
      } else {
        return false;
      }
    });
    let highUpVotedEvidenceSnippets = SOEvidenceSnippets.filter(p => {
      if (
        p.answerMetaInfo &&
        p.answerMetaInfo.answerVoteCount &&
        parseInt(p.answerMetaInfo.answerVoteCount, 10) >=
          EVIDENCE_POPULARITY_THRESHOLD
      ) {
        return true;
      } else {
        return false;
      }
    });

    if (highUpVotedEvidenceSnippets.length >= 3) {
      this.setState({
        evidencePopularityStatus: 'good',
        highUpVotedEvidenceSnippets
      });
    } else {
      this.setState({
        evidencePopularityStatus: 'bad',
        highUpVotedEvidenceSnippets
      });
    }

    /* up-to-dateness */
    // TODO: only limiting to SO atm
    let SOSnippets = evidenceSnippets.filter(p => {
      if (
        p.references.hostname &&
        p.references.hostname.includes('stackoverflow')
      ) {
        return true;
      } else {
        return false;
      }
    });
    // console.log(SOSnippets);
    let withUpdateDateSnippets = SOSnippets.map(p => {
      if (
        p.answerMetaInfo &&
        (p.answerMetaInfo.answerEditedTime ||
          p.answerMetaInfo.answerCreatedTime)
      ) {
        let updateDate = p.answerMetaInfo.answerEditedTime
          ? new Date(p.answerMetaInfo.answerEditedTime)
          : p.answerMetaInfo.answerCreatedTime
          ? new Date(p.answerMetaInfo.answerCreatedTime)
          : null;
        // TODO: make use of these matrics
        let isRecent = updateDate
          ? (new Date() - updateDate) / (1000 * 86400) < 365 * 3
          : false;
        p.updateDate = updateDate;
        p.isRecent = isRecent;
      }

      return p;
    });
    //   .filter(p => {
    //   if (p.isRecent !== undefined) {
    //     return p.isRecent;
    //   } else {
    //     return false;
    //   }
    // });
    withUpdateDateSnippets = sortBy(withUpdateDateSnippets, ['updateDate']);
    // console.log(withUpdateDateSnippets);

    this.setState({ withUpdateDateSnippets });
    if (withUpdateDateSnippets.length > 0) {
      if (
        (new Date() - withUpdateDateSnippets[0].updateDate.getTime()) /
          (1000 * 86400) >
        365 * 3 // 3 years
      ) {
        this.setState({ upToDateNessStatus: 'bad' });
      } else {
        this.setState({ upToDateNessStatus: 'good' });
      }
    } else {
      this.setState({ upToDateNessStatus: 'neutral' });
    }

    /* corroborating evidence */
    if (cells && cells.length > 0) {
      let multipleEvidenceCells = cells.filter(c => {
        let tempPieces = c.pieces.filter(
          p =>
            p.rating === RATING_TYPES.positive ||
            p.rating === RATING_TYPES.negative
        );
        return tempPieces.length > 1;
      });
      // console.log(multipleEvidenceCells);
      if (multipleEvidenceCells.length > 0) {
        let corroboratingCells = multipleEvidenceCells.filter(c => {
          let ratings = c.pieces.map(p => p.rating);
          if (ratings.every((val, i, arr) => val === arr[0])) {
            return true;
          } else {
            return false;
          }
        });
        let conflictingCells = multipleEvidenceCells.filter(c => {
          let ratings = c.pieces.map(p => p.rating);
          if (ratings.every((val, i, arr) => val === arr[0])) {
            return false;
          } else {
            return true;
          }
        });
        this.setState({
          multipleEvidenceCells,
          corroboratingCells,
          conflictingCells
        });
        if (conflictingCells.length > 0) {
          this.setState({ corroboratingEvidenceStatus: 'bad' });
        } else {
          this.setState({ corroboratingEvidenceStatus: 'good' });
        }
      } else {
        this.setState({ corroboratingEvidenceStatus: 'neutral' });
      }
    } else {
      this.setState({ corroboratingEvidenceStatus: 'neutral' });
    }
  };

  render() {
    // const { pieces } = this.state;
    return (
      <Section
        headerIcon={<GiThreeKeys className={styles.SectionHeaderIcon} />}
        headerName={'Tables and Snippets'}
        // headerContent={<React.Fragment>snippets stats</React.Fragment>}
        numOfWarnings={[
          this.state.evidencePopularityStatus === 'bad' ? 1 : 0,
          // this.state.optionsPopularityStatus === 'bad' ? 1 : 0,
          this.state.upToDateNessStatus === 'bad' ? 1 : 0,
          this.state.corroboratingEvidenceStatus === 'bad' ? 1 : 0
        ].reduce((a, b) => a + b)}
        // footer={<SnippetsComponent pieces={pieces} shouldOpenOnMount={true} />}
      >
        <Entry
          status={this.state.evidencePopularityStatus}
          content={
            <React.Fragment>
              <ReactHoverObserver
                {...{
                  onHoverChanged: ({ isHovering }) => {
                    if (isHovering) {
                      this.context.setSelectedSnippets(
                        this.state.highUpVotedEvidenceSnippets.map(p => p.id)
                      );
                    } else {
                      this.context.clearSelectedSnippets();
                    }
                  }
                }}
              >
                <strong> Evidence popularity </strong> -{' '}
                {this.state.highUpVotedEvidenceSnippets.length} evidence
                snippets received at least {EVIDENCE_POPULARITY_THRESHOLD}{' '}
                up-votes on <span>Stack Overflow</span>.
              </ReactHoverObserver>
            </React.Fragment>
          }
        />

        {/* <Entry
          status={this.state.optionsPopularityStatus}
          content={<React.Fragment>option</React.Fragment>}
        /> */}

        <Entry
          status={this.state.upToDateNessStatus}
          content={
            <React.Fragment>
              <strong> Up-to-dateness </strong> -{' '}
              {this.state.withUpdateDateSnippets.length === 0 && (
                <em>Currently not available</em>
              )}
              {this.state.withUpdateDateSnippets.length > 0 && (
                <ReactHoverObserver
                  className={styles.InlineHoverObserver}
                  {...{
                    onHoverChanged: ({ isHovering }) => {
                      if (isHovering) {
                        this.context.setSelectedSnippets([
                          this.state.withUpdateDateSnippets[0].id
                        ]);
                      } else {
                        this.context.clearSelectedSnippets();
                      }
                    }
                  }}
                >
                  The oldest snippet was updated{' '}
                  {moment(
                    this.state.withUpdateDateSnippets[0].updateDate
                  ).fromNow()}
                  .
                </ReactHoverObserver>
              )}
            </React.Fragment>
          }
        />

        <Entry
          status={this.state.corroboratingEvidenceStatus}
          content={
            <React.Fragment>
              <strong>Evidence strength</strong> -{' '}
              {this.state.multipleEvidenceCells.length === 0 && (
                <React.Fragment>
                  There are no cells with conflicting evidence.
                </React.Fragment>
              )}
              {this.state.multipleEvidenceCells.length > 0 &&
                this.state.conflictingCells.length > 0 && (
                  <React.Fragment>
                    <ReactHoverObserver
                      className={styles.InlineHoverObserver}
                      {...{
                        onHoverChanged: ({ isHovering }) => {
                          if (isHovering) {
                            this.context.setSelectedCells(
                              this.state.conflictingCells.map(c => c.id)
                            );
                          } else {
                            this.context.clearSelectedCells();
                          }
                        }
                      }}
                    >
                      There{' '}
                      {this.state.conflictingCells.length === 1 ? 'is' : 'are'}{' '}
                      {this.state.conflictingCells.length} cell
                      {this.state.conflictingCells.length === 1 ? '' : 's'} with
                      conflicting evidence.
                    </ReactHoverObserver>
                  </React.Fragment>
                )}
              {this.state.multipleEvidenceCells.length > 0 &&
                this.state.conflictingCells.length === 0 &&
                this.state.corroboratingCells.length > 0 && (
                  <React.Fragment>
                    <ReactHoverObserver
                      className={styles.InlineHoverObserver}
                      {...{
                        onHoverChanged: ({ isHovering }) => {
                          if (isHovering) {
                            this.context.setSelectedCells(
                              this.state.corroboratingCells.map(c => c.id)
                            );
                          } else {
                            this.context.clearSelectedCells();
                          }
                        }
                      }}
                    >
                      There{' '}
                      {this.state.corroboratingCells.length === 1
                        ? 'is'
                        : 'are'}{' '}
                      {this.state.corroboratingCells.length} cell
                      {this.state.corroboratingCells.length === 1
                        ? ''
                        : 's'}{' '}
                      with corroborating evidence.
                    </ReactHoverObserver>
                  </React.Fragment>
                )}
            </React.Fragment>
          }
        />
      </Section>
    );
  }
}

class TrustPanel extends Component {
  state = {
    isEditingTaskAuthor: false,
    authorGithubProfileLink: '',
    authorGithubProfileLinkLegal: true,
    authorGithubUserObject: null
  };

  editAuthorButtonClickedHandler = () => {
    this.setState({ isEditingTaskAuthor: true });
  };

  authoGithubProfileLinkChangedHandler = e => {
    this.setState({ authorGithubProfileLink: e.target.value });
  };

  updateAuthorGithubProfileLinkClickedHandler = () => {
    let link = this.state.authorGithubProfileLink;
    if (isURL(link) && link.includes('github.com/')) {
      console.log('should update');
      FirestoreManager.updateTaskAuthorGithubProfileLink(
        this.props.task.id,
        link
      );
      this.setState({
        isEditingTaskAuthor: false,
        authorGithubProfileLinkLegal: true
      });
    } else {
      this.setState({ authorGithubProfileLinkLegal: false });
    }
  };

  cancelUpdateAuthorGithubProfileLinkClickedHandler = () => {
    this.setState({
      isEditingTaskAuthor: false,
      authorGithubProfileLinkLegal: true
    });
  };

  componentDidMount() {
    this.updateAuthorGithubLink();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.task !== this.props.task) {
      this.updateAuthorGithubLink();
    }
  }

  updateAuthorGithubLink = () => {
    'should update author ghub link';

    if (
      this.props.task &&
      this.props.task.githubProfileLink &&
      this.props.task.githubProfileLink !== ''
    ) {
      const link = this.props.task.githubProfileLink;
      this.setState({
        authorGithubProfileLink: link
      });

      let login = link.split('github.com/');
      login = login[login.length - 1];
      axios.get(`https://api.github.com/users/${login}`).then(result => {
        const { data } = result;
        if (data.blog) {
          if (!data.blog.includes('http')) {
            data.blog = 'https://' + data.blog;
          }
        }
        this.setState({
          authorGithubUserObject: data
        });
      });
    }
  };

  render() {
    let { pieces, pages, cells } = this.props;

    return (
      <div className={styles.PanelContainer}>
        {/* Sources trustworthiness */}
        <SourcesSection pieces={pieces} pages={pages} />

        {/* Snippets trustworthiness */}
        <SnippetsSection pieces={pieces} cells={cells} />

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <TiUser className={styles.SectionHeaderIcon} />
            Task Author
            <div className={styles.HeaderButtonAlignRight}>
              <div
                className={styles.AddButton}
                onClick={() => this.editAuthorButtonClickedHandler()}
              >
                Edit
              </div>
            </div>
          </div>
          {this.state.isEditingTaskAuthor && (
            <div className={styles.SectionContent}>
              <div>Please provide the author's Github Profile:</div>
              {this.state.authorGithubProfileLinkLegal === false && (
                <div
                  style={{
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: 'red'
                  }}
                >
                  Please provide a proper github profile url.
                </div>
              )}
              <div>
                <Textarea
                  minRows={1}
                  maxRows={2}
                  className={[styles.Textarea].join(' ')}
                  value={this.state.authorGithubProfileLink}
                  onChange={this.authoGithubProfileLinkChangedHandler}
                  placeholder={`github profile link`}
                />
              </div>
              <div
                style={{
                  marginTop: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start'
                }}
              >
                <button
                  className={[
                    styles.AddNewEnvButton,
                    this.state.newEnvText === '' ? styles.Disabled : null
                  ].join(' ')}
                  onClick={this.updateAuthorGithubProfileLinkClickedHandler}
                >
                  Update
                </button>
                &nbsp;&nbsp;
                <button
                  className={[styles.CancelEnvButton].join(' ')}
                  onClick={
                    this.cancelUpdateAuthorGithubProfileLinkClickedHandler
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {!this.state.isEditingTaskAuthor && (
            <div className={styles.SectionContent}>
              {!this.state.authorGithubUserObject && (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                  Author information not available for the moment.
                </p>
              )}

              {this.state.authorGithubUserObject && (
                <div className={styles.AuthorInfoCard}>
                  <div className={styles.AuthorAvatarContainer}>
                    <a
                      href={this.state.authorGithubProfileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={this.state.authorGithubUserObject.avatar_url}
                        alt=""
                      />
                    </a>
                  </div>
                  <div className={styles.AuthorInfoContainer}>
                    <div>
                      <a
                        href={this.state.authorGithubProfileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <strong>
                          {this.state.authorGithubUserObject.name}
                        </strong>
                      </a>
                      &nbsp;&nbsp;
                      <a
                        href={this.state.authorGithubProfileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{this.state.authorGithubUserObject.login}</span>
                      </a>
                    </div>
                    {this.state.authorGithubUserObject.bio && (
                      <p>{this.state.authorGithubUserObject.bio}</p>
                    )}
                    {this.state.authorGithubUserObject.company && (
                      <p
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#666',
                          fontSize: 12
                        }}
                      >
                        <IoIosPeople style={{ fontSize: 15 }} /> &nbsp;
                        {this.state.authorGithubUserObject.company}
                      </p>
                    )}
                    {this.state.authorGithubUserObject.location && (
                      <p
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#666',
                          fontSize: 12
                        }}
                      >
                        <MdPinDrop style={{ fontSize: 15 }} />
                        &nbsp;
                        {this.state.authorGithubUserObject.location}
                      </p>
                    )}

                    {this.state.authorGithubUserObject.blog && (
                      <p
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#666',
                          fontSize: 12
                        }}
                      >
                        <IoIosLink style={{ fontSize: 15 }} />
                        &nbsp;
                        <a
                          href={this.state.authorGithubUserObject.blog}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {this.state.authorGithubUserObject.blog}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* {this.state.authorGithubUserObject && (
                <React.Fragment>
                  <p>
                    Github Profile:{' '}
                    <a
                      href={this.state.authorGithubProfileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {this.state.authorGithubUserObject.name} (@
                      {this.state.authorGithubUserObject.login})
                    </a>
                  </p>
                  {this.state.authorGithubUserObject.company && (
                    <p>
                      The author is affiliated with{' '}
                      {this.state.authorGithubUserObject.company}.
                    </p>
                  )}
                </React.Fragment>
              )} */}
            </div>
          )}
        </div>

        {/* <div className={styles.Section}>
          <div className={styles.SectionHeader}>Sources</div>
          <div className={styles.ExplanationText}>
            These are the top sources where the author got the information from.
          </div>
          <div>
            {domains.map((item, idx) => {
              return (
                <div key={idx} className={styles.ListItem}>
                  <img
                    src={
                      item.favicon
                        ? item.favicon
                        : `https://plus.google.com/_/favicon?domain_url=${
                            item.domain
                          }`
                    }
                    alt=""
                    className={styles.ItemIcon}
                  />
                  <div className={styles.ItemContent}>{item.domain}</div>
                  <div className={styles.ItemInlineInfo}>
                    {item.numberOfPages} pages &nbsp; {item.numberOfPieces}{' '}
                    snippets
                  </div>
                  <div style={{ flex: 1 }} />
                  <div className={styles.ItemMetaInfo}>
                    <div>{moment(item.updateDate).format('MMM D')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>Options</div>
          <div className={styles.ExplanationText}>
            These are some top options that the author found.
          </div>
          <div>
            {displayPieces.map((item, idx) => {
              return (
                <div key={idx} className={styles.ListItem}>
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
                  <div className={styles.ItemContent}>{item.name}</div>
                  <div style={{ flex: 1 }} />
                  <div className={styles.ItemMetaInfo} />
                </div>
              );
            })}
          </div>
        </div> */}
      </div>
    );
  }
}

export default TrustPanel;
