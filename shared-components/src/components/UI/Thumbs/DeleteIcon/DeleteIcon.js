/* global chrome */
import React from 'react';

import DeleteIcon from '../../../../assets/images/delete.png';

const deleteIcon = props => {
  let src = DeleteIcon;
  if (window.chrome !== undefined && chrome.extension !== undefined) {
    src = chrome.extension.getURL(DeleteIcon);
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

export const deleteIconSrc =
  window.chrome !== undefined && chrome.extension !== undefined
    ? chrome.extension.getURL(DeleteIcon)
    : DeleteIcon;

export default deleteIcon;
