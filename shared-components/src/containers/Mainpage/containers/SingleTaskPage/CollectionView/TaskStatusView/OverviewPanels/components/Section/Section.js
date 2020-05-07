import React, { Component } from 'react';
import styles from './Section.css';

import { Collapse } from 'react-collapse';
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';

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

    let statusString = 'good';

    let gradeColor = '#4dae4c';
    if (numOfWarnings === 1) {
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
          [isOpen ? 'borderTopColor' : 'borderLeftColor']: gradeColor
        }}
      >
        {headerName && (
          <div
            className={styles.SectionHeader}
            onClick={this.handleSwitchCollapsedStatus}
          >
            <div className={styles.HeaderName}>{headerName}</div>
            {!isOpen && (
              <div className={styles.HeaderContent}>{headerContent}</div>
            )}

            <div className={styles.CollapseButtonContainer}>
              <div
                className={styles.StatusIndicator}
                style={{
                  backgroundColor: gradeColor,
                  color: invert(gradeColor, true)
                }}
              >
                {statusString}
              </div>
              <div className={styles.CollapseButton}>
                {isOpen ? <IoIosArrowDown /> : <IoIosArrowBack />}
              </div>
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
