/* global chrome */
import React from 'react';
import styled from 'styled-components';

import InfoIcon from '../../../../assets/images/info-100.jpg';

const Image = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: inline;
  background-color: white;
`;

const infoIcon = props => {
  let src = InfoIcon;
  if (window.chrome !== undefined && chrome.extension !== undefined) {
    src = chrome.extension.getURL(InfoIcon);
  }

  return <Image src={src} alt="info-icon" />;
};

export default infoIcon;
