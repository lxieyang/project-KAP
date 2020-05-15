import React, { Component } from 'react';
import { sortBy } from 'lodash';
import BaseComponent from '../BaseComponent/BaseComponent';
import { SliderPicker } from 'react-color';
import { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
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
        // onClick={() => this.props.progressCheckClicked(idx)}
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
    isOpen: false
  };

  componentDidUpdate(prevProps) {
    if (prevProps.cellColors !== this.props.cellColors) {
      this.context.setCellColors(this.props.cellColors);
    }

    if (prevProps.query.piecesInQuery !== this.props.query.piecesInQuery) {
      if (this.props.query.piecesInQuery.length > 0) {
        this.setState({ isOpen: true });
      }
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
    const { pages, piecesInQuery } = query;

    return (
      <div
        className={styles.QueryBlockContainer}
        style={{ backgroundColor: query.color }}
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

          {!isOpen && (
            <div className={styles.QueryPagesStatsContainer}>
              ({pages.length} pages
              {pages.length > 0 ? `, ${piecesInQuery.length} snippets` : null})
            </div>
          )}

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

const numOfColors = 1;
const startAlphaInitial = 0.05;
const endAlphaInitial = 0.5;

class TimelineComponent extends Component {
  static contextType = TaskContext;
  state = {
    queries: [],
    cellColors: {},
    progressCheckerIdx: -1,

    colorAdjustmentIsOpen: false,
    baseColor: '#fff',
    startAlpha: startAlphaInitial,
    endAlpha: endAlphaInitial
  };

  handleColorAdjustmentIsOpenClicked = () => {
    this.setState(prevState => {
      return { colorAdjustmentIsOpen: !prevState.colorAdjustmentIsOpen };
    });
  };

  componentDidMount() {
    let baseColor = localStorage.getItem('baseColor');
    if (!baseColor) {
      baseColor = randomColor();
      localStorage.setItem('baseColor', baseColor);
    }

    let startAlpha = localStorage.getItem('startAlpha');
    if (!startAlpha) {
      startAlpha = startAlphaInitial;
      localStorage.setItem('startAlpha', startAlpha);
    } else {
      startAlpha = parseFloat(startAlpha);
    }

    let endAlpha = localStorage.getItem('endAlpha');
    if (!endAlpha) {
      endAlpha = endAlphaInitial;
      localStorage.setItem('endAlpha', endAlpha);
    } else {
      endAlpha = parseFloat(endAlpha);
    }
    this.setState({ baseColor, startAlpha, endAlpha }, () => {
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

  handleBaseColorChangeComplete = color => {
    color = color.hex;
    localStorage.setItem('baseColor', color);
    this.setState({ baseColor: color }, () => {
      this.updateData();
    });
  };

  handleBaseColorChange = color => {
    color = color.hex;
    this.setState({ baseColor: color }, () => {
      let { queries, baseColor, startAlpha, endAlpha } = this.state;
      this.setState({
        queries: this.updateQueryColors(
          queries,
          baseColor,
          startAlpha,
          endAlpha
        )
      });
    });
  };

  handleStartEndAlphaChangeComplete = ([startAlpha, endAlpha]) => {
    startAlpha /= 100;
    endAlpha /= 100;
    localStorage.setItem('startAlpha', startAlpha);
    localStorage.setItem('endAlpha', endAlpha);
    this.setState({ startAlpha, endAlpha }, () => {
      this.updateData();
    });
  };

  updateQueryColors = (queries, baseColor, startAlpha, endAlpha) => {
    let queriesNeedColorAssignment = queries.filter(
      q => q.piecesInQuery.length > 0
    );
    if (queriesNeedColorAssignment.length === 1) {
      queries = queries.map(q => {
        if (q.piecesInQuery.length > 0) {
          q.color = colorAlpha(baseColor, endAlpha);
        }
        return q;
      });
    } else if (queriesNeedColorAssignment.length > 1) {
      const increment =
        (endAlpha - startAlpha) / (queriesNeedColorAssignment.length - 1);
      let pointer = 0;
      for (let i = 0; i < queries.length; i++) {
        let query = queries[i];
        if (query.piecesInQuery.length > 0) {
          query.color = colorAlpha(baseColor, startAlpha + pointer * increment);
          pointer += 1;
        }
      }
    }

    return queries;
  };

  updateData = () => {
    let { queries, pages, cells } = this.props;
    const { baseColor, startAlpha, endAlpha } = this.state;

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

        if (minDuration > 20) {
          p.duration = 20 * 60 * 1000;
        } else if (secDuration < 60) {
          p.duration = 1 * 60 * 1000;
        }
        return p;
      });

      // calculate query duration
      query.duration = query.pages
        .map(p => p.duration)
        .reduce((a, b) => {
          return a + b;
        }, 0);

      query.color = 'transparent';

      // gather pieces in the query
      query.piecesInQuery = [];
      query.pages.forEach(p => {
        let pieceIds = p.piecesInPage.map(piece => piece.id);
        query.piecesInQuery = query.piecesInQuery.concat(pieceIds);
      });
    }

    queries = this.updateQueryColors(queries, baseColor, startAlpha, endAlpha);

    // assign color

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
    const { queries, baseColor, startAlpha, endAlpha, cellColors } = this.state;

    return (
      <React.Fragment>
        {' '}
        <Divider light />{' '}
        <BaseComponent
          shouldOpenOnMount={this.props.shouldOpenOnMount}
          headerName={'Timeline'}
          headerNameClicked={this.handleColorAdjustmentIsOpenClicked}
        >
          <Collapse isOpened={this.state.colorAdjustmentIsOpen}>
            <SliderPicker
              color={baseColor}
              onChange={this.handleBaseColorChange}
              onChangeComplete={this.handleBaseColorChangeComplete}
            />
            <br />
            Start alpha val: {this.state.startAlpha}
            <br />
            End alpha val: {this.state.endAlpha}
            <br />
            <Range
              min={0}
              max={100}
              value={[startAlpha * 100, endAlpha * 100]}
              onChange={([startAlpha, endAlpha]) =>
                this.setState({
                  startAlpha: startAlpha / 100,
                  endAlpha: endAlpha / 100
                })
              }
              onAfterChange={this.handleStartEndAlphaChangeComplete}
              tipFormatter={value => `${value}%`}
            />
            <br />
          </Collapse>
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
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default TimelineComponent;
