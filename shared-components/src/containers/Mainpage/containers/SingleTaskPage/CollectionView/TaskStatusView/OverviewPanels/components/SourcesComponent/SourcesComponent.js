import React, { Component } from 'react';
import styles from './SourcesComponent.css';

import BaseComponent from '../BaseComponent/BaseComponent';

import invert from 'invert-color';
import randomColor from 'randomcolor';
import PieChart from './PieChart';

class SourcesComponent extends Component {
  state = {
    domains: []
  };

  // componentDidUpdate(prevProps) {
  //   if (this.props.domains !== prevProps.domains) {
  //     this.setState({ domains: this.props.domains });
  //   }
  // }

  render() {
    // const { domains } = this.state;
    let { domains, pieces } = this.props;
    domains = domains.map(d => {
      const color = randomColor();
      const foregroundColor = invert(color, true);
      return {
        ...d,
        color,
        foregroundColor
      };
    });
    console.log(domains);
    const maxNumOfPieces = Math.max(...domains.map(d => d.numberOfPieces));

    return (
      <BaseComponent
        shouldOpenOnMount={true}
        headerName={'List of source domains'}
      >
        <div className={styles.SourcesComponentContainer}>
          {domains.map((d, idx) => {
            const percent = ((d.numberOfPieces / maxNumOfPieces) * 100).toFixed(
              0
            );
            console.log(percent);
            return (
              <div className={styles.DomainEntryContainer} key={idx}>
                <div
                  className={styles.DomainEntryPercentage}
                  style={{ width: `${percent}%`, backgroundColor: d.color }}
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
            );
          })}
          <div className={styles.PiechartContainer}>
            <PieChart domains={domains} />
          </div>
        </div>
      </BaseComponent>
    );
  }
}

export default SourcesComponent;
