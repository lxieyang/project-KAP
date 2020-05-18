import React, { Component } from 'react';
import styles from './Section.css';
import TaskContext from '../../../../../../../../../shared/task-context';

import { Collapse } from 'react-collapse';
import {
  IoIosArrowBack,
  IoIosArrowDown,
  IoIosArrowForward
} from 'react-icons/io';

import invert from 'invert-color';

class Section extends Component {
  static contextType = TaskContext;

  state = { isOpen: true };

  handleSwitchCollapsedStatus = e => {
    e.stopPropagation();
    this.setState(prevState => {
      return { isOpen: !prevState.isOpen };
    });
  };

  handleSectionActiveClicked = e => {
    if (this.context.activeSections.includes(this.props.headerName)) {
      // cancel active status
      let secs = this.context.activeSections.filter(
        s => s !== this.props.headerName
      );
      this.context.setActiveSections(secs);
    } else {
      let secs = [...this.context.activeSections];
      secs.push(this.props.headerName);
      this.context.setActiveSections(secs);
    }
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
    const { activeSections } = this.context;

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
      <div className={styles.SectionWrapper}>
        <div
          className={[
            styles.Section,
            activeSections.length > 0 && activeSections.includes(headerName)
              ? styles.SectionActive
              : null,
            activeSections.length > 0 && !activeSections.includes(headerName)
              ? styles.SectionInactive
              : null,
            isOpen ? styles.SectionOpen : styles.SectionClosed
          ].join(' ')}
          style={{
            borderTopColor: isOpen ? gradeColor : null

            // [isOpen ? 'borderTopColor' : 'borderRightColor']: gradeColor
          }}
        >
          {headerName && (
            <div
              className={styles.SectionHeader}
              style={{
                backgroundColor:
                  activeSections.length > 0 &&
                  activeSections.includes(headerName)
                    ? gradeColor
                    : null,
                color:
                  activeSections.length > 0 &&
                  activeSections.includes(headerName)
                    ? invert(gradeColor, {
                        black: '#3a3a3a',
                        white: '#fafafa',
                        threshold: 0.33
                      })
                    : null
              }}
              onClick={this.handleSectionActiveClicked}
            >
              <div className={styles.CollapseButtonContainer}>
                <div
                  className={styles.CollapseButton}
                  onClick={this.handleSwitchCollapsedStatus}
                >
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
                  borderRadius: 2,
                  border:
                    activeSections.length > 0 &&
                    activeSections.includes(headerName)
                      ? '0.5px solid ' +
                        invert(gradeColor, {
                          black: '#3a3a3a',
                          white: '#fafafa',
                          threshold: 0.33
                        })
                      : null,
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

        {/* <div className={styles.SectionActiveStatusContainer}> </div> */}
      </div>
    );
  }
}

export default Section;
