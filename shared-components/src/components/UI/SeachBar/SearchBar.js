import React from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasSearch from '@fortawesome/fontawesome-free-solid/faSearch';
import styles from './SearchBar.css';

const searchBar = (props) => {
  return (
    <div className={styles.SearchBar}>
      <input type="text" placeholder="Search.." name="search" />
      <button>
        <FontAwesomeIcon
          icon={fasSearch}
          className={styles.ConfigureIcon}
        />
      </button>
    </div>
  ); 
}

export default searchBar;