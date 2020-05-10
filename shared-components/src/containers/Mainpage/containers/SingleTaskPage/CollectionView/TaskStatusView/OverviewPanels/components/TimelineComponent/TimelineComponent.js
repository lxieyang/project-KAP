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

import randomColor from 'randomcolor';
import colorAlpha from 'color-alpha';

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
              {/* {moment(item.creationDate).format('h:mma')} */}
              {/* scroll percentage */}[
              {(item.scrollPercentage * 100).toFixed(0)}%]
              {/* duration */}
              &nbsp;
              {moment.duration(item.duration).humanize()}
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
  static contextType = TaskContext;
  state = {
    isOpen: true
  };

  componentDidUpdate(prevProps) {
    if (prevProps.cellColors !== this.props.cellColors) {
      this.context.setCellColors(this.props.cellColors);
    }
  }

  handleCollapseButtonClicked = e => {
    this.setState(prevState => {
      return { isOpen: !prevState.isOpen };
    });
  };

  render() {
    const { isOpen } = this.state;
    const { query, cellColors } = this.props;
    const { pages } = query;

    return (
      <div
        className={styles.QueryBlockContainer}
        style={{ backgroundColor: colorAlpha(query.color, 0.15) }}
      >
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

const numOfColors = 10;

class TimelineComponent extends Component {
  static contextType = TaskContext;
  state = {
    queries: [],
    colorPalette: [],
    cellColors: {},
    progressCheckerIdx: -1
  };

  componentDidMount() {
    let colorPalette = localStorage.getItem('colorPalette');
    if (!colorPalette) {
      colorPalette = randomColor({
        count: numOfColors
      });
      localStorage.setItem('colorPalette', JSON.stringify(colorPalette));
    } else {
      colorPalette = JSON.parse(colorPalette);
    }

    this.setState({ colorPalette }, () => {
      this.updateData();
    });
  }

  componentDidUpdate(prevProps) {
    if (
      (prevProps.queries !== this.props.queries &&
        this.props.queries.length > 0) ||
      (prevProps.pages !== this.props.pages && this.props.pages.length > 0) ||
      (prevProps.cells !== this.props.cells && this.props.cells.length > 0)
    ) {
      this.updateData();
    }
  }

  regenColorPalette = () => {
    let colorPalette = randomColor({
      count: numOfColors
    });
    this.setState({ colorPalette }, () => {
      this.updateData();
    });
    localStorage.setItem('colorPalette', JSON.stringify(colorPalette));
  };

  updateData = () => {
    let { queries, pages, cells } = this.props;
    const { colorPalette } = this.state;

    // console.log(queries);
    // console.log(pages);
    // console.log(pieces);
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

        // query.duration = nextQuery.creationDate - query.creationDate;
        // query.duration = query.duration * 1.5; // TODO: remove this adjustment coefficient
      } else {
        query.pages = pages.filter(p => p.creationDate >= query.creationDate);
        // TODO: make this real
        // query.duration = query.pages.length * 2 * 60 * 1000; // 2 min / page
      }

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

      // assign color
      query.color =
        query.pages.length > 0 && colorPalette.length > 0
          ? colorPalette[i % numOfColors]
          : '#fff';

      // gather pieces in the query
      query.piecesInQuery = [];
      query.pages.forEach(p => {
        let pieceIds = p.piecesInPage.map(piece => piece.id);
        query.piecesInQuery = query.piecesInQuery.concat(pieceIds);
      });
    }

    // console.log(queries);

    this.setState({ queries });

    // cell colors
    for (let i = 0; i < cells.length; i++) {
      let cell = cells[i];
      cell.colors = null;
      let piecesInCell = cell.pieces.map(p => p.pieceId);
      if (piecesInCell.length === 1) {
        for (let j = 0; j < queries.length; j++) {
          if (queries[j].piecesInQuery.includes(piecesInCell[0])) {
            cell.colors = queries[j].color;
          }
        }
      } else if (piecesInCell.length > 1) {
        cell.colors = {};
        for (let j = 0; j < piecesInCell.length; j++) {
          let pieceId = piecesInCell[j];
          for (let k = 0; k < queries.length; k++) {
            if (queries[k].piecesInQuery.includes(pieceId)) {
              cell.colors[pieceId] = queries[k].color;
            }
          }
        }
      }
    }

    let cellColors = {};
    cells.forEach(cell => {
      cellColors[cell.id] = cell.colors;
    });
    this.setState(prevState => {
      if (JSON.stringify(prevState.cellColors) !== JSON.stringify(cellColors)) {
        return { cellColors };
      } else {
        return {};
      }
    });
  };

  render() {
    const { queries, cellColors } = this.state;

    return (
      <React.Fragment>
        {' '}
        <Divider light />{' '}
        <BaseComponent shouldOpenOnMount={true} headerName={'Timeline'}>
          <div className={styles.TimelineContainer}>
            {queries.map((query, idx) => {
              return (
                <Query
                  idx={idx}
                  key={query.id}
                  query={query}
                  cellColors={cellColors}
                />
              );
            })}
          </div>
          <button onClick={this.regenColorPalette}>regen colors</button>
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default TimelineComponent;
