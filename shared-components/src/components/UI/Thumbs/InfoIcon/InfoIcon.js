/* global chrome */
import React from 'react';

import InfoIcon from '../../../../assets/images/info-100.jpg';

const infoIcon = props => {
  let src = InfoIcon;
  if (window.chrome !== undefined && chrome.extension !== undefined) {
    src = chrome.extension.getURL(InfoIcon);
  }

  return (
    <img
      src={src}
      alt="info-icon"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        display: 'inline'
      }}
    />
  );
};

export default infoIcon;
