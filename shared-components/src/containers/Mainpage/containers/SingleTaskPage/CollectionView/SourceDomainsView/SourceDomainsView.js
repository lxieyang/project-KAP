import React, { Component } from 'react';
import { reverse, sortBy } from 'lodash';
import styles from './SourceDomainsView.css';

import Divider from '@material-ui/core/Divider';
import Popover from 'react-tiny-popover';

// const domains = [
//   {
//     domain: 'stackoverflow.com'
//   },
//   {
//     domain: 'www.chromium.org'
//   },
//   {
//     domain: 'medium.com'
//   }
// ];

class SourceDomainsView extends Component {
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
    const { pages } = this.props;

    let domains = [];
    pages.forEach(p => {
      if (domains.filter(d => d.domain === p.domain).length === 0) {
        domains.push({ domain: p.domain, pages: [p.url], numberOfPages: 1 });
      } else {
        domains = domains.map(d => {
          if (d.domain === p.domain) {
            d.pages.push(p.url);
            d.numberOfPages = d.pages.length;
          }
          return d;
        });
      }
    });

    domains = reverse(sortBy(domains, ['numberOfPages']));

    // console.log(domains);

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
                  <li># of pages</li>
                  <li># of snippets</li>
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
                  {domains.map((d, idx) => (
                    <li key={idx}> &#10003; {d.domain}</li>
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

        {domains.map((item, idx) => {
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
                  {item.domain}
                </div>
              </div>
              {idx !== domains.length - 1 && <Divider light />}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

export default SourceDomainsView;
