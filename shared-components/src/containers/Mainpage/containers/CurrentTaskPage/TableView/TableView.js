import React, { Component } from 'react';

import Aux from '../../../../../hoc/Aux/Aux';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farSquare from '@fortawesome/fontawesome-free-regular/faSquare';
import farWindowMaximize from '@fortawesome/fontawesome-free-regular/faWindowMaximize';
import fasICursor from '@fortawesome/fontawesome-free-solid/faICursor';
import fasCode from '@fortawesome/fontawesome-free-solid/faCode';
import fasMinusCircle from '@fortawesome/fontawesome-free-solid/faMinusCircle';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasArrowsAlt from '@fortawesome/fontawesome-free-solid/faArrowsAlt';

import ToggleSwitch from '../../../../../components/UI/ToggleSwitch/ToggleSwitch';
import InteractionBox from '../../../../../components/InteractionBox/InteractionBox';
import ThumbV1 from '../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';
import QuestionMark from '../../../../../components/UI/Thumbs/QuestionMark/QuestionMark';
// import * as actionTypes from '../../../../../shared/actionTypes';
import styles from './TableView.css';
import { SNIPPET_TYPE } from '../../../../../shared/constants';
import { getFirstNWords } from '../../../../../shared/utilities';
import { sortBy, reverse } from 'lodash';
import ReactTooltip from 'react-tooltip';
import * as FirebaseStore from '../../../../../firebase/store';


