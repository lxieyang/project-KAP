import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// import Mainpage from '../../shared-components/src/containers/Mainpage/Mainpage';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

if (window.top !== window.self) { 
  document.body.style.zoom = '0.7';
}

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

ReactDOM.render(app, document.getElementById('root'));
registerServiceWorker();
