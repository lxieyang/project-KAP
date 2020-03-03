import React, { Component } from 'react';
import styles from './SourceQueriesView.css';

import Divider from '@material-ui/core/Divider';
import Popover from 'react-tiny-popover';
import moment from 'moment';
import { sortBy } from 'lodash';

import { AiOutlineSearch } from 'react-icons/ai';

function getRandomDate(from, to) {
  from = from.getTime();
  to = to.getTime();
  return new Date(from + Math.random() * (to - from));
}

const fromDate = new Date(2020, 2, 19);
const toDate = new Date(2020, 2, 20);

// const queries = [
//   {
//     query: 'how to store information in a chrome extension',
//     timestamp: getRandomDate(fromDate, toDate)
//   },
//   {
//     query: 'chrome storage API v.s. localStorage',
//     timestamp: getRandomDate(fromDate, toDate)
//   },
//   {
//     query: 'chrome storage API syncing',
//     timestamp: getRandomDate(fromDate, toDate)
//   },
//   {
//     query: 'firebase',
//     timestamp: getRandomDate(fromDate, toDate)
//   },
//   {
//     query: 'firebase offline access',
//     timestamp: getRandomDate(fromDate, toDate)
//   },
//   {
//     query: 'localStorage scope',
//     timestamp: getRandomDate(fromDate, toDate)
//   },
//   {
//     query: 'storage limit of chrome storage api',
//     timestamp: getRandomDate(fromDate, toDate)
//   }
// ];

class SourceQueriesView extends Component {
  state = {
    isSortByPopoverOpen: false,
    isFilterByPopoverOpen: false
  };

  setIsSortByPopoverOpen = to => {
    this.setState({
      isSortByPopoverOpen: to
    });
  };

  setIsFilterByPopoverOpen = to => {
    this.setState({ isFilterByPopoverOpen: to });
  };

  render() {
    let { queries, pages } = this.props;

    queries = queries.map(q => {
      const queryId = q.id;
      const visitedPages = sortBy(
        pages.filter(p => p.references.searchQuery === queryId),
        ['creationDate']
      );
      return {
        ...q,
        visitedPages
      };
    });

    queries = sortBy(queries, ['creationDate']);

    return (
      <div className={styles.SourceQueriesViewContainer}>
        <div className={styles.InfoBar}>
          <Popover
            isOpen={this.state.isSortByPopoverOpen}
            position={'bottom'}
            containerClassName={styles.PopoverContainer}
            onClickOutside={
              () => this.setIsSortByPopoverOpen(!this.state.isSortByPopoverOpen) // preferred position
            }
            content={
              <div
                style={
                  { backgroundColor: 'white' } // containerClassName={styles.PopoverContainer}
                }
              >
                <ul style={{ padding: 0 }}>
                  <li>- time</li>
                  <li>- # of pages</li>
                  <li>- # of snippets</li>
                  <li>etc.</li>
                </ul>
              </div>
            }
          >
            <div
              className={styles.InfoItem}
              onClick={() =>
                this.setIsSortByPopoverOpen(!this.state.isSortByPopoverOpen)
              }
            >
              Sort by
            </div>
          </Popover>

          <Popover
            isOpen={this.state.isFilterByPopoverOpen}
            position={'bottom'}
            containerClassName={styles.PopoverContainer}
            onClickOutside={
              () =>
                this.setIsFilterByPopoverOpen(!this.state.isFilterByPopoverOpen) // preferred position
            }
            content={
              <div
                style={
                  { backgroundColor: 'white' } // containerClassName={styles.PopoverContainer}
                }
              >
                <ul style={{ padding: 0 }}>
                  {queries.map((d, idx) => (
                    <li key={idx}> &#10003; {d.query}</li>
                  ))}
                </ul>
              </div>
            }
          >
            <div
              className={styles.InfoItem}
              onClick={() =>
                this.setIsFilterByPopoverOpen(!this.state.isFilterByPopoverOpen)
              }
            >
              Filter
            </div>
          </Popover>
        </div>

        {queries.map((item, idx) => {
          return (
            <React.Fragment key={idx}>
              <div className={styles.ItemContainer}>
                <div className={styles.NameContainer}>
                  <AiOutlineSearch className={styles.ItemIcon} />
                  <div className={styles.QueryContent}>
                    {item.query} {item.visitedPages.length}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div className={styles.TimeContainer}>
                    <div>{moment(item.creationDate).format('MMM D')}</div>
                    <div>{moment(item.creationDate).format('h:ma')}</div>
                  </div>
                </div>
              </div>
              {idx !== queries.length - 1 && <Divider light />}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

export default SourceQueriesView;
