import React, { Component } from 'react';
import { reverse, sortBy } from 'lodash';
import styles from './SourceDomainsView.css';

import { Collapse } from 'react-collapse';
import { IoIosArrowDropup, IoIosArrowDropdown } from 'react-icons/io';

import Divider from '@material-ui/core/Divider';
import Popover from 'react-tiny-popover';
import moment from 'moment';

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

class DomainItem extends Component {
  state = {
    isOpen: true
  };

  toggleOpenStatus = () => {
    this.setState(prevState => {
      return { isOpen: !prevState.isOpen };
    });
  };

  render() {
    const { domainItem } = this.props;
    let { pages } = domainItem;

    pages = reverse(sortBy(pages, ['piecesNumber']));

    return (
      <div className={styles.SourceDomainItemContainer}>
        <div
          className={styles.DomainNameContainer}
          onClick={() => this.toggleOpenStatus()}
        >
          <img
            className={styles.DomainIcon}
            src={
              domainItem.favicon
                ? domainItem.favicon
                : `https://plus.google.com/_/favicon?domain_url=${
                    domainItem.domain
                  }`
            }
            alt={domainItem.domain}
          />
          <div className={styles.DomainTitle}>{domainItem.domain}</div>
          <div className={styles.DomainStats}>
            {domainItem.numberOfPages} pages &nbsp; {domainItem.numberOfPieces}{' '}
            snippets
          </div>

          <div style={{ flex: 1 }} />
          {!this.state.isOpen ? (
            <IoIosArrowDropdown className={styles.CollapseIcon} />
          ) : (
            <IoIosArrowDropup className={styles.CollapseIcon} />
          )}
        </div>
        <Collapse isOpened={this.state.isOpen}>
          <div className={styles.DomainPagesContainer}>
            {pages.map((item, idx) => {
              let progress = Math.round(Math.random() * 100) / 100;
              return (
                <React.Fragment key={idx}>
                  <div className={[styles.PageItemContainer].join(' ')}>
                    <div
                      className={styles.PageProgressIndicator}
                      style={{ width: `${progress * 100}%` }}
                    />
                    <div className={styles.PageNameContainer}>
                      <div className={styles.PageTitleContent} title={item.url}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.title}
                        </a>
                      </div>
                      <div className={styles.PageMetaInfo}>
                        {/* {item.duration &&
                          `${parseInt(
                            moment.duration(item.duration).asMinutes(),
                            10
                          )}m ${moment.duration(item.duration).seconds()}s`}
                        {!item.duration && `still open`} */}
                        <React.Fragment>
                          <div>{moment(item.creationDate).format('MMM D')}</div>
                          <div>{moment(item.creationDate).format('h:mma')}</div>
                        </React.Fragment>
                      </div>
                    </div>
                  </div>
                  {/* {idx !== pages.length - 1 && <Divider light />} */}
                </React.Fragment>
              );
            })}
          </div>
        </Collapse>
      </div>
    );
  }
}

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
    let { pages, pieces } = this.props;

    pages = pages.map(page => {
      const piecesInPage = pieces
        .filter(item => item.references.url === page.url)
        .map(item => item.id);
      page.piecesInPage = piecesInPage;
      page.piecesNumber = piecesInPage.length;
      return page;
    });

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
            if (d.favicon === null) {
              d.favicon = p.faviconUrl;
            }
          }
          return d;
        });
      }
    });

    domains = reverse(sortBy(domains, ['numberOfPages', 'numberOfPieces']));

    return (
      <div className={styles.SourceDomainsViewContainer}>
        {/* <div className={styles.InfoBar}>
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
        </div> */}
        <div className={styles.ListContainer}>
          {domains.map((item, idx) => {
            return (
              <React.Fragment key={idx}>
                <DomainItem domainItem={item} />

                {idx !== domains.length - 1 && <Divider light />}
              </React.Fragment>
            );
          })}
          <div style={{ height: 200 }} />
        </div>
      </div>
    );
  }
}

export default SourceDomainsView;
