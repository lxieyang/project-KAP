import React, { Component } from 'react';
import Mainpage from '../../shared-components/src/containers/Mainpage/ShowOffMainpage';
import ReactGA from 'react-ga';
import styles from './App.css';

ReactGA.initialize('UA-128939148-1');
ReactGA.pageview(window.location.pathname + window.location.search);

class App extends Component {
  render () {
    return (
      <div>
        <Mainpage />
      </div>
    );
  }
}

export default App;