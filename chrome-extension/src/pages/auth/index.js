import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router';

import Auth from './Auth';
import './index.css';

const app = (
  <MemoryRouter>
    <Auth />
  </MemoryRouter>
);

ReactDOM.render(app, window.document.querySelector('#app-container'));
