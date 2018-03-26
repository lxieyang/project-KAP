import React from "react";
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router';

import Newtab from './Newtab';
import './index.css';


const app = (
  <MemoryRouter>
    <Newtab />
  </MemoryRouter>
);

ReactDOM.render(app, window.document.querySelector("#app-container"));
