import React from "react";
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router';

import MainPage from '../../../../shared-components/src/containers/Mainpage/Mainpage';
import './index.css';

const app = (
  <MemoryRouter>
    <MainPage />
  </MemoryRouter>
);

ReactDOM.render(app, window.document.querySelector("#app-container"));
