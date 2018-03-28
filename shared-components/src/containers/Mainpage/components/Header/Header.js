import React, { Component } from 'react';

import Aux from '../../../../hoc/Aux/Aux';
import NavigationItems from './NavigationItems/NavigationItems';
import Logo from '../../../../components/UI/Logo/Logo';
import SearchBar from '../../../../components/UI/SeachBar/SearchBar';
import styles from './Header.css';
import Yoda from '../../../../assets/images/yoda.png';
import ReactTooltip from 'react-tooltip';
import { capitalizeFirstLetter } from '../../../../shared/utilities';

class Header extends Component {
  state = {
    userId: this.props.userId
  }

  inputChangedHandler = (event) => {
    this.setState({userId: event.target.value});
  }

  buttonClickedHandler = (event) => {
    const { userId } = this.state;
    if (userId !== "") {
      this.props.resetParameters(userId);
      ReactTooltip.hide();
    }
  }

  render () {
    return (
      <Aux>
        <header className={styles.Header}>
          <div>
            <div 
              className={styles.LogoBox}
              data-tip
              data-event='click focus'
              data-for="hohohahei">
              <Logo 
                hover={true} size='38px'/>
            </div>
            <ReactTooltip 
              id="hohohahei"
              place="bottom" 
              type="light" 
              effect="solid"
              className={styles.Tooltip}>
              <input 
                type="text" 
                placeholder={'User ID'}
                onChange={(event) => this.inputChangedHandler(event)}/><br />
              <button
                onClick={(event) => this.buttonClickedHandler(event)}>
                Change
              </button>
            </ReactTooltip>
          </div>
          
          
          <nav>
            <NavigationItems currentTask={this.props.taskName}/>
          </nav>
  
  
          <div className={styles.ToTheRight}>
            <div className={styles.SearchBox}>
              <SearchBar />
            </div>
            <div className={styles.Profile} onClick={(event) => {alert('hoho')}}>
              <img src={Yoda} alt=""className={styles.ProfileImg}/> 
              <span>{'Master ' + capitalizeFirstLetter(this.props.userId)}</span>
            </div>
          </div>
        </header>
      </Aux>
    );
  }
}

export default Header;