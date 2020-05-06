import React, { Component } from 'react';
import styles from './TrustPanel.css';

import { sortBy, reverse } from 'lodash';

import { IoMdMedal, IoIosPeople, IoIosLink } from 'react-icons/io';
import { MdPinDrop } from 'react-icons/md';
import { TiUser } from 'react-icons/ti';
import { GiThreeKeys } from 'react-icons/gi';

import { PIECE_TYPES } from '../../../../../../../../shared/types';
import { PIECE_COLOR } from '../../../../../../../../shared/theme';

import InfoTooltip from '../components/InfoTooltip/InfoTooltip';
import isURL from 'validator/lib/isURL';

import { Collapse } from 'react-collapse';
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';

import Textarea from 'react-textarea-autosize';

import axios from 'axios';

import * as FirestoreManager from '../../../../../../../../firebase/firestore_wrapper';

import moment from 'moment';
import { GET_FAVICON_URL_PREFIX } from '../../../../../../../../shared/constants';

import Section from '../components/Section/Section';
import SourcesComponent from '../components/SourcesComponent/SourcesComponent';

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

    return (
      <div className={styles.PanelContainer}>
        {/* Table trustworthiness */}
        <Section
          headerIcon={<GiThreeKeys className={styles.SectionHeaderIcon} />}
          headerName={'Sources'}
          headerContent={
            <React.Fragment>
              {domains.map((domain, idx) => {
                return (
                  <img
                    style={{ width: 16, height: 16, margin: '0px 3px' }}
                    src={domain.favicon}
                    alt=""
                    key={idx}
                  />
                );
              })}
            </React.Fragment>
          }
          header={
            <React.Fragment>
              Sources &nbsp;{' '}
              {domains.map((domain, idx) => {
                return (
                  <img
                    style={{ width: 16, height: 16, margin: '0px 3px' }}
                    src={domain.favicon}
                    alt=""
                    key={idx}
                  />
                );
              })}
            </React.Fragment>
          }
          footer={<SourcesComponent domains={domains} pieces={pieces} />}
          numOfWarnings={0}
        >
          {domains.length <= 1 ? (
            <div>- Information are all from a single source website.</div>
          ) : (
            <div>
              + Information are from {domains.length} different source websites.
            </div>
          )}
          {domains.length > 0 && (
            <div>
              {/* TODO: calculate this number */}+{' '}
              {((domains[0].numberOfPieces / pieces.length) * 100).toFixed(0)}%
              of the snippets are collected from{' '}
              <span className={styles.DomainItem}>
                <img src={domains[0].favicon} alt="" />
                {domains[0].domain}
              </span>
              .
            </div>
          )}
        </Section>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <GiThreeKeys className={styles.SectionHeaderIcon} />
            {domains.length > 2 ? (
              <span className={styles.UpToDate}>Multiple</span>
            ) : (
              <span className={styles.NotUpToDate}>Limited</span>
            )}
            Sources
          </div>
          <div className={styles.SectionContent}>
            <p>
              Information are from {domains.length} different sources
              {domains.length > 0 && (
                <React.Fragment>
                  , with the most used one being{' '}
                  <span className={styles.DomainItem}>
                    <img src={domains[0].favicon} alt="" />
                    {domains[0].domain}
                  </span>
                  .
                </React.Fragment>
              )}
              {domains.length === 0 && <React.Fragment>.</React.Fragment>}
            </p>
          </div>
          <div className={styles.SectionFooter}>
            <div
              className={styles.LinkToElsewhere}
              onClick={e => this.props.changeTab(e, 0)}
            >
              See the complete list of sources
            </div>
            <div style={{ color: 'red' }}>
              put the complete list of sources, pages, and stats here.
            </div>
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <IoMdMedal className={styles.SectionHeaderIcon} />
            <span className={styles.UpToDate}>High</span>
            Snippet credibility
          </div>
          <div className={styles.SectionContent}>
            <p>5/9 snippets are highly-acknowledged by the community.</p>
            <p>8/9 snippets are updated recently.</p>
            <p>In the table, there are 3 cells with corroborating evidence.</p>
          </div>
          <div className={styles.SectionFooter}>
            <div style={{ color: 'red' }}>
              put the complete list of snippets here, with more interactions
              between the table and the overview.
            </div>
          </div>
        </div>

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
