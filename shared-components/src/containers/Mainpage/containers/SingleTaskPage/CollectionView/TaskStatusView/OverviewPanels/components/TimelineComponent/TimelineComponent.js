import React, { Component } from 'react';
import { sortBy } from 'lodash';
import BaseComponent from '../BaseComponent/BaseComponent';

import Divider from '@material-ui/core/Divider';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaHandPointRight } from 'react-icons/fa';
import { Collapse } from 'react-collapse';
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';

import TaskContext from '../../../../../../../../../shared/task-context';

import moment from 'moment';

import styles from './TimelineComponent.css';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';

import { PIECE_COLOR } from '../../../../../../../../../shared/theme';
import { PIECE_TYPES } from '../../../../../../../../../shared/types';

import ReactHoverObserver from 'react-hover-observer';

class Page extends Component {
  static contextType = TaskContext;
  state = {
    isOpen: true
  };

  handleOpenClicked = e => {
    this.setState(prevState => {
      return { isOpen: !prevState.isOpen };
    });
  };

  onPageHoverChanged = ({ isHovering }) => {
    if (isHovering) {
      this.context.setSelectedUrls([this.props.item.url]);
    } else {
      this.context.clearSelectedUrls();
    }
  };

  render() {
    const { item, idx } = this.props;

    return (
      <div
        className={[styles.Entry, styles.Page].join(' ')}
        onClick={() => this.props.progressCheckClicked(idx)}
      >
        {this.props.progressCheckerIdx === idx && (
          <div className={styles.ProgressCheckerContainer}>
            <FaHandPointRight className={styles.ProgressCheckerIcon} />
          </div>
        )}
        <div className={styles.NameContainer}>
          <img
            className={styles.ItemIcon}
            src={
              item.faviconUrl
                ? item.faviconUrl
                : `https://plus.google.com/_/favicon?domain_url=${item.url}`
            }
            alt={item.domain}
            title={item.url}
          />
          <div className={styles.TitleContent} title={item.url}>
            <ReactHoverObserver
              className={styles.InlineHoverObserver}
              {...{
                onHoverChanged: this.onPageHoverChanged
              }}
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            </ReactHoverObserver>
          </div>
          <div className={styles.MetaData}>
            <React.Fragment>
              {moment(item.creationDate).format('h:mma')}
              {/* <div>{moment(item.creationDate).format('MMM D')}</div>
                      <div>{moment(item.creationDate).format('h:mma')}</div> */}
            </React.Fragment>
          </div>
        </div>
        <div className={styles.RelatedContentContainer}>
          {item.piecesInPage.map((piece, pidx) => {
            let pieceIcon = (
              <FontAwesomeIcon
                icon={fasBookmark}
                className={styles.PieceIcon}
              />
            );
            let pieceColor = PIECE_COLOR.snippet;
            if (piece.pieceType === PIECE_TYPES.criterion) {
              pieceIcon = (
                <FontAwesomeIcon
                  icon={fasFlagCheckered}
                  className={styles.PieceIcon}
                />
              );
              pieceColor = PIECE_COLOR.criterion;
            } else if (piece.pieceType === PIECE_TYPES.option) {
              pieceIcon = (
                <FontAwesomeIcon
                  icon={fasListUl}
                  className={styles.PieceIcon}
                />
              );
              pieceColor = PIECE_COLOR.option;
            }

            const onHoverChanged = ({ isHovering }) => {
              if (isHovering) {
                this.context.setSelectedSnippets([piece.id]);
              } else {
                this.context.clearSelectedSnippets();
              }
            };

            return (
              <ReactHoverObserver
                className={styles.InlineHoverObserver}
                key={pidx}
                {...{
                  onHoverChanged: onHoverChanged
                }}
              >
                <div className={styles.PieceItem}>
                  <div
                    className={styles.PieceIconContainer}
                    style={{ backgroundColor: pieceColor }}
                  >
                    {pieceIcon}
                  </div>
                  {piece.name}
                </div>
              </ReactHoverObserver>
            );
          })}
          {/* {item.piecesInPage.length > 0 && (
            <React.Fragment>{item.piecesInPage.length} snippets</React.Fragment>
          )} */}
        </div>
      </div>
    );
  }
}

class TimelineComponent extends Component {
  static contextType = TaskContext;
  state = {
    sortedSombinedQueriesAndPages: [],
    progressCheckerIdx: -1
  };

  progressCheckClicked = idx => {
    const { sortedSombinedQueriesAndPages } = this.state;
    if (this.state.progressCheckerIdx === idx) {
      this.setState({ progressCheckerIdx: -1 });
      this.context.clearSelectedSnippets();
    } else {
      this.setState({ progressCheckerIdx: idx });
      let items = sortedSombinedQueriesAndPages.slice(0, idx + 1);
      let snippetIds = [];
      items.forEach(item => {
        if (item.piecesInPage) {
          snippetIds = snippetIds.concat(item.piecesInPage.map(p => p.id));
        }
      });

      this.context.setSelectedSnippets(snippetIds);
    }
  };

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate(prevProps) {
    if (
      (prevProps.queries !== this.props.queries &&
        this.props.queries.length > 0) ||
      (prevProps.pages !== this.props.pages && this.props.pages.length > 0)
    ) {
      this.updateData();
    }
  }

  updateData = () => {
    let { queries, pages } = this.props;

    // console.log(queries);
    // console.log(pages);
    // console.log(pieces);

    let combinedQueriesAndPages = queries
      .map(q => {
        return { ...q, creationDate: new Date(q.creationDate).getTime() };
      })
      .concat(pages);
    let sortedSombinedQueriesAndPages = sortBy(combinedQueriesAndPages, [
      'creationDate'
    ]);

    this.setState({
      sortedSombinedQueriesAndPages
    });
    // this.setState({ progressCheckerIdx: -1 });
    // this.context.clearSelectedSnippets();
  };

  render() {
    const { sortedSombinedQueriesAndPages, progressCheckerIdx } = this.state;

    return (
      <React.Fragment>
        {' '}
        <Divider light />{' '}
        <BaseComponent shouldOpenOnMount={true} headerName={'Timeline'}>
          <div className={styles.TimelineContainer}>
            {sortedSombinedQueriesAndPages.map((item, idx) => {
              if (item.query) {
                // query
                return (
                  <div
                    key={item.id}
                    className={[styles.Entry, styles.Query].join(' ')}
                    onClick={() => this.progressCheckClicked(idx)}
                  >
                    {progressCheckerIdx === idx && (
                      <div className={styles.ProgressCheckerContainer}>
                        <FaHandPointRight
                          className={styles.ProgressCheckerIcon}
                        />
                      </div>
                    )}

                    <AiOutlineSearch className={styles.SearchQueryIcon} />
                    <span className={styles.QueryContent}>{item.query}</span>
                    <div style={{ flex: 1 }} />
                    <div className={styles.MetaData}>
                      {moment(item.creationDate).format('MMM D h:mma')}
                      {/* <div>{moment(item.creationDate).format('MMM D')}</div>
                      <div>{moment(item.creationDate).format('h:mma')}</div> */}
                    </div>
                  </div>
                );
              } else if (item.title) {
                // page
                return (
                  <Page
                    key={item.id}
                    item={item}
                    idx={idx}
                    progressCheckerIdx={progressCheckerIdx}
                    progressCheckClicked={this.progressCheckClicked}
                    sortedSombinedQueriesAndPages={
                      sortedSombinedQueriesAndPages
                    }
                  />
                );
              } else {
                return null;
              }
            })}
          </div>
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default TimelineComponent;
