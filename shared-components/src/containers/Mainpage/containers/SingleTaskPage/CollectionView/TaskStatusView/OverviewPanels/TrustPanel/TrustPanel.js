import React, { Component } from 'react';
import styles from './TrustPanel.css';

import { sortBy, reverse } from 'lodash';

import { AiOutlineSearch } from 'react-icons/ai';
import { GiTargeting } from 'react-icons/gi';
import Avatar from '@material-ui/core/Avatar';
import { IoIosArrowDropup, IoIosArrowDropdown } from 'react-icons/io';
import { FaFlagCheckered, FaListUl, FaBookmark } from 'react-icons/fa';

import { PIECE_TYPES } from '../../../../../../../../shared/types';
import { PIECE_COLOR } from '../../../../../../../../shared/theme';

import moment from 'moment';

class TrustPanel extends Component {
  state = {};

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

    domains = domains.map(d => {
      let updateDate = d.pages[0].updateDate;
      d.pages.forEach(p => {
        if (p.updateDate > updateDate) {
          updateDate = p.updateDate;
        }
      });
      d.updateDate = updateDate;
      return d;
    });

    domains = reverse(sortBy(domains, ['numberOfPages', 'numberOfPieces']));

    // console.log(domains);

    return (
      <div className={styles.PanelContainer}>
        <div className={styles.Section}>
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
                    {/* <div>{moment(item.updateDate).format('h:mma')}</div> */}
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
        </div>
      </div>
    );
  }
}

export default TrustPanel;
