import React, { Component } from 'react';
import styles from './SourcesComponent.css';

import ReactHoverObserver from 'react-hover-observer';

import BaseComponent from '../BaseComponent/BaseComponent';

import invert from 'invert-color';
import randomColor from 'randomcolor';
import PieChart from './PieChart';

import { DOMAIN_THEME_COLOR } from '../../../../../../../../../shared/theme';

import Divider from '@material-ui/core/Divider';

import TaskContext from '../../../../../../../../../shared/task-context';

class SourcesComponent extends Component {
  static contextType = TaskContext;
  state = {
    domains: []
  };

  onHoverChanged = e => {
    console.log(e);
  };

  render() {
    // const { domains } = this.state;
    let { domains, pieces } = this.props;
    domains = domains.map(d => {
      let color = DOMAIN_THEME_COLOR[d.domain];
      if (!color) {
        color = randomColor();
      }
      const foregroundColor = invert(color, true);
      return {
        ...d,
        color,
        foregroundColor
      };
    });

    // console.log(domains);
    const maxNumOfPieces = Math.max(...domains.map(d => d.numberOfPieces));

    return (
      <React.Fragment>
        <Divider light />
        <BaseComponent
          shouldOpenOnMount={true}
          headerName={'List of source domains'}
        >
          <div className={styles.SourcesComponentContainer}>
            {domains.map((d, idx) => {
              const percent = (
                (d.numberOfPieces / maxNumOfPieces) *
                100
              ).toFixed(0);
              const onHoverChanged = ({ isHovering }) => {
                if (isHovering) {
                  this.context.addSelectedDomain(d.domain);
                } else {
                  this.context.removeSelectedDomain(d.domain);
                }
              };
              return (
                <ReactHoverObserver
                  key={idx}
                  {...{
                    onHoverChanged: onHoverChanged
                  }}
                >
                  {({ isHovering }) => (
                    <div
                      className={styles.DomainEntryContainer}
                      style={{
                        borderBottomColor: d.color,
                        borderBottomWidth: this.context.selectedDomains.includes(
                          d.domain
                        )
                          ? 1
                          : null
                      }}
                      key={idx}
                    >
                      <div
                        className={styles.DomainEntryPercentage}
                        style={{
                          width: `${percent}%`,
                          backgroundColor: d.color
                        }}
                      />

                      <img src={d.favicon} alt="" />
                      <span
                        className={styles.DomainName}
                        // style={{ color: d.foregroundColor }}
                      >
                        {d.domain}
                      </span>
                      <div style={{ flex: 1 }} />
                      <span className={styles.DomainStats}>
                        {d.numberOfPieces} snippets
                      </span>
                    </div>
                  )}
                </ReactHoverObserver>
              );
            })}
            <div className={styles.PiechartContainer}>
              <PieChart
                domains={domains}
                selectedDomains={this.context.selectedDomains}
                addSelectedDomain={this.context.addSelectedDomain}
                removeSelectedDomain={this.context.removeSelectedDomain}
                clearSelectedDomains={this.context.clearSelectedDomains}
                setSelectedDomains={this.context.setSelectedDomains}
              />
            </div>
          </div>
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default SourcesComponent;
