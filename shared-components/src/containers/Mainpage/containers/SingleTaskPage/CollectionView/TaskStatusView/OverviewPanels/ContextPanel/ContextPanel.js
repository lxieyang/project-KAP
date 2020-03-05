import React, { Component } from 'react';
import styles from './ContextPanel.css';

import { sortBy } from 'lodash';

import { AiOutlineSearch } from 'react-icons/ai';
import { GiTargeting } from 'react-icons/gi';
import Avatar from '@material-ui/core/Avatar';
import { IoIosArrowDropup, IoIosArrowDropdown } from 'react-icons/io';
import { FaFlagCheckered, FaListUl, FaBookmark } from 'react-icons/fa';

import { PIECE_TYPES } from '../../../../../../../../shared/types';
import { PIECE_COLOR } from '../../../../../../../../shared/theme';

class ContextPanel extends Component {
  state = {};

  render() {
    let { queries, pieces } = this.props;
    queries = sortBy(queries, ['creationDate']);
    // console.log(queries);

    const queriesToDisplay = queries
      ? queries.filter((q, idx) => {
          if (idx > 2) {
            return false;
          }
          return true;
        })
      : [];

    const displayPieces = pieces.filter(
      p => p.pieceType === PIECE_TYPES.criterion
    );

    return (
      <div className={styles.PanelContainer}>
        <div className={styles.Section}>
          <div className={styles.SectionHeader}>Goal</div>
          <div className={styles.ExplanationText}>
            This is the goal of the author (default is the first search query
            that the author used unless the author specifically edited it).
          </div>
          <div>The author wanted to find out: </div>
          <div className={styles.ListItem}>
            <GiTargeting className={styles.ItemIcon} />
            {queriesToDisplay.length > 0 && queriesToDisplay[0].query}
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>Queries</div>
          <div className={styles.ExplanationText}>
            These are the top search queries that the author used.
          </div>
          <div>
            {queriesToDisplay.map((item, idx) => {
              return (
                <div key={idx} className={styles.ListItem}>
                  <AiOutlineSearch className={styles.ItemIcon} />
                  <div className={styles.ItemContent}>{item.query}</div>
                  <div style={{ flex: 1 }} />
                  <div className={styles.ItemMetaInfo} />
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>Criteria</div>
          <div className={styles.ExplanationText}>
            These are the criteria that the author found.
          </div>
          <div>
            {displayPieces.map((item, idx) => {
              return (
                <div key={idx} className={styles.ListItem}>
                  <Avatar
                    style={{
                      backgroundColor: PIECE_COLOR.criterion,
                      width: '18px',
                      height: '18px',
                      color: 'white'
                    }}
                    className={styles.Avatar}
                  >
                    <FaFlagCheckered className={styles.IconInsideAvatar} />
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

export default ContextPanel;
