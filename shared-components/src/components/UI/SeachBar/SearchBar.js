import React from 'react';

import FontAwesome from 'react-fontawesome';
import styles from './SearchBar.css';

const searchBar = (props) => {
  return (
    <div className={styles.SearchBar}>
      <input type="text" placeholder="Search.." name="search" />
      <button>
        <FontAwesome
          name="search"
          className={styles.ConfigureIcon}
        />
      </button>
    </div>
  ); 
}

export default searchBar;