class TableView extends Component {
  state = {
    pieces: this.props.task.pieces,
    specificPieceId: this.props.specificPieceId !== undefined ? this.props.specificPieceId : null,
    options: this.props.task.options,
    pieceGroups: this.props.task.pieceGroups,
    optionsList: [],
    piecesList: [],
    isDetailed: true,
    showModal: false,
    modalPieceId: ''
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.specificPieceId !== undefined) {
      this.setState({specificPieceId: nextProps.specificPieceId})
    } else {
      this.setState({specificPieceId: null});
    }
    const { task } = nextProps;
    this.transformData(task);
  }

  componentDidMount () {
    const { task } = this.props;
    this.transformData(task);

    document.body.addEventListener('keydown',  (event) => {
      if (event.key === 'Escape') {
        this.dismissModal();
      }
    });
  }

  transformData = (task) => {
    // extract options
    let optionsList = [];
    for (let opKey in task.options) {
      optionsList.push({
        id: opKey,
        name: task.options[opKey].name,
        active: true,
        pieces: []
      });
    }
    // console.log(optionsList);

    // extract pieces

    let piecesList = [];
    let toInactivePiecesList = [];
    for (let pgKey in task.pieceGroups) {
      if (task.pieceGroups[pgKey].pieceIds) {
        toInactivePiecesList = toInactivePiecesList.concat(task.pieceGroups[pgKey].pieceIds);
      }
      piecesList.push({
        ...task.pieceGroups[pgKey],
        id: pgKey,
        active: true
      });
    }
    
    for (let pKey in task.pieces) {
      piecesList.push({
        ...task.pieces[pKey],
        id: pKey,
        active: toInactivePiecesList.indexOf(pKey) === -1
      });
    }
    

    this.setState({optionsList, piecesList});
  }

  getOrderedPiecesListFromState () {
    let { optionsList, piecesList } = this.state;
    
    for (let pIdx in piecesList) {
      let piece = piecesList[pIdx];
      let count = 0;
      if (piece.active) {  // && (piece.type === SNIPPET_TYPE.SELECTION || piece.type === SNIPPET_TYPE.LASSO)) {
        let attitudeOptionPairs = piece.attitudeOptionPairs;
        if (attitudeOptionPairs !== undefined) {
          for (let pairIdx in attitudeOptionPairs) {
            let opId = attitudeOptionPairs[pairIdx].optionId;
            let optionIsActive = optionsList.filter(op => op.id === opId)[0].active;
            if (optionIsActive) {
              count++;
            }
          }
        }
        if (piece.type === SNIPPET_TYPE.PIECE_GROUP) {
          count = 1000;
        }
      }
      piece.count = count;
    }

    piecesList = reverse(sortBy(piecesList, ['active', 'count']));
    return piecesList;
  }

  switchPieceStatus = (event, pieceId) => {
    console.log(pieceId);
    let idx = 0;
    let updatedPiece = {};
    for (; idx < this.state.piecesList.length; idx++) {
      if (this.state.piecesList[idx].id === pieceId) {
        updatedPiece = {...this.state.piecesList[idx]};
        break;
      }
    }
    updatedPiece.active = !updatedPiece.active;
    let updatedPiecesList = [...this.state.piecesList];
    updatedPiecesList[idx] = updatedPiece;
    this.setState({piecesList: updatedPiecesList});

  }

  switchOptionStatus = (event, optionId) => {
    let idx = 0;
    let updatedOption = {};
    for(; idx < this.state.optionsList.length; idx++) {
      if (this.state.optionsList[idx].id === optionId) {
        updatedOption = {...this.state.optionsList[idx]};
        break;
      }
    }
    updatedOption.active = !updatedOption.active;
    let updatedOptionsList = [...this.state.optionsList];
    updatedOptionsList[idx] = updatedOption;
    this.setState({optionsList: updatedOptionsList});    
  }

  dismissModal = () => {
    this.setState({showModal: false});
  }

  makeInteractionbox = (event, pieceId) => {
    this.setState({modalPieceId: pieceId, showModal: true});
  }

  getTypeBadge = (type) => {
    switch(type) {
      case SNIPPET_TYPE.SELECTION:
        return (
          <FontAwesomeIcon icon={fasICursor} className={styles.BadgeIcon}/>
        );
      case SNIPPET_TYPE.LASSO:
        return (
          <FontAwesomeIcon icon={farSquare} className={styles.BadgeIcon}/>
        );
      case SNIPPET_TYPE.POST_SNAPSHOT:
        return (
          <FontAwesomeIcon icon={farWindowMaximize} className={styles.BadgeIcon}/>
        );
      default:
        return null;
    }
  }

  getCodeBadge = (htmls) => {
    for (let html of htmls) {
      if (html.indexOf('pre') !== -1 && html.indexOf('prettyprint') !== -1) {
        return (
          <FontAwesomeIcon icon={fasCode} className={styles.BadgeIcon}/>          
        );
      }
    }
    return null;
  }

  getHTML (htmls) {
    let htmlString = ``;
    for (let html of htmls) {
      htmlString += html;
    }
    return {__html: htmlString};
  }

  detailedViewChangeHandler = (event) => {
    this.setState(prevState => {
      return {isDetailed: !prevState.isDetailed};
    });
  }

  changeAttitude = (optionId, pieceId, originalAttitude, changedAttitude, type) => {
    // console.log('change attitude from: ' + originalAttitude + ' to: ' + changedAttitude);
    if (type !== SNIPPET_TYPE.PIECE_GROUP) {
      const { pieces } = this.props.task;
      let piece = pieces[pieceId];
      // console.log(piece);
      let pieceClone = JSON.parse(JSON.stringify(piece));
      if (originalAttitude === changedAttitude) {
        // console.log('should be undefined');
        if (pieceClone.attitudeOptionPairs) {
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.filter(pair => pair.optionId !== optionId);
        }
      } else {
        // console.log('should be ' + changedAttitude);
        if (pieceClone.attitudeOptionPairs) {
          let shouldPushNew = true;
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.map((pair) => {
            if (pair.optionId === optionId) {
              shouldPushNew = false;
              return changedAttitude === null 
                     ? {optionId: optionId}
                     : {attitude: changedAttitude, optionId: optionId}
            }
            return pair;
          });
          if(shouldPushNew) {
            // console.log('should push new pair');
            pieceClone.attitudeOptionPairs.push(
              changedAttitude === null 
              ? {optionId: optionId}
              : {attitude: changedAttitude, optionId: optionId}
            );
          }
        } else {
          pieceClone.attitudeOptionPairs = [
            changedAttitude === null 
            ? {optionId: optionId}
            : {attitude: changedAttitude, optionId: optionId}];
        }
      }
      // console.log(pieceClone);
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.UPDATE_A_PIECE_WITH_ID,
      //   payload: {
      //     id: pieceId,
      //     piece: pieceClone
      //   }
      // });
      // save piece
      FirebaseStore.updateAPieceWithId(pieceId, pieceClone);

    } else {
      // PIECE_GROUP
      console.log('change attitude of piece group to: ' + changedAttitude);
      const { pieceGroups } = this.props.task;
      let piece = pieceGroups[pieceId];
      // console.log(piece);
      let pieceClone = JSON.parse(JSON.stringify(piece));
      if (originalAttitude === changedAttitude) {
        // console.log('should be undefined');
        if (pieceClone.attitudeOptionPairs) {
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.filter(pair => pair.optionId !== optionId);
        }
      } else {
        // console.log('should be ' + changedAttitude);
        if (pieceClone.attitudeOptionPairs) {
          let shouldPushNew = true;
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.map((pair) => {
            if (pair.optionId === optionId) {
              shouldPushNew = false;
              return changedAttitude === null 
                     ? {optionId: optionId}
                     : {attitude: changedAttitude, optionId: optionId}
            }
            return pair;
          });
          if(shouldPushNew) {
            // console.log('should push new pair');
            pieceClone.attitudeOptionPairs.push(
              changedAttitude === null 
              ? {optionId: optionId}
              : {attitude: changedAttitude, optionId: optionId}
            );
          }
        } else {
          pieceClone.attitudeOptionPairs = [
            changedAttitude === null 
            ? {optionId: optionId}
            : {attitude: changedAttitude, optionId: optionId}];
        }
      }
      // console.log(pieceId);
      // console.log(pieceClone);
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.UPDATE_A_PIECE_GROUP_ATTITUDE_OPTION_PAIRS_WITH_ID,
      //   payload: {
      //     groupId: pieceId,
      //     attitudeOptionPairs: pieceClone.attitudeOptionPairs
      //   }
      // });

      FirebaseStore.updateAPieceGroupAttitudeOptionPairsWithId(pieceId, pieceClone.attitudeOptionPairs);
    }
  }

  getHTML = (htmls) => {
    let htmlString = ``;
    for (let html of htmls) {
      htmlString += html;
    }
    return {__html: htmlString};
  }

  render () {

    const props = this.props;
    const { pieces, options } = this.state;

    let experimentalOrderedPiecesList = this.getOrderedPiecesListFromState();

    let pieceViewOption = (
      <Aux>
        <div className={styles.Label}>
          <span>View Detailed Pieces</span>
        </div>
        <div className={styles.Slider}>
          <ToggleSwitch 
            checked={this.state.isDetailed} 
            statusChanged={this.detailedViewChangeHandler}/>
        </div>
      </Aux>
    );

    let experimentalTableHeader = (
      <tr>
        <th></th>
        {experimentalOrderedPiecesList.map((p, idx) => (
          <th 
            key={idx}>
            <div 
              className={[styles.ShowHidePieceContainer, styles.ShowHidePiece].join(' ')}
              onClick={(event) => this.switchPieceStatus(event, p.id)}>
            {
              p.active
              ? <FontAwesomeIcon icon={fasMinusCircle} className={styles.ShowHidePieceIcon}/>
              : <FontAwesomeIcon icon={fasCheckCircle} className={styles.ShowHidePieceIcon}/>
            }
            </div>
            <div 
              className={[styles.PieceNameContainer,
                p.active ? null : styles.InactivePiece].join(' ')}>
              {
                p.type !== SNIPPET_TYPE.PIECE_GROUP
                ? <div className={styles.PieceNameBadgeContainer}>
                    { /* this.getTypeBadge(p.type) */ }
                    {this.getCodeBadge(p.htmls)}
                  </div>
                : null
              }
              
              <div className={styles.PieceNameContent}>
                {
                  this.state.isDetailed
                  ? p.type === SNIPPET_TYPE.PIECE_GROUP
                    ? <div className={styles.PieceGroupListContainer}>
                        <div>
                          {getFirstNWords(10, p.name)}
                        </div>
                        <ul>
                          {p.pieceIds.map((pid, idx) =>  {
                            let piece = pieces[pid];
                            return (
                              <li key={idx}>
                                <div className={styles.Bullet}>• </div>
                                <div className={styles.PieceContainerInPieceGroup}>
                                  <div 
                                    className={styles.PieceTitle}
                                    onClick={(event) => {this.makeInteractionbox(event, pid)}}>
                                    { 
                                      piece.title === undefined 
                                      ? getFirstNWords(5, piece.texts)
                                      : getFirstNWords(5, piece.title)
                                    }
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    : p.type !== SNIPPET_TYPE.SELECTION
                      ? <div
                          dangerouslySetInnerHTML={this.getHTML(p.htmls)}
                          onClick={(event) => {this.makeInteractionbox(event, p.id)}}>
                        </div>
                      : <span 
                          className={styles.SelectionText}
                          onClick={(event) => {this.makeInteractionbox(event, p.id)}}>
                          {getFirstNWords(10, p.texts)}
                        </span>
                    
                  : p.type === SNIPPET_TYPE.PIECE_GROUP
                    ? getFirstNWords(10, p.name)
                    : <div 
                        onClick={(event) => {this.makeInteractionbox(event, p.id)}}>
                        {
                          p.title === undefined
                          ? getFirstNWords(10, p.texts)
                          : getFirstNWords(10, p.title)
                        }
                      </div> 
                    
                }
              </div>
            </div>
          </th>
        ))}
      </tr>
    );

    let experimentalTableBody = reverse(sortBy(this.state.optionsList, ['active'])).map((op, idx) => {
      return (
        <tr key={op.id} >
          <td>
            <div 
            className={[styles.ShowHidePieceContainer, styles.ShowHideOption].join(' ')}
            onClick={(event) => this.switchOptionStatus(event, op.id)}>
            {
              op.active 
              ? <FontAwesomeIcon icon={fasMinusCircle} className={styles.ShowHidePieceIcon}/>
              : <FontAwesomeIcon icon={fasCheckCircle} className={styles.ShowHidePieceIcon}/>
            }
            </div>
            <div className={[styles.OptionNameContainer, !op.active ? styles.InactiveOption : null].join(' ')}>{op.name}</div>
          </td>
          { 
            experimentalOrderedPiecesList.map((p, index) => {
              let attitude = undefined;
              if (p.attitudeOptionPairs !== undefined) {
                let pair = p.attitudeOptionPairs.filter(pair => pair.optionId === op.id)[0];
                attitude = pair !== undefined 
                           ? pair.attitude !== undefined
                             ? pair.attitude
                             : null
                           : undefined;
              }
              return (
                <td key={p.id}>
                  <div className={[
                      styles.TableCellContainer,
                      !p.active ? styles.InactivePiece : null, 
                      !op.active ? styles.InactiveOption : null
                    ].join(' ')}
                    style={{pointerEvents: !p.active || !op.active ? 'none' : 'auto'}}>
                    <div 
                      className={styles.Attitude}
                      data-tip
                      data-for={p.id + op.id}
                      data-event="click focus">
                      {
                        attitude === true
                        ? <ThumbV1 type='up' />
                        : attitude === false
                          ? <ThumbV1 type='down' />
                          : attitude === null
                            ? <QuestionMark />
                            : <div className={styles.NotMarkedRelated}></div>
                      }
                    </div>
                    <ReactTooltip 
                      id={p.id + op.id}
                      globalEventOff="click"
                      place='right' 
                      type='light' 
                      effect='solid'
                      className={styles.AttitudeSwitchContainer}>
                      <div 
                        className={[styles.AttitudeSwitcher, attitude === true ? styles.ActiveAttitude : styles.InactiveAttitude].join(' ')}
                        onClick={() => this.changeAttitude(op.id, p.id, attitude, true, p.type)}>
                        <ThumbV1 type='up' /> 
                      </div>
                      <div 
                        className={[styles.AttitudeSwitcher, attitude === false ? styles.ActiveAttitude : styles.InactiveAttitude].join(' ')}
                        onClick={() => this.changeAttitude(op.id, p.id, attitude, false, p.type)}>
                        <ThumbV1 type='down' />
                      </div>
                      <div 
                        className={[styles.AttitudeSwitcher, attitude === null ? styles.ActiveAttitude : styles.InactiveAttitude].join(' ')}
                        onClick={() => this.changeAttitude(op.id, p.id, attitude, null, p.type)}>
                      <QuestionMark />
                      </div>
                    </ReactTooltip>
                  </div>
                </td>
              );
            })
          }
        </tr>
      );
    });    

    let modal = null;
    if (this.state.showModal) {
      let piece = this.props.task.pieces[this.state.modalPieceId];
      // console.log(piece);
      if (piece !== undefined) {
        modal = (
          <Aux>
            <div className={styles.BackDrop}>
            </div>
            <div 
              className={styles.ModalContentBackground}>
              <InteractionBox 
                mode={'UPDATE'}
                clip={this.dismissModal}
                id={this.state.modalPieceId}
                specificPieceId={this.state.specificPieceId}
                options={this.props.task.options}
                attitudeOptionPairs={piece.attitudeOptionPairs}
                type={piece.type}
                url={piece.url}
                postTags={piece.postTags}
                htmls={piece.htmls}
                title={piece.title}
                originalDimensions={piece.originalDimensions}
                selectedText={piece.texts}
                notes={piece.notes}
              />
            </div>
          </Aux>
        );
      }

    }

    

    

    return (
      <Aux>
        <div className={styles.TableView}>
          <div className={styles.ConfigureRow}>

            <div className={styles.PieceConfigure}>
              {pieceViewOption}
            </div>
          </div>
          

          <div className={styles.Content}>
            <table className={styles.ComparisonTable}>
              <thead>
                {experimentalTableHeader}
              </thead>
              <tbody>
                {experimentalTableBody}
              </tbody>
            </table>
          </div>
        </div>
        
        
        {modal}
      </Aux>
    );
  }
}

export default TableView;