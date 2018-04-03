import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListAlt from '@fortawesome/fontawesome-free-solid/faListAlt';
import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import OptionPiece from './OptionPiece/OptionPiece';
import { sortBy } from 'lodash';
import update from 'immutability-helper';
import styles from './Options.css';


const inputConfig = {
  placeholder: 'Add an option'
}

class Options extends Component {

  state = {
    options: null
  }

  componentDidMount () {
    this.transformOptions(this.props.options);
  }

  componentWillReceiveProps (nextProps) {
    this.transformOptions(nextProps.options);
  }

  transformOptions = (options) => {
    options = sortBy(options, ['order']);
    this.setState({options});
  }

  movePiece = (dragIndex, hoverIndex) => {
    const { options } = this.state;
    const dragPiece = options[dragIndex];

    let newOptions = update(options, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragPiece]
      ]
    });

    this.setState({options: newOptions});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newOptions.length; idx++) {
      ordering[newOptions[idx].id] = idx;
    }
    this.props.updateOptionsOrdering(ordering);
  }

  render () {
    const { activeId } = this.props;
    const { options } = this.state;

    return (
      <div style={{display: 'flex'}}>
        <div className={styles.Options}>
          <div className={styles.Label}>
            <FontAwesomeIcon icon={fasListAlt} /> &nbsp;
            Options:
          </div>
          <div className={styles.OptionList}>
            <ul>
              {
                options !== null ? options.map((op, idx) => {
                  return (
                    <OptionPiece 
                      key={op.id}
                      index={idx}
                      op={op}
                      movePiece={this.movePiece}
                      activeId={activeId}
                      deleteOptionWithId={this.props.deleteOptionWithId}
                      switchStarStatusOfOption={this.props.switchStarStatusOfOption}
                      updateOptionName={this.props.updateOptionName}/>
                  )
                }) : null
              }
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