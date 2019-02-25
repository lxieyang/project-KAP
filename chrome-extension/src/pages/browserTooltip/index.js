import React from 'react';
import ReactDOM from 'react-dom';

import BrowserTooltip from './BrowserTooltip';
import './index.css';

const app = <BrowserTooltip />;

ReactDOM.render(app, window.document.querySelector('#app-container'));
