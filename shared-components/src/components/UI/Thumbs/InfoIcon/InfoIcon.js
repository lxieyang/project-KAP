/* global chrome */
import React from 'react';

import InfoIcon from '../../../../assets/images/info-100.png';

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
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        borderRadius: '50%',
        display: 'inline'
      }}
    />
  );
};

export const infoIconSrc =
  window.chrome !== undefined && chrome.extension !== undefined
    ? chrome.extension.getURL(InfoIcon)
    : InfoIcon;

export default infoIcon;
