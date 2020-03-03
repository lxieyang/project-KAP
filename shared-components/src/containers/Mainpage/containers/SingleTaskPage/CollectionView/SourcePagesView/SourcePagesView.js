import React, { Component } from 'react';
import { reverse, sortBy } from 'lodash';
import styles from './SourcePagesView.css';

import Divider from '@material-ui/core/Divider';
import Popover from 'react-tiny-popover';
import moment from 'moment';

import TaskContext from '../../../../../../shared/task-context';
import { PIECE_TYPES } from '../../../../../../shared/types';

// const pages = [
//   {
//     title: 'Storing Objects in HTML5 localStorage',
//     domain: 'stackoverflow.com'
//   },
//   {
//     title: 'Is HTML5 localStorage asynchronous?',
//     domain: 'stackoverflow.com'
//   },
//   {
//     title:
//       'Changes to Cross-Origin Requests in Chrome Extension Content Scripts',
//     domain: 'www.chromium.org'
//   },
//   {
//     title: 'Add data to Cloud Firestore',
//     domain: 'firebase.google.com/'
//   },
//   {
//     title:
//       'Why we moved from Angular 2 to Vue.js (and why we didn’t choose React)',
//     domain: 'medium.com'
//   }
// ];

class SourcePagesView extends Component {
  static contextType = TaskContext;

  state = {
    isSortByPopoverOpen: false,
    sortByCriteria: 'piecesNumber',

    isFilterByPopoverOpen: false,
    filterByShowAllPagesVisited: true
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
    let { pages, pieces } = this.props;
    const { sortByCriteria, filterByShowAllPagesVisited } = this.state;

    pages = pages.map(page => {
      const piecesInPage = pieces
        .filter(item => item.references.url === page.url)
        .map(item => item.id);
      page.piecesInPage = piecesInPage;
      page.piecesNumber = piecesInPage.length;
      return page;
    });

    if (filterByShowAllPagesVisited === false) {
      pages = pages.filter(page => page.piecesNumber > 0);
    }

    if (sortByCriteria === 'creationDate') {
      pages = sortBy(pages, [sortByCriteria]);
    } else if (sortByCriteria === 'duration') {
      pages = reverse(sortBy(pages, [sortByCriteria]));
    } else if (sortByCriteria === 'piecesNumber') {
      pages = reverse(sortBy(pages, [sortByCriteria]));
    } // console.log(pages);

    return (
      <div className={styles.SourcePagesViewContainer}>
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
                  <li
                    style={{
                      backgroundColor:
                        sortByCriteria === 'piecesNumber' ? 'lightgreen' : null
                    }}
                    onClick={() => {
                      this.setState({ sortByCriteria: 'piecesNumber' });
                    }}
                  >
                    # of pieces collected
                  </li>
                  <li
                    style={{
                      backgroundColor:
                        sortByCriteria === 'creationDate' ? 'lightgreen' : null
                    }}
                    onClick={() => {
                      this.setState({ sortByCriteria: 'creationDate' });
                    }}
                  >
                    Visit timestamp
                  </li>
                  <li
                    style={{
                      backgroundColor:
                        sortByCriteria === 'duration' ? 'lightgreen' : null
                    }}
                    onClick={() => {
                      this.setState({ sortByCriteria: 'duration' });
                    }}
                  >
                    Duration of stay
                  </li>
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
                  <li
                    style={{
                      backgroundColor: filterByShowAllPagesVisited
                        ? 'lightgreen'
                        : null
                    }}
                    onClick={() => {
                      this.setState({ filterByShowAllPagesVisited: true });
                    }}
                  >
                    Show all visited pages
                  </li>

                  <li
                    style={{
                      backgroundColor: !filterByShowAllPagesVisited
                        ? 'lightgreen'
                        : null
                    }}
                    onClick={() => {
                      this.setState({ filterByShowAllPagesVisited: false });
                    }}
                  >
                    Only show the pages that have snippets
                  </li>
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

        <div className={styles.ListContainer}>
          {pages.map((item, idx) => {
            return (
              <React.Fragment key={idx}>
                <div
                  className={[
                    styles.ItemContainer,
                    this.context.selectedUrls.indexOf(item.url) !== -1
                      ? styles.Selected
                      : null
                  ].join(' ')}
                  onClick={e => this.context.addSelectedUrl(item.url)}
                >
                  <div className={styles.NameContainer}>
                    <img
                      className={styles.ItemIcon}
                      src={
                        item.faviconUrl
                          ? item.faviconUrl
                          : `https://plus.google.com/_/favicon?domain_url=${
                              item.url
                            }`
                      }
                      alt={item.domain}
                    />
                    <div className={styles.TitleContent} title={item.url}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.title}
                      </a>
                    </div>
                    <div className={styles.MetaData}>
                      {sortByCriteria === 'duration' && (
                        <React.Fragment>
                          {item.duration &&
                            `${parseInt(
                              moment.duration(item.duration).asMinutes(),
                              10
                            )}m ${moment.duration(item.duration).seconds()}s`}
                          {!item.duration && `still open`}
                        </React.Fragment>
                      )}
                      {sortByCriteria === 'creationDate' ||
                        (sortByCriteria === 'piecesNumber' && (
                          <React.Fragment>
                            <div>
                              {moment(item.creationDate).format('MMM D')}
                            </div>
                            <div>
                              {moment(item.creationDate).format('h:mma')}
                            </div>
                          </React.Fragment>
                        ))}
                    </div>
                  </div>
                  <div className={styles.RelatedContentContainer}>
                    {/* {item.piecesInPage.map((piece, pidx) => {
                      return <div key={pidx}>{piece}</div>;
                    })} */}
                    {item.piecesInPage.length > 0 && (
                      <React.Fragment>
                        {item.piecesInPage.length} snippets
                      </React.Fragment>
                    )}
                  </div>
                </div>
                {idx !== pages.length - 1 && <Divider light />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
}

export default SourcePagesView;
