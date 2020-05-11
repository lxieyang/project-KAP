import React, { Component } from 'react';
import styles from './TrustPanel.css';

import { sortBy, reverse } from 'lodash';

import { IoMdMedal, IoIosPeople, IoIosLink } from 'react-icons/io';
import { MdPinDrop } from 'react-icons/md';
import { TiUser } from 'react-icons/ti';
import { GiThreeKeys } from 'react-icons/gi';
import { RiCodeSSlashLine } from 'react-icons/ri';

import countArrayValues from 'count-array-values';

import {
  PIECE_TYPES,
  RATING_TYPES,
  SECTION_TYPES
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
import {
  GET_FAVICON_URL_PREFIX,
  credibleDomainsInitial
} from '../../../../../../../../shared/constants';

import TaskContext from '../../../../../../../../shared/task-context';

import Popover from 'react-tiny-popover';

import Section from '../components/Section/Section';
import Entry from '../components/Section/Entry/Entry';
import SourcesComponent from '../components/SourcesComponent/SourcesComponent';
import SnippetsComponent from '../components/SnippetsComponent/SnippetsComponent';
import Divider from '@material-ui/core/Divider';

class SourcesSection extends Component {
  static contextType = TaskContext;
  state = {
    domains: [],
    notCredibleDomains: [],
    pieces: [],
    pages: [],
    credibleDomains: [],

    showCredibleDomains: false,
    newCredibleDomainInput: '',

    sourceDiversityStatus: 'neutral',
    sourceCredibilityStatus: 'neutral'
  };

  openCredibleSourcesPopover = () => {
    this.setState({ showCredibleDomains: true });
  };

  removeCredibleDomainItem = (e, item) => {
    e.stopPropagation();
    let credibleDomains = [...this.state.credibleDomains];
    credibleDomains = credibleDomains.filter(d => d !== item);
    localStorage.setItem('credibleDomains', JSON.stringify(credibleDomains));
    this.setState({ credibleDomains }, () => {
      this.updateData();
    });
  };

  addCredibleDomainItem = () => {
    let item = this.state.newCredibleDomainInput.trim();
    try {
      if (!item.startsWith('http')) {
        item = 'http://' + item;
      }
      let newItem = new URL(item).hostname;

      let credibleDomains = [...this.state.credibleDomains];
      if (credibleDomains.filter(d => d === newItem).length === 0) {
        credibleDomains.push(newItem);
        localStorage.setItem(
          'credibleDomains',
          JSON.stringify(credibleDomains)
        );
        this.setState({ credibleDomains, newCredibleDomainInput: '' }, () => {
          this.updateData();
        });
      } else {
        this.setState({ newCredibleDomainInput: '' });
      }
    } catch (err) {
      console.log(err);
    }
  };

  componentDidMount() {
    localStorage.removeItem('credibleDomains');
    let credibleDomains = localStorage.getItem('credibleDomains');

    if (!credibleDomains) {
      credibleDomains = credibleDomainsInitial;
      localStorage.setItem('credibleDomains', JSON.stringify(credibleDomains));
    } else {
      credibleDomains = JSON.parse(credibleDomains);
    }

    this.setState({ credibleDomains });

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
    const { credibleDomains } = this.state;
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
    domains = domains.map(d => {
      if (
        credibleDomains.includes(d.domain) ||
        credibleDomains.some(
          item => item.includes(d.domain) || d.domain.includes(item)
        )
      ) {
        d.credible = true;
      } else {
        d.credible = false;
      }
      return d;
    });
    let notCredibleDomains = domains.filter(d => !d.credible);
    if (notCredibleDomains.length === 0) {
      this.setState({ notCredibleDomains, sourceCredibilityStatus: 'good' });
    } else {
      this.setState({ notCredibleDomains, sourceCredibilityStatus: 'bad' });
    }
  }

  render() {
    const { domains, pieces } = this.state;

    return (
      <Section
        active={true}
        headerName={SECTION_TYPES.section_sources}
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
            shouldOpenOnMount={true}
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
              <strong>Credibility </strong> -{' '}
              {this.state.notCredibleDomains.length === 0 && (
                <React.Fragment>
                  All domains (
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
                </React.Fragment>
              )}
              {this.state.notCredibleDomains.length > 0 && (
                <React.Fragment>
                  {this.state.notCredibleDomains.length} of the domains{' '}
                  {this.state.notCredibleDomains.length === 1 ? 'is' : 'are'}{' '}
                  not on the trusted whitelist:
                  {this.state.notCredibleDomains.map((domain, idx) => {
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontStyle: 'italic'
                        }}
                      >
                        -{' '}
                        <img
                          title={domain.domain}
                          style={{ width: 14, height: 13, margin: '0px 3px' }}
                          src={domain.favicon}
                          alt=""
                        />
                        {domain.domain}
                        <div style={{ flex: 1 }} />
                        <div
                          className={styles.AddToTrustedButton}
                          onClick={e => {
                            this.setState(
                              { newCredibleDomainInput: domain.domain },
                              () => {
                                this.addCredibleDomainItem();
                              }
                            );
                          }}
                        >
                          {' '}
                          add as trusted{' '}
                        </div>
                      </div>
                    );
                  })}
                  <br />
                </React.Fragment>
              )}
              <Popover
                isOpen={this.state.showCredibleDomains}
                position={'bottom'} // preferred position
                onClickOutside={() =>
                  this.setState({ showCredibleDomains: false })
                }
                containerClassName={styles.PopoverContainer}
                content={
                  <div className={styles.PopoverContentContainer}>
                    {this.state.credibleDomains.map((item, idx) => {
                      return (
                        <div key={idx} className={styles.CredibleDomainItem}>
                          <img
                            alt={item}
                            src={`https://plus.google.com/_/favicon?domain_url=${item}`}
                          />
                          {item.replace('www.', '')}
                          <span style={{ flex: 1 }} />
                          <div
                            className={styles.RemoveCredibleDomainItem}
                            onClick={e =>
                              this.removeCredibleDomainItem(e, item)
                            }
                          >
                            &times;
                          </div>
                        </div>
                      );
                    })}
                    <Divider light />
                    <input
                      value={this.state.newCredibleDomainInput}
                      onChange={e =>
                        this.setState({
                          newCredibleDomainInput: e.target.value
                        })
                      }
                    />
                    <button onClick={this.addCredibleDomainItem}>Add</button>
                  </div>
                }
              >
                <div>
                  {' '}
                  <a
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={this.openCredibleSourcesPopover}
                  >
                    [whitelist of popular credible domains]
                  </a>
                </div>
              </Popover>
            </div>
          }
        />

        <Entry
          status={this.state.sourceDiversityStatus}
          content={
            <React.Fragment>
              <strong>Diversity </strong> -{' '}
              {domains.length > 1
                ? `Information are from ${domains.length} different domains,`
                : `Information are all from a single domain,`}
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
                  <strong>
                    {(
                      (domains[0].numberOfPieces / pieces.length) *
                      100
                    ).toFixed(0)}
                    %
                  </strong>{' '}
                  of the snippets are collected from.
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
        active={false}
        headerName={SECTION_TYPES.section_snippets}
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
                <strong>{this.state.highUpVotedEvidenceSnippets.length}</strong>{' '}
                evidence snippets received at least{' '}
                {EVIDENCE_POPULARITY_THRESHOLD} up-votes on{' '}
                <span>Stack Overflow</span>.
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
                  <strong>
                    {moment(
                      this.state.withUpdateDateSnippets[0].updateDate
                    ).fromNow()}
                  </strong>
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
                      <strong>{this.state.conflictingCells.length}</strong> cell
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
                      <strong>{this.state.corroboratingCells.length}</strong>{' '}
                      cell
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

class AuthorSection extends Component {
  state = {};

  render() {
    return (
      <Section
        active={false}
        headerName={SECTION_TYPES.section_author}
        headerContent={
          this.props.authorObj && (
            <div style={{ fontSize: 13, fontWeight: 300 }}>
              {this.props.authorObj.name}
            </div>
          )
        }
      >
        {this.props.children}
      </Section>
    );
  }
}

class TrustPanel extends Component {
  state = {
    isEditingTaskAuthor: false,
    authorGithubProfileLink: '',
    authorGithubProfileLinkLegal: true,
    authorGithubUserObject: null,
    authorGithubLanguages: [],
    authorGithubRepos: []
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
      axios.get(`https://api.github.com/users/${login}/repos`).then(result => {
        const { data } = result;
        this.setState({ authorGithubRepos: [] });
        let languages = data
          .map(repo => repo.language)
          .filter(item => item !== null);
        languages = countArrayValues(languages);
        languages = languages.slice(0, 2);
        this.setState({ authorGithubLanguages: languages });
      });
    }
  };

  render() {
    let { pieces, pages, cells } = this.props;

    return (
      <div className={styles.PanelContainer}>
        {/* Sources trustworthiness */}
        <SourcesSection pieces={pieces} pages={pages} />

        {/* Table & Snippets trustworthiness */}
        <SnippetsSection pieces={pieces} cells={cells} />

        {/* Author section */}
        <AuthorSection authorObj={this.state.authorGithubUserObject}>
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
                  Author information not available for the moment. Please{' '}
                  <span
                    className={styles.AuthorInfoEditButton}
                    onClick={() => this.editAuthorButtonClickedHandler()}
                  >
                    add here
                  </span>
                </p>
              )}

              {this.state.authorGithubUserObject && (
                <div className={styles.AuthorInfoCard}>
                  <div className={styles.AuthorInfoEditButtonContainer}>
                    <div
                      className={styles.AuthorInfoEditButton}
                      onClick={() => this.editAuthorButtonClickedHandler()}
                    >
                      Edit
                    </div>
                  </div>
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

                    {this.state.authorGithubLanguages.length > 0 && (
                      <p
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#666',
                          fontSize: 12
                        }}
                      >
                        <RiCodeSSlashLine style={{ fontSize: 15 }} /> &nbsp;
                        {this.state.authorGithubLanguages.map((l, idx) => {
                          let isLast =
                            idx === this.state.authorGithubLanguages.length - 1;
                          return (
                            <span key={idx}>
                              {l.value}
                              {isLast ? '.' : ','}&nbsp;
                            </span>
                          );
                        })}
                      </p>
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
            </div>
          )}
        </AuthorSection>
      </div>
    );
  }
}

export default TrustPanel;
