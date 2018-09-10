import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasDelete from '@fortawesome/fontawesome-free-solid/faTrashAlt';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasMore from '@fortawesome/fontawesome-free-solid/faEllipsisV';
import Popover from 'react-tiny-popover';
import ThreeDotsSpinner from '../../../UI/ThreeDotsSpinner/ThreeDotsSpinner';
import { debounce } from 'lodash';
import ordinal from 'ordinal';
import styles from './OptionPiece.css';


class OptionPiece extends Component {
  
  state = {
    isPopoverOpen: false,
    shouldShowPrompt: false
  }

  switchPopoverOpenStatus = () => {
    this.setState(prevState => {
      return {isPopoverOpen: !prevState.isPopoverOpen}
    });
  }

  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      this.props.updateOptionName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
      this.setState({shouldShowPrompt: false});
    }, 1500);
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.setState({shouldShowPrompt: true});
    this.inputCallback(event, id);
  }

  switchStarStatus = (id) => {
    this.switchPopoverOpenStatus();
    this.props.switchStarStatusOfOption(id);
  }


  render () {
    const { op, hasAttitudes } = this.props;

    return (
      <div>
        <div style={{display: 'flex', alignItems: 'center'}}>
          
          <div 
            className={[styles.Option, hasAttitudes ? styles.hasAttitudes : null].join(' ')}
            style={{boxShadow: this.state.isPopoverOpen || this.state.shouldShowPrompt ? '4px 4px 6px rgba(0,0,0,0.2)' : null}}>
            <div
              className={[styles.OptionStar, (
                op.starred === true ? styles.ActiveStar : null
              )].join(' ')}>
              <FontAwesomeIcon icon={fasStar} />
            </div>
            <div className={styles.OptionContentRow}>
              <span
                title={'Click to edit'}
                className={styles.OptionText}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(event) => this.inputChangedHandler(event, op.id)}>
                {op.name}
              </span>
              <Popover
                isOpen={this.state.isPopoverOpen}
                position={'bottom'} // preferred position
                onClickOutside={() => this.switchPopoverOpenStatus()}
                containerClassName={styles.PopoverContainer}
                content={(
                  <div className={styles.PopoverContentContainer} name="kap-popover-container">
                    <ul>
                      <li onClick={(event) => this.switchStarStatus(op.id)}>
                        <div className={styles.IconBoxInPopover}>
                          <FontAwesomeIcon icon={fasStar} className={styles.IconInPopover}/>
                        </div>
                        <div>{op.starred === true ? 'Remove' : 'Add'} Star</div>
                      </li>

                      <li 
                        onClick={(event) => this.props.deleteOptionWithId(op.id, op.name)}
                        className={styles.DeleteLi}>
                        <div className={styles.IconBoxInPopover}>
                          <FontAwesomeIcon icon={fasDelete} className={styles.IconInPopover}/>
                        </div>
                        <div>Delete</div>
                      </li>
                    </ul>
                  </div>
                )}
              >
                <span 
                  className={styles.MoreIconContainer}
                  style={{opacity: this.state.isPopoverOpen ? '0.7' : null}}
                  onClick={() => this.switchPopoverOpenStatus()}>
                  <FontAwesomeIcon icon={fasMore}/>
                </span>
                
              </Popover>

            </div>
            
          </div>
        </div>
        <div className={styles.PromptAutoSaved}>
          {this.state.shouldShowPrompt === true 
            ? <span>
                Edits will automatically be saved <ThreeDotsSpinner />
              </span>
            : null}
        </div>
      </div>
    );
  }
}

export default OptionPiece;
