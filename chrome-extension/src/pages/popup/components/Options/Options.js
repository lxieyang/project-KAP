import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListAlt from '@fortawesome/fontawesome-free-solid/faListAlt';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import { debounce } from 'lodash';
import styles from './Options.css';

const inputConfig = {
  placeholder: 'Add an option'
}

class Options extends Component {
  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      this.props.updateOptionName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
    }, 500);
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.inputCallback(event, id);
  }

  render () {
    const { options, activeId } = this.props;
    return (
      <div style={{display: 'flex'}}>
        <div className={styles.Options}>
          <div className={styles.Label}>
            <FontAwesomeIcon icon={fasListAlt} /> &nbsp;
            Options:
          </div>
          <div className={styles.OptionList}>
            <ul>
              {options.map((op, idx) => (
                <li key={op.id}>
                  <span 
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(event) => this.inputChangedHandler(event, op.id)}
                    className={styles.Option}>
                    {op.name}
                  </span>
                  {activeId === op.id 
                  ? <span className={styles.ActiveBadge}>active</span>
                  : null}
                  <span  
                    onClick={(event) => this.props.deleteOptionWithId(op.id)}>
                    <FontAwesomeIcon 
                      icon={fasTrash}
                      className={styles.TrashIcon}/>
                  </span>
                </li>
              ))}
              <Input 
                elementType={'input'} 
                elementConfig={inputConfig}
                submitted={this.props.addOption}
                value={this.props.newOptionValue}
                changed={this.props.changed} />
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
}

export default Options;