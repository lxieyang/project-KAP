import React, { Component } from 'react';
import { sortBy } from 'lodash';
import styles from './SourcesComponent.css';
import Switch from 'react-switch';

import ReactHoverObserver from 'react-hover-observer';

import BaseComponent from '../BaseComponent/BaseComponent';

import invert from 'invert-color';
import randomColor from 'randomcolor';
import PieChart from './PieChart';

import { DOMAIN_THEME_COLOR } from '../../../../../../../../../shared/theme';
import { PIECE_TYPES } from '../../../../../../../../../shared/types';
import SnippetIcon from '../../../../../../../../../components/UI/SnippetIcon/SnippetIcon';

import Divider from '@material-ui/core/Divider';

import TaskContext from '../../../../../../../../../shared/task-context';

class SourcesComponent extends Component {
  static contextType = TaskContext;
  state = {
    pieChartView: false
  };

  handleViewChange = toStatus => {
    this.setState({ pieChartView: toStatus });
  };

  render() {
    const { pieChartView } = this.state;
    let { domains, pieces, shouldOpenOnMount } = this.props;
    domains = domains.map(d => {
      let color = DOMAIN_THEME_COLOR[d.domain];
      if (!color) {
        color = randomColor();
      }
      const foregroundColor = invert(color, true);

      let piecesInDomain = [];
      d.pages.forEach(p => {
        piecesInDomain = piecesInDomain.concat(p.piecesInPage);
      });
      piecesInDomain.forEach(p => {
        if (p.pieceType === PIECE_TYPES.option) {
          p.sortOrder = 1;
        } else if (p.pieceType === PIECE_TYPES.criterion) {
          p.sortOrder = 2;
        } else if (p.pieceType === PIECE_TYPES.snippet) {
          p.sortOrder = 3;
        }
      });
      piecesInDomain = sortBy(piecesInDomain, ['sortOrder']);
      return {
        ...d,
        piecesInDomain,
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
          shouldOpenOnMount={shouldOpenOnMount}
          headerName={'List of source domains'}
        >
          <div className={styles.SwitchContainer}>
            Default View
            <Switch
              onChange={this.handleViewChange}
              checked={pieChartView}
              uncheckedIcon={false}
              checkedIcon={false}
              className={styles.Switch}
              height={10}
              width={20}
            />
            Pie chart View
          </div>

          <div className={styles.SourcesComponentContainer}>
            {!pieChartView &&
              domains.map((d, idx) => {
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
                    <div
                      className={styles.DomainEntryContainer}
                      style={{
                        borderBottomColor: this.context.selectedDomains.includes(
                          d.domain
                        )
                          ? d.color
                          : null
                      }}
                      key={idx}
                    >
                      {/* <div
                          className={styles.DomainEntryPercentage}
                          style={{
                            width: `${percent}%`,
                            backgroundColor: d.color
                          }}
                        /> */}

                      <img src={d.favicon} alt="" />
                      <span
                        className={styles.DomainName}
                        // style={{ color: d.foregroundColor }}
                      >
                        {d.domain}
                      </span>
                      <div className={styles.PiecesInDomainContainer}>
                        {d.piecesInDomain.map((p, pidx) => {
                          {
                            /* console.log(p); */
                          }
                          return (
                            <React.Fragment key={pidx}>
                              <ReactHoverObserver
                                className={styles.InlineHoverObserver}
                                {...{
                                  onHoverChanged: ({ isHovering }) => {
                                    // console.log(isHovering);
                                    if (isHovering) {
                                      this.context.setSelectedSnippets([p.id]);
                                    } else {
                                      this.context.clearSelectedSnippets();
                                    }
                                  }
                                }}
                              >
                                <div style={{ margin: 2 }}>
                                  <SnippetIcon type={p.pieceType} size={16} />
                                </div>
                              </ReactHoverObserver>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <span className={styles.DomainStats}>
                        {d.numberOfPieces} snippets
                      </span>
                    </div>
                  </ReactHoverObserver>
                );
              })}
            {pieChartView && (
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
            )}
          </div>
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default SourcesComponent;
