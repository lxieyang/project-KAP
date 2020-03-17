import React, { Component } from 'react';
import styles from './CompletenessPanel.css';

import { sortBy, reverse } from 'lodash';

import { AiOutlineSearch } from 'react-icons/ai';
import { GiTargeting, GiMicroscope, GiBinoculars } from 'react-icons/gi';
import Avatar from '@material-ui/core/Avatar';
import {
  IoIosArrowDropup,
  IoIosArrowDropdown,
  IoMdMedal
} from 'react-icons/io';
import { FaFlagCheckered, FaListUl, FaBookmark } from 'react-icons/fa';
import { MdPinDrop } from 'react-icons/md';
import { TiUser } from 'react-icons/ti';

import { PIECE_TYPES } from '../../../../../../../../shared/types';
import { PIECE_COLOR } from '../../../../../../../../shared/theme';

import InfoTooltip from '../components/InfoTooltip/InfoTooltip';

import moment from 'moment';

class CompletenessPanel extends Component {
  state = {};

  render() {
    let { queries, pieces, pages } = this.props;

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

    pages = reverse(sortBy(pages, ['piecesNumber']));

    pages = pages.filter((_, idx) => idx < 4);

    // pages = pages.filter(page => page.piecesNumber > 0);

    return (
      <div className={styles.PanelContainer}>
        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <GiMicroscope className={styles.SectionHeaderIcon} />
            <span className={styles.UpToDate}>Extensive</span>
            Research
          </div>
          <div className={styles.SectionContent}>
            <p>The author spent a total of 56 minutes on the task.</p>
            <p>
              The author went through 13 pages, and collected 3 options, 3
              criteria, and 7 pieces of evidence
            </p>
          </div>
          <div className={styles.SectionFooter}>
            <div
              className={styles.LinkToElsewhere}
              onClick={e => this.props.changeTab(e, 0)}
            >
              See the complete list of web pages the author went through
            </div>
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <GiBinoculars className={styles.SectionHeaderIcon} />
            Next steps
          </div>
          <div className={styles.SectionContent}>
            <p>
              Based on everything so far, we think you might want explore the
              following options:
            </p>
            <p>
              <div className={styles.ListItem}>xxxxxxxxx</div>
              <div className={styles.ListItem}>yyyyyyyyy</div>
              <div className={styles.ListItem}>zzzzzzzzz</div>
            </p>
          </div>
        </div>

        {/* <div className={styles.Section}>
          <div className={styles.SectionHeader}>Pages & Snippets</div>
          <div className={styles.ExplanationText}>
            These are the top pages that the author collected information from.
          </div>
          <div>
            {pages.map((item, idx) => {
              let progress = item.scrollPercentage ? item.scrollPercentage : 0; // Math.round(Math.random() * 100) / 100;
              const numberOfOptions = item.piecesInPage.filter(
                piece => piece.pieceType === PIECE_TYPES.option
              ).length;
              const numberOfCriteria = item.piecesInPage.filter(
                piece => piece.pieceType === PIECE_TYPES.criterion
              ).length;
              let numberOfSnippets = item.piecesInPage.filter(
                piece => piece.pieceType === PIECE_TYPES.snippet
              ).length;

              return (
                <React.Fragment key={idx}>
                  <div className={[styles.PageItemContainer].join(' ')}>
                    <div
                      className={styles.PageProgressIndicator}
                      style={{ width: `${progress * 100}%` }}
                    />
                    <div className={styles.PageNameContainer}>
                      <img
                        src={
                          item.faviconUrl
                            ? item.faviconUrl
                            : `https://plus.google.com/_/favicon?domain_url=${
                                item.references.url
                              }`
                        }
                        alt=""
                        className={styles.ItemIcon}
                      />
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
                        {item.duration &&
                          `${parseInt(
                            moment.duration(item.duration).asMinutes(),
                            10
                          )}m ${moment.duration(item.duration).seconds()}s`}
                        {!item.duration && `still open`}
                        
                      </div>
                    </div>
                    <div className={styles.PageSnippetsInfoContainer}>
                      {numberOfOptions > 0 && (
                        <span>
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
                          {numberOfOptions} options
                        </span>
                      )}
                      {numberOfCriteria > 0 && (
                        <span>
                          <Avatar
                            style={{
                              backgroundColor: PIECE_COLOR.criterion,
                              width: '18px',
                              height: '18px',
                              color: 'white'
                            }}
                            className={styles.Avatar}
                          >
                            <FaFlagCheckered
                              className={styles.IconInsideAvatar}
                            />
                          </Avatar>
                          {numberOfCriteria} criteria
                        </span>
                      )}
                      {numberOfSnippets > 0 && (
                        <span>
                          <Avatar
                            style={{
                              backgroundColor: PIECE_COLOR.snippet,
                              width: '18px',
                              height: '18px',
                              color: 'white'
                            }}
                            className={styles.Avatar}
                          >
                            <FaBookmark className={styles.IconInsideAvatar} />
                          </Avatar>
                          {numberOfSnippets} ratings
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div> */}
      </div>
    );
  }
}

export default CompletenessPanel;
