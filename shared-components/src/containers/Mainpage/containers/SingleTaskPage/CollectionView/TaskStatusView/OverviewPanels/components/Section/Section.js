import React, { Component } from 'react';
import styles from './Section.css';

import { Collapse } from 'react-collapse';
import {
  IoIosArrowBack,
  IoIosArrowDown,
  IoIosArrowForward
} from 'react-icons/io';

import invert from 'invert-color';

class Section extends Component {
  state = { isOpen: true };

  handleSwitchCollapsedStatus = e => {
    this.setState(prevState => {
      return { isOpen: !prevState.isOpen };
    });
  };

  render() {
    const {
      headerName,
      headerContent,
      children,
      footer,
      numOfWarnings
    } = this.props;
    const { isOpen } = this.state;

    let statusString = '';
    let gradeColor = '#d3d3d3';

    if (numOfWarnings === 0) {
      gradeColor = '#4dae4c';
      statusString = 'good';
    } else if (numOfWarnings === 1) {
      gradeColor = '#FCBB21';
      statusString = 'fair';
    } else if (numOfWarnings > 1) {
      gradeColor = '#E32722';
      statusString = 'poor';
    }

    return (
      <div
        className={[
          styles.Section,
          isOpen ? styles.SectionOpen : styles.SectionClosed
        ].join(' ')}
        style={{
          [isOpen ? 'borderTopColor' : 'borderRightColor']: gradeColor
        }}
      >
        {headerName && (
          <div
            className={styles.SectionHeader}
            onClick={this.handleSwitchCollapsedStatus}
          >
            <div className={styles.CollapseButtonContainer}>
              <div className={styles.CollapseButton}>
                {isOpen ? <IoIosArrowDown /> : <IoIosArrowForward />}
              </div>
            </div>

            <div className={styles.HeaderName}>{headerName}</div>
            {!isOpen && (
              <div className={styles.HeaderContent}>{headerContent}</div>
            )}

            <div style={{ flex: 1 }} />

            <div
              className={styles.StatusIndicator}
              style={{
                display: statusString.length === 0 ? 'none' : null,
                backgroundColor: gradeColor,
                color: invert(gradeColor, {
                  black: '#3a3a3a',
                  white: '#fafafa',
                  threshold: 0.33
                })
              }}
            >
              {statusString}
            </div>
          </div>
        )}
        <Collapse isOpened={isOpen}>
          <div className={styles.SectionContent}>{children}</div>
          {footer && <div className={styles.SectionFooter}>{footer}</div>}
        </Collapse>
      </div>
    );
  }
}

export default Section;
