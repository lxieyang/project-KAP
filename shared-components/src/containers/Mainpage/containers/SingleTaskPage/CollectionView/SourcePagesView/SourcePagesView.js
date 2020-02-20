import React, { Component } from 'react';
import styles from './SourcePagesView.css';

import Divider from '@material-ui/core/Divider';
import Popover from 'react-tiny-popover';

const pages = [
  {
    title: 'Storing Objects in HTML5 localStorage',
    domain: 'stackoverflow.com'
  },
  {
    title: 'Is HTML5 localStorage asynchronous?',
    domain: 'stackoverflow.com'
  },
  {
    title:
      'Changes to Cross-Origin Requests in Chrome Extension Content Scripts',
    domain: 'www.chromium.org'
  },
  {
    title: 'Add data to Cloud Firestore',
    domain: 'firebase.google.com/'
  },
  {
    title:
      'Why we moved from Angular 2 to Vue.js (and why we didn’t choose React)',
    domain: 'medium.com'
  }
];

class SourcePagesView extends Component {
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
    return (
      <div className={styles.SourceDomainsViewContainer}>
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
                  <li># of snippets</li>
                  <li>time</li>
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
                  {pages.map((d, idx) => (
                    <li key={idx}> &#10003; {d.title}</li>
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

        {pages.map((item, idx) => {
          return (
            <React.Fragment key={idx}>
              <div className={styles.SourceDomainItemContainer}>
                <div className={styles.DomainNameContainer}>
                  <img
                    className={styles.DomainIcon}
                    src={`https://plus.google.com/_/favicon?domain_url=${
                      item.domain
                    }`}
                    alt={item.domain}
                  />
                  {item.title}
                </div>
              </div>
              {idx !== pages.length - 1 && <Divider light />}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

export default SourcePagesView;
