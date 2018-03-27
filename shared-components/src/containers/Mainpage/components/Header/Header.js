import React from 'react';

import Aux from '../../../../hoc/Aux/Aux';
import NavigationItems from './NavigationItems/NavigationItems';
import Logo from '../../../../components/UI/Logo/Logo';
import SearchBar from '../../../../components/UI/SeachBar/SearchBar';
import styles from './Header.css';
import Yoda from '../../../../assets/images/yoda.png';

const header = (props) => {
  return (
    <Aux>
      <header className={styles.Header}>
        <div className={styles.LogoBox}>
          <Logo 
            hover={true} size='38px'/>
        </div>
        
        <nav>
          <NavigationItems currentTask={props.taskName}/>
        </nav>


        <div className={styles.ToTheRight}>
          <div className={styles.SearchBox}>
            <SearchBar />
          </div>
          <div className={styles.Profile}>
            <img src={Yoda} alt=""className={styles.ProfileImg}/> 
            <span>{props.userName}</span>
          </div>
        </div>
      </header>
    </Aux>
  );
}

export default header;