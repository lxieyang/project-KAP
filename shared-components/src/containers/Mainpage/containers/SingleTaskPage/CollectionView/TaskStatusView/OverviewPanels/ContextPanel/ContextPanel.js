import React, { Component } from 'react';
import styles from './ContextPanel.css';

import { sortBy } from 'lodash';

import { AiOutlineSearch } from 'react-icons/ai';
import { GiTargeting } from 'react-icons/gi';
import Avatar from '@material-ui/core/Avatar';
import {
  IoIosArrowDropup,
  IoIosArrowDropdown,
  IoIosTimer,
  IoMdGlobe
} from 'react-icons/io';
import { FaFlagCheckered, FaListUl, FaBookmark } from 'react-icons/fa';

import { PIECE_TYPES } from '../../../../../../../../shared/types';
import { PIECE_COLOR } from '../../../../../../../../shared/theme';

import InfoTooltip from '../components/InfoTooltip/InfoTooltip';

import Textarea from 'react-textarea-autosize';

class ContextPanel extends Component {
  state = {
    goalText: 'differences between python matrix and numpy array'
  };

  handleGoalTextChange = e => {
    this.setState({ goalText: e.target.value });
  };

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
          <div className={styles.SectionHeader}>
            <GiTargeting className={styles.SectionHeaderIcon} />
            Goal{' '}
            <InfoTooltip id={'goal'}>
              This is the goal of the author (default is the first search query
              that the author used unless the author specifically edited it)
            </InfoTooltip>
          </div>
          <div className={styles.SectionContent}>
            {/* <p>{this.state.goalText}</p> */}
            <Textarea
              minRows={1}
              maxRows={3}
              placeholder={''}
              className={styles.Textarea}
              value={this.state.goalText}
              onChange={this.handleGoalTextChange}
            />
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <IoIosTimer className={styles.SectionHeaderIcon} />
            Information is <span className={styles.UpToDate}>
              up-to-date
            </span>{' '}
          </div>
          <div className={styles.SectionContent}>
            <p>The task was updated 4 days ago.</p>
            <p>The oldest information was from 1 year ago.</p>
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <AiOutlineSearch className={styles.SectionHeaderIcon} />
            The author searched for
            <InfoTooltip id={'criteria'}>
              These are the top search queries that the author used.
            </InfoTooltip>
          </div>
          <div className={styles.SectionContent}>
            {queriesToDisplay.map((item, idx) => {
              return (
                <div key={idx} className={styles.ListItem}>
                  {item.query}
                </div>
              );
            })}
          </div>
          <div className={styles.SectionFooter}>
            <div
              className={styles.LinkToElsewhere}
              onClick={e => this.props.changeTab(e, 1)}
            >
              See the complete list of search queries
            </div>
          </div>
        </div>

        <div className={styles.Section}>
          <div className={styles.SectionHeader}>
            <IoMdGlobe className={styles.SectionHeaderIcon} />
            Envrionment and constraints
            <div className={styles.HeaderButtonAlignRight}>
              <div className={styles.AddButton}>Add</div>
            </div>
          </div>

          <div className={styles.SectionContent}>
            <div className={styles.ListItem}>macOS</div>
            <div className={styles.ListItem}>python 2.7</div>
          </div>
        </div>
      </div>
    );
  }
}

export default ContextPanel;
