import React, { Component } from 'react';
import styles from './Snackbar.css';

export default class Snackbar extends Component {
  componentDidUpdate() {
    let x = document.getElementById(this.props.id);
    let xLeft = Math.floor((window.innerWidth - x.clientWidth)/2);
    x.style.left = xLeft + 'px';
  }

  render () {
    const { show, id, children } = this.props;
    return (
      <div id={id}
        className={[styles.Snackbar, show ? styles.Show : null].join(' ')}>
        {children}
      </div>
    );
  }
}
