import React from 'react';
import { IoMdInformationCircle } from 'react-icons/io';
import ReactTooltip from 'react-tooltip';
import styles from './InfoTooltip.css';

const InfoTooltip = ({ id, children }) => {
  return (
    <React.Fragment>
      <IoMdInformationCircle
        data-tip
        data-for={id}
        className={styles.InfoIcon}
      />
      <ReactTooltip
        id={id}
        type="dark"
        effect="solid"
        place={'right'}
        className={styles.TooltipContainer}
      >
        {children}
      </ReactTooltip>
    </React.Fragment>
  );
};

export default InfoTooltip;
