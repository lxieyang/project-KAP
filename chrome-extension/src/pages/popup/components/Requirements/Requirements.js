import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import styles from './Requirements.css';
import { sortBy } from 'lodash';
import update from 'immutability-helper';
import RequirementPiece from './RequirementPiece/RequirementPiece';


const inputConfig = {
  placeholder: 'Add a requirement'
}

class Requirements extends Component {

  state = {
    requirements: null
  }

  componentDidMount () {
    this.transformRequirements(this.props.requirements);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    this.transformRequirements(nextProps.requirements);
  }

  transformRequirements = (requirements) => {
    requirements = sortBy(requirements, ['order']);
    this.setState({requirements});
  }

  movePiece = (dragIndex, hoverIndex) => {
    const { requirements } = this.state;
    const dragPiece = requirements[dragIndex];

    let newRequirements = update(requirements, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragPiece]
      ]
    });

    this.setState({requirements: newRequirements});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newRequirements.length; idx++) {
      ordering[newRequirements[idx].id] = idx;
    }
    this.props.updateRequirementsOrdering(ordering);
  }

  render() {
    const { requirements } = this.state;
  
    return (
      <div style={{display: 'flex'}}>
        <div className={styles.Requirements}>
          <div className={styles.Label}>
            <FontAwesomeIcon icon={fasFlagCheckered} /> &nbsp;
            Criteria / Features:
          </div>
          <div className={styles.RequirementList}>
            <ul>
              {
                requirements !== null ? requirements.map((rq, idx) => (
                  <RequirementPiece 
                    key={rq.id}
                    index={idx}
                    rq={rq}
                    movePiece={this.movePiece}
                    deleteRequirementWithId={this.props.deleteRequirementWithId}
                    switchStarStatusOfRequirement={this.props.switchStarStatusOfRequirement}
                    updateRequirementName={this.props.updateRequirementName}/>
                )) : null
              }
              <Input 
                elementType={'input'} 
                elementConfig={inputConfig}
                submitted={this.props.addRequirement}
                value={this.props.newRequirementValue}
                changed={this.props.changed} />
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default Requirements;