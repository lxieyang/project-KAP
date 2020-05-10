import React, { Component } from 'react';
import { sortBy } from 'lodash';
import BaseComponent from '../BaseComponent/BaseComponent';

import Divider from '@material-ui/core/Divider';
import { AiFillGoogleCircle as SearchIcon } from 'react-icons/ai';
import {
  AiOutlineMinusSquare as ExpandedIcon,
  AiOutlinePlusSquare as CollapsedIcon
} from 'react-icons/ai';
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

    console.log(item);

    return (
      <div
        className={styles.PageBlockContainer}
        onClick={() => this.props.progressCheckClicked(idx)}
      >
        <div className={styles.PageNameContainer}>
          {/* progress indicator */}
          {/* <div className={styles.PageProgressBackdropContainer}>
            <div
              className={styles.PageProgressBackdrop}
              style={{ width: `${item.scrollPercentage * 100}%` }}
            />
          </div> */}

          {/* UI - link to the main timeline */}
          <div className={styles.PageLinkLineContainer}>
            <div className={styles.PageLinkLine} />
          </div>

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

          <div className={styles.PageMetaData}>
            <React.Fragment>
              {/* Timestamp */}
              {moment(item.creationDate).format('h:mma')}
              {/* duration */}
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

class Query extends Component {
  state = {
    isOpen: true
  };

  handleCollapseButtonClicked = e => {
    this.setState(prevState => {
      return { isOpen: !prevState.isOpen };
    });
  };

  render() {
    const { isOpen } = this.state;
    const { query } = this.props;
    const { pages } = query;

    return (
      <div className={styles.QueryBlockContainer}>
        <div className={styles.QueryContainer}>
          <div
            className={styles.QueryCollapseButtonContainer}
            onClick={e => this.handleCollapseButtonClicked(e)}
          >
            {pages.length > 0 ? (
              isOpen ? (
                <ExpandedIcon />
              ) : (
                <CollapsedIcon />
              )
            ) : null}
          </div>
          <div className={styles.QueryIconContainer}>
            <SearchIcon className={styles.SearchQueryIcon} />
          </div>
          <div className={styles.QueryContentContainer}>{query.query}</div>
          <div style={{ flex: 1 }} />
          <div className={styles.QueryMetaData}>
            {/* timestamp */}
            {/* {moment(query.creationDate).format('MMM D h:mma')} */}
            {/* duration */}
            {moment.duration(query.duration).humanize()}
          </div>
        </div>
        <Collapse isOpened={isOpen}>
          {pages.length > 0 && (
            <div className={styles.PagesContainer}>
              <div className={styles.PagesLeftLine} />
              <div className={styles.Pages}>
                {pages.map((page, pidx) => {
                  return <Page key={pidx} item={page} idx={pidx} />;
                })}
              </div>
            </div>
          )}
        </Collapse>
      </div>
    );
  }
}

class TimelineComponent extends Component {
  static contextType = TaskContext;
  state = {
    queries: [],
    progressCheckerIdx: -1
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
    queries = sortBy(
      queries.map(q => {
        return { ...q, creationDate: new Date(q.creationDate).getTime() };
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

        query.duration = nextQuery.creationDate - query.creationDate;
        query.duration = query.duration * 1.5; // TODO: remove this adjustment coefficient
      } else {
        query.pages = pages.filter(p => p.creationDate >= query.creationDate);
        // TODO: make this real
        query.duration = query.pages.length * 2 * 60 * 1000; // 2 min / page
      }
    }

    // console.log(queries);

    this.setState({ queries });
  };

  render() {
    const { queries } = this.state;

    return (
      <React.Fragment>
        {' '}
        <Divider light />{' '}
        <BaseComponent shouldOpenOnMount={true} headerName={'Timeline'}>
          <div className={styles.TimelineContainer}>
            {queries.map((query, idx) => {
              return <Query idx={idx} key={query.id} query={query} />;
            })}
          </div>
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default TimelineComponent;
