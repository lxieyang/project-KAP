import $ from 'jquery';
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';
import {Collapse} from 'react-collapse';
import Aux from '../../../../../hoc/Aux/Aux';

import fasListAlt from '@fortawesome/fontawesome-free-solid/faListAlt';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farSquare from '@fortawesome/fontawesome-free-regular/faSquare';
import farWindowMaximize from '@fortawesome/fontawesome-free-regular/faWindowMaximize';
import fasICursor from '@fortawesome/fontawesome-free-solid/faICursor';
import fasCode from '@fortawesome/fontawesome-free-solid/faCode';
import fasMinusCircle from '@fortawesome/fontawesome-free-solid/faMinusCircle';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasToggleOn from '@fortawesome/fontawesome-free-solid/faToggleOn';
import fasToggleOff from '@fortawesome/fontawesome-free-solid/faToggleOff';
import fasChevronDown from '@fortawesome/fontawesome-free-solid/faChevronDown';
import fasChevronUp from '@fortawesome/fontawesome-free-solid/faChevronUp';

import TableRow from './TableRow/TableRow';
import ToggleSwitch from '../../../../../components/UI/ToggleSwitch/ToggleSwitch';
import InteractionBox from '../../../../../components/InteractionBox/InteractionBox';
import ThumbV1 from '../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';
import QuestionMark from '../../../../../components/UI/Thumbs/QuestionMark/QuestionMark';
import SnippetCard from '../../../../../components/UI/SnippetCards/SnippetCard/SnippetCard';
// import * as actionTypes from '../../../../../shared/actionTypes';
import styles from './TableView.css';
import { SNIPPET_TYPE } from '../../../../../shared/constants';
import { getFirstNWords } from '../../../../../shared/utilities';
import { debounce, sortBy, reverse } from 'lodash';
import ReactTooltip from 'react-tooltip';
import * as FirebaseStore from '../../../../../firebase/store';

/* For DnD */
import TableHeader from './TableHeader/TableHeader';
import update from 'immutability-helper';

const inactiveOpacity = 0.2;


class TableView extends Component {
  state = {
    pieces: this.props.task.pieces,
    specificPieceId: this.props.specificPieceId !== undefined ? this.props.specificPieceId : null,
    options: this.props.task.options,
    requirements: this.props.task.requirements,
    pieceGroups: this.props.task.pieceGroups,
    selectedSnippets: 0,
    optionsList: [],
    requirementsList: [],
    piecesList: [],
    isDetailed: true,
    shouldShowNotes: true,
    showModal: false,
    modalPieceId: '',
    tableviewisOpen: true,
    readModeisOn: false,
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    this.setState({selectedSnippets: nextProps.selectedSnippets})
    // console.log('tableview selected snippet number', this.state.selectedSnippets);
    if (nextProps.specificPieceId !== undefined) {
      this.setState({specificPieceId: nextProps.specificPieceId})
    } else {
      this.setState({specificPieceId: null});
    }
    const { task } = nextProps;
    this.transformData(task);
  }

  keyDownHandler = (event) => {
    if (event.key === 'Escape') {
      this.dismissModal();
    }

  }

  componentDidMount () {
    const { task } = this.props;
    this.transformData(task);

    document.body.addEventListener('keydown',  this.keyDownHandler);

    this.unlisten = this.props.history.listen((location, action) => {
      const search = qs.parse(location.search);
      if (search.pieceId !== null && search.pieceId !== undefined) {
        this.setState({modalPieceId: search.pieceId, showModal: true});

      } else {
        this.setState({showModal: false});
      }
    });

    document.body.addEventListener('keyup', (event) => {
      if(document.getElementById('addInput') === document.activeElement && event.keyCode === 13) {
        // console.log('enter on option');
        this.submitOption(event);
        document.getElementById('addInput').value='';
      }
      if(document.getElementById('addCriterion') === document.activeElement && event.keyCode === 13) {
        // console.log('enter on criterion');
        this.submitCriterion(event);
        document.getElementById('addCriterion').value='';
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
    document.body.removeEventListener('keydown', this.keyDownHandler);
  }

  transformData = (task) => {
    // extract options
    let optionsList = [];
    for (let opKey in task.options) {
      optionsList.push({
        ...task.options[opKey],
        id: opKey,
        active: true,
      });
    }
    optionsList = sortBy(optionsList, ['order']);

    // extract requirements
    let requirementsList = [];
    for (let rqKey in task.requirements) {
      requirementsList.push({
        ...task.requirements[rqKey],
        id: rqKey,
        active: true
      });
    }
    requirementsList = sortBy(requirementsList, ['order']);

    // extract pieces
    let piecesList = [];
    for (let pKey in task.pieces) {
      piecesList.push({
        ...task.pieces[pKey],
        id: pKey,
        active: true // toInactivePiecesList.indexOf(pKey) === -1
      });
    }

    // show notes?
    let shouldShowNotes = task.showOptionNotes;

    this.setState({optionsList, requirementsList, piecesList, shouldShowNotes});
  }

  switchTableIsOpenStatus = (event) => {
    this.setState(prevState => {
      return {tableviewisOpen: !prevState.tableviewisOpen};
    });
  }
  // syncing scrolling for the two tables https://jsfiddle.net/1tv8bkyc/8/
  scrollTable = (event) => {
    $('#top').on('scroll', function () {
          $('#middle').scrollTop($(this).scrollTop());
          $('#bottom').scrollTop($(this).scrollTop());
          $('#bottom').scrollLeft($(this).scrollLeft());
        });
  }

  attitudeChangeHandler = (event) => {
    console.log('TODO: update the attitudes of all selected snippets and unselect all snippets')
  }

  switchTableMode = (event) => {
    this.setState({readModeisOn:!this.state.readModeisOn});
  }

  getOrderedRequirementListFromState () {
    let { requirementsList } = this.state;
    requirementsList = reverse(sortBy(requirementsList, ['active', 'order']));
    return requirementsList;
  }

  getOrderedOptionListFromState () {
    let { optionsList } = this.state;
    optionsList = reverse(sortBy(optionsList, ['active']));
    return optionsList;
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

  switchRequirementStatus = (event, requirementId) => {
    let idx = 0;
    let updatedRequirement = {};
    for(; idx < this.state.requirementsList.length; idx++) {
      if (this.state.requirementsList[idx].id === requirementId) {
        updatedRequirement = {...this.state.requirementsList[idx]};
        break;
      }
    }
    updatedRequirement.active = !updatedRequirement.active;
    let updatedRequirementList = [...this.state.requirementsList];
    updatedRequirementList[idx] = updatedRequirement;
    this.setState({requirementsList: updatedRequirementList});
  }


  // dismissModal = () => {
  //   this.setState({showModal: false});
  // }

  // makeInteractionbox = (event, pieceId) => {
  //   this.setState({modalPieceId: pieceId, showModal: true});
  // }

  dismissModal = () => {
    // this.setState({showModal: false});
    const query = {
      ...qs.parse(this.props.location.search)
    };
    delete query['pieceId'];
    this.props.history.push({
      search: qs.stringify(query)
    });
  }

  makeInteractionbox = (event, pieceId) => {
    // this.setState({modalPieceId: pieceId, showModal: true});
    const query = {
      ...qs.parse(this.props.location.search),
      pieceId
    };
    this.props.history.push({
      search: qs.stringify(query)
    });
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

  detailedViewChangeHandler = (event) => {
    this.setState(prevState => {
      return {isDetailed: !prevState.isDetailed};
    });
  }

  showNotesChangedHandler = (event) => {
    this.setState(prevState => {
      return {shouldShowNotes: !prevState.shouldShowNotes};
    });

    // this.setState({shouldShowNotes:!shouldShowNotes});
    FirebaseStore.switchShowOptionNotesStatus();
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

  /* For Dnd */
  moveHeader = (dragIndex, hoverIndex) => {
    const { requirementsList } = this.state;
    const dragHeader = requirementsList[dragIndex];

    let newRequirementsList = update(requirementsList, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragHeader]
      ]
    });

    this.setState({requirementsList: newRequirementsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newRequirementsList.length; idx++) {
      ordering[newRequirementsList[idx].id] = idx;
    }
    FirebaseStore.updateRequirementOrdering(ordering);
  }

  switchHideStatusOfARequirement = (toHideIndex, requirementId, hide) => {
    const { requirementsList } = this.state;
    const fromHeader = requirementsList[toHideIndex];
    let toIndex = requirementsList.length - 1;

    let newRequirementsList = update(requirementsList, {
      $splice: [
        [toHideIndex, 1],
        [toIndex, 0, fromHeader]
      ]
    });

    this.setState({requirementsList: newRequirementsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newRequirementsList.length; idx++) {
      ordering[newRequirementsList[idx].id] = idx;
    }

    FirebaseStore.switchHideStatusOfARequirementWithId(requirementId, hide, ordering);
  }

  moveRow = (dragIndex, hoverIndex) => {

    const { optionsList } = this.state;
    const dragRow = optionsList[dragIndex];

    let newOptionsList = update(optionsList, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragRow]
      ]
    });

    this.setState({optionsList: newOptionsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newOptionsList.length; idx++) {
      ordering[newOptionsList[idx].id] = idx;
    }
    FirebaseStore.updateOptionsOrdering(ordering);
  }

  switchHideStatusOfAnOption = (toHideIndex, optionId, hide) => {

    const { optionsList } = this.state;
    const fromRow = optionsList[toHideIndex];
    let toIndex = optionsList.length - 1;

    let newOptionsList = update(optionsList, {
      $splice: [
        [toHideIndex, 1],
        [toIndex, 0, fromRow]
      ]
    });

    this.setState({optionsList: newOptionsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newOptionsList.length; idx++) {
      ordering[newOptionsList[idx].id] = idx;
    }

    FirebaseStore.switchHideStatusOfAnOptionWithId(optionId, hide, ordering);
  }

  switchStarStatusOfRequirement = (id) => {
    FirebaseStore.switchStarStatusOfARequirementWithId(id);
  }

  switchStarStatusOfOption = (id) => {
    FirebaseStore.switchStarStatusOfAnOptionWithId(id);
  }

  switchUsedStatusOfOption = (id, used) => {
    if (used === true) {
      FirebaseStore.unUseAnOption(id);
    } else {
      FirebaseStore.useAnOption(id);
    }
  }

  submitOption (event) {
    // console.log('option Heard',event.target.value);
    FirebaseStore.addAnOptionForCurrentTask(event.target.value);
  }

  submitCriterion (event) {
    // console.log('option Heard',event.target.value);
    FirebaseStore.addARequirementForCurrentTask(event.target.value);
  }
  log(event) {
    console.log('click made');
  }

  render () {

    // let pieceViewOption = (
    //   <Aux>
    //     <div className={styles.Label}>
    //       <span>View Detailed Pieces</span>
    //     </div>
    //     <div className={styles.Slider}>
    //       <ToggleSwitch
    //         checked={this.state.isDetailed}
    //         statusChanged={this.detailedViewChangeHandler}/>
    //     </div>
    //   </Aux>
    // );


    let newRequirementsList = this.state.requirementsList; // this.getOrderedRequirementListFromState();
    let newOptionsList = this.state.optionsList; // this.getOrderedOptionListFromState();
    let newTableHeader = (
      <tr>
        <td className={styles.addButtons}>
        <FontAwesomeIcon icon={faPlus} style={{visibility:'hidden'}}/>
        <br></br>
        <br></br>
        <FontAwesomeIcon icon={fasFlagCheckered} className={styles.addCriterion}/>  &nbsp;
        <input id='addCriterion' type="text" placeholder={'Add a Criterion / Feature'}
        className={styles.Input}

        />
        <br></br>
        <br></br>
        <FontAwesomeIcon icon={fasListAlt} className={styles.addOption}/> &nbsp;
        <input id='addInput' type="text" name="option" placeholder={'Add an Option'}
        className={styles.Input} ref={(input) => { this.OptionInput = input; }}
        onSubmit={(event) => this.submitOption(event)}/>

        </td>

        {
          newRequirementsList.map((rq, idx) => {
            let isVisible = true;
            return (
              <TableHeader
                key={rq.id}
                rq={rq}
                index={idx}
                moveHeader={this.moveHeader}
                inactiveOpacity={inactiveOpacity}
                switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
                switchHideStatusOfARequirement={this.switchHideStatusOfARequirement}
                updateRequirementName={FirebaseStore.updateRequirementName}
                isVisible={isVisible}
                />
            );
          })
        }
      </tr>
    );
    let viewTableHeader = (
      <tr>
        <td className={styles.addButtons}>
      </td>

        {
          newRequirementsList.map((rq, idx) => {
            let isVisible = true;
            return (
              <TableHeader
                key={rq.id}
                rq={rq}
                index={idx}
                moveHeader={this.moveHeader}
                inactiveOpacity={inactiveOpacity}
                switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
                switchHideStatusOfARequirement={this.switchHideStatusOfARequirement}
                updateRequirementName={FirebaseStore.updateRequirementName}
                isVisible={isVisible}
                />
            );
          })
        }
      </tr>
    );
    let newTableBody = newOptionsList.map((op, idx) => {
      let optionVisibility = true;
      let snippetsSelected = this.state.selectedSnippets;
      return (
        <tr key={op.id}>
          <TableRow
            op={op}
            index={idx}
            moveRow={this.moveRow}
            inactiveOpacity={inactiveOpacity}
            switchStarStatusOfOption={this.switchStarStatusOfOption}
            switchHideStatusOfAnOption={this.switchHideStatusOfAnOption}
            switchUsedStatusOfOption={this.switchUsedStatusOfOption}
            newRequirementsList={newRequirementsList}
            pieces={this.state.pieces}
            options={this.state.options}
            requirements={this.state.requirements}
            updateOptionName={FirebaseStore.updateOptionName}
            addANoteToOption={FirebaseStore.addANoteToAnOption}
            deleteANoteFromOption={FirebaseStore.deleteANoteFromAnOption}
            shouldShowNotes={this.state.shouldShowNotes}
            makeInteractionbox={this.makeInteractionbox}
            invisible={optionVisibility}
            />
            {
              newRequirementsList.map((rq, index) => {
                // find all pieces in the piecesList that has option id = op.id and requirement id = rq.id
                let piecesInThisCell = [];
                for (let pKey in this.state.pieces) {
                  let piece = this.state.pieces[pKey];
                  let attitudeList = piece.attitudeList;
                  if (attitudeList !== undefined) {
                    let attitudeRequirementPairs = attitudeList[op.id];
                    if (attitudeRequirementPairs !== undefined) {
                      let attitude = attitudeRequirementPairs[rq.id];
                      if (attitude !== undefined) {
                        piecesInThisCell.push({
                          ...piece,
                          id: pKey,
                          attitude: attitude
                        })
                      }
                    }
                  }
                }
                piecesInThisCell = reverse(sortBy(piecesInThisCell, ['attitude']));

                if (snippetsSelected) {
                return (
                  <td key={rq.id} style={{alignItems:'center'}}>

                  <div className={[styles.RequirementAttitudeContainer].join(' ')}>

                  <div
                  className={[styles.RequirementAttitudeThumbContainer].join(' ')}
                  onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'good')}>
                  <ThumbV1 type={'up'}/>
                  </div>

                  <div
                  className={[styles.RequirementAttitudeThumbContainer].join(' ')}
                  onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'idk')}>
                  <QuestionMark />
                  </div>

                  <div
                  className={[styles.RequirementAttitudeThumbContainer].join(' ')}
                  onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'bad')}>
                  <ThumbV1 type={'down'}/>
                  </div>

                  </div>
                  </td>
                )}
                else {
                  return(
                  <td key={rq.id} style={{
                    opacity: rq.hide === true || op.hide === true ? `${inactiveOpacity}` : '1',
                  }}>
                    <div className={styles.AttitudeThumbInTableCellContainer}>
                      {
                        piecesInThisCell.length > 0 ?
                        piecesInThisCell.map((p, idx) => {
                        let thumb = null;
                        switch (p.attitude) {
                          case 'good':  thumb = (<ThumbV1 type='up' />); break;
                          case 'bad':   thumb = (<ThumbV1 type='down' />); break;
                          case 'idk':   thumb = (<QuestionMark />); break;
                          default: break;
                        }
                        // TODO add onclick to bring up interactionbox for each attitude in table cell
                        return (
                          <Aux key={`${p.id}${op.id}${rq.id}`}>
                            <div
                              className={[styles.AttitudeInTableCell].join(' ')}
                              data-tip
                              data-for={`${p.id}${op.id}${rq.id}`}
                              >
                              {thumb}
                            </div>
                            <ReactTooltip
                              place="right"
                              type="light"
                              effect="solid"
                              id={`${p.id}${op.id}${rq.id}`}
                              className={styles.TooltipOverAttitude}
                              getContent={() => {
                                return (
                                  <SnippetCard
                                    id={p.id}
                                    type={p.type}
                                    isInTableView={true}
                                    allPieces={this.state.pieces}
                                    options={this.state.options}
                                    requirements={this.state.requirements}
                                    status={true}
                                    pieceIds={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.pieceIds : []}
                                    title={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.title}
                                    texts={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.texts}
                                    name={p.type === SNIPPET_TYPE.PIECE_GROUP ? null : (new URL(p.url)).hostname}
                                    link={p.url}
                                    icon={p.url}
                                    htmls={p.htmls}
                                    timestamp={p.timestamp}
                                    postTags={p.postTags}
                                    notes={p.notes}
                                    codeUseInfo={p.codeUseInfo}
                                    attitudeList={p.attitudeList}
                                    makeInteractionBox={(event, id) => this.makeInteractionbox(event, id)
                                    }/>
                                );
                              }}>

                            </ReactTooltip>
                          </Aux>
                        );

                      }): null}
                    </div>
                  </td>
                  )
                };
              })
            }
        </tr>
      );
    });

    let TableBodyOverlay = newOptionsList.map((op,idx) => {
    let optionVisibility = true;
    return (
        <tr
        key={op.id}
        style={{position:'relative',backgroundColor:'rgba(255,255,255,1)'}}
        >
        <TableRow
          op={op}
          index={idx}
          moveRow={this.moveRow}
          inactiveOpacity={inactiveOpacity}
          switchStarStatusOfOption={this.switchStarStatusOfOption}
          switchHideStatusOfAnOption={this.switchHideStatusOfAnOption}
          switchUsedStatusOfOption={this.switchUsedStatusOfOption}
          newRequirementsList={newRequirementsList}
          pieces={this.state.pieces}
          options={this.state.options}
          requirements={this.state.requirements}
          updateOptionName={FirebaseStore.updateOptionName}
          addANoteToOption={FirebaseStore.addANoteToAnOption}
          deleteANoteFromOption={FirebaseStore.deleteANoteFromAnOption}
          shouldShowNotes={this.state.shouldShowNotes}
          makeInteractionbox={this.makeInteractionbox}
          invisible={optionVisibility}
          />
        </tr>
      )});
    let emptyHeader = (
      <tr>
          <th>
            <div className={styles.ConfigurationLine}>
            </div>
            </th>

        {   newRequirementsList.map((rq, idx) => {
            let isVisible = false;
            return (
              <TableHeader
                key={rq.id}
                rq={rq}
                index={idx}
                moveHeader={this.moveHeader}
                inactiveOpacity={inactiveOpacity}
                switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
                switchHideStatusOfARequirement={this.switchHideStatusOfARequirement}
                updateRequirementName={FirebaseStore.updateRequirementName}
                isVisible={isVisible}
                />
            );
          })
        }
      </tr>
    );
    let invisibleIconOverlay = newOptionsList.map((op, idx) => {
      let optionVisibility = false;
      return (
        <tr key={op.id}>
          <TableRow
            op={op}
            index={idx}
            moveRow={this.moveRow}
            inactiveOpacity={inactiveOpacity}
            switchStarStatusOfOption={this.switchStarStatusOfOption}
            switchHideStatusOfAnOption={this.switchHideStatusOfAnOption}
            switchUsedStatusOfOption={this.switchUsedStatusOfOption}
            newRequirementsList={newRequirementsList}
            pieces={this.state.pieces}
            options={this.state.options}
            requirements={this.state.requirements}
            updateOptionName={FirebaseStore.updateOptionName}
            addANoteToOption={FirebaseStore.addANoteToAnOption}
            deleteANoteFromOption={FirebaseStore.deleteANoteFromAnOption}
            shouldShowNotes={this.state.shouldShowNotes}
            makeInteractionbox={this.makeInteractionbox}
            invisible={optionVisibility}
            />
            {
              newRequirementsList.map((rq, index) => {
                // find all pieces in the piecesList that has option id = op.id and requirement id = rq.id
                let piecesInThisCell = [];
                for (let pKey in this.state.pieces) {
                  let piece = this.state.pieces[pKey];
                  let attitudeList = piece.attitudeList;
                  if (attitudeList !== undefined) {
                    let attitudeRequirementPairs = attitudeList[op.id];
                    if (attitudeRequirementPairs !== undefined) {
                      let attitude = attitudeRequirementPairs[rq.id];
                      if (attitude !== undefined) {
                        piecesInThisCell.push({
                          ...piece,
                          id: pKey,
                          attitude: attitude
                        })
                      }
                    }
                  }
                }
                piecesInThisCell = reverse(sortBy(piecesInThisCell, ['attitude']));

                return (
                  <td key={rq.id} style={{
                    opacity: rq.hide === true || op.hide === true ? `${inactiveOpacity}` : '1',
                  }}>
                    <div style={{display:'flex', flexWrap:'wrap', opacity:'0'}}>
                      { piecesInThisCell.length > 0 ?
                        piecesInThisCell.map((p, idx) => {
                        let thumb = null;
                        switch (p.attitude) {
                          case 'good':  thumb = (<ThumbV1 type='up' onClick={(event) => this.log(event)}/>); break;
                          case 'bad':   thumb = (<ThumbV1 type='down' />); break;
                          case 'idk':   thumb = (<QuestionMark />); break;
                          default: break;
                        }

                        return (
                          <Aux key={`${p.id}${op.id}${rq.id}`}>
                            <div
                              className={[styles.AttitudeInTableCell].join(' ')}
                              data-tip
                              data-for={`${p.id}${op.id}${rq.id}`}>
                              {thumb}
                            </div>
                            <ReactTooltip
                              place="right"
                              type="light"
                              effect="solid"
                              id={`${p.id}${op.id}${rq.id}`}
                              className={styles.TooltipOverAttitude}
                              getContent={() => {
                                return (
                                  <SnippetCard
                                    id={p.id}
                                    type={p.type}
                                    isInTableView={true}
                                    allPieces={this.state.pieces}
                                    options={this.state.options}
                                    requirements={this.state.requirements}
                                    status={true}
                                    pieceIds={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.pieceIds : []}
                                    title={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.title}
                                    texts={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.texts}
                                    name={p.type === SNIPPET_TYPE.PIECE_GROUP ? null : (new URL(p.url)).hostname}
                                    link={p.url}
                                    icon={p.url}
                                    htmls={p.htmls}
                                    timestamp={p.timestamp}
                                    postTags={p.postTags}
                                    notes={p.notes}
                                    codeUseInfo={p.codeUseInfo}
                                    attitudeList={p.attitudeList}
                                    makeInteractionBox={(event, id) => this.makeInteractionbox(event, id)
                                    }/>
                                );
                              }}>

                            </ReactTooltip>
                          </Aux>
                        );

                      }): null}
                    </div>
                  </td>
                );
              })
            }
        </tr>
      );
    });
    let invisibleOptionsOverlay = newOptionsList.map((op, idx) => {
      let optionVisibility = false;
      return (
        <tr key={op.id}>
          <TableRow
            op={op}
            index={idx}
            moveRow={this.moveRow}
            inactiveOpacity={inactiveOpacity}
            switchStarStatusOfOption={this.switchStarStatusOfOption}
            switchHideStatusOfAnOption={this.switchHideStatusOfAnOption}
            switchUsedStatusOfOption={this.switchUsedStatusOfOption}
            newRequirementsList={newRequirementsList}
            pieces={this.state.pieces}
            options={this.state.options}
            requirements={this.state.requirements}
            updateOptionName={FirebaseStore.updateOptionName}
            addANoteToOption={FirebaseStore.addANoteToAnOption}
            deleteANoteFromOption={FirebaseStore.deleteANoteFromAnOption}
            shouldShowNotes={this.state.shouldShowNotes}
            makeInteractionbox={this.makeInteractionbox}
            invisible={optionVisibility}
            />
            {
              newRequirementsList.map((rq, index) => {
                // find all pieces in the piecesList that has option id = op.id and requirement id = rq.id
                let piecesInThisCell = [];
                for (let pKey in this.state.pieces) {
                  let piece = this.state.pieces[pKey];
                  let attitudeList = piece.attitudeList;
                  if (attitudeList !== undefined) {
                    let attitudeRequirementPairs = attitudeList[op.id];
                    if (attitudeRequirementPairs !== undefined) {
                      let attitude = attitudeRequirementPairs[rq.id];
                      if (attitude !== undefined) {
                        piecesInThisCell.push({
                          ...piece,
                          id: pKey,
                          attitude: attitude
                        })
                      }
                    }
                  }
                }
                piecesInThisCell = reverse(sortBy(piecesInThisCell, ['attitude']));

                return (
                  <td key={rq.id} style={{
                    opacity: rq.hide === true || op.hide === true ? `${inactiveOpacity}` : '1',
                  }}>
                    <div className={styles.AttitudeThumbInTableCellContainer}>
                      { piecesInThisCell.length > 0 ?
                        piecesInThisCell.map((p, idx) => {
                        let thumb = null;
                        switch (p.attitude) {
                          case 'good':  thumb = (<ThumbV1 type='up' />); break;
                          case 'bad':   thumb = (<ThumbV1 type='down' />); break;
                          case 'idk':   thumb = (<QuestionMark />); break;
                          default: break;
                        }

                        return (
                          <Aux key={`${p.id}${op.id}${rq.id}`}>
                            <div
                              className={[styles.AttitudeInTableCell].join(' ')}
                              data-tip
                              data-for={`${p.id}${op.id}${rq.id}`}>
                              {thumb}
                            </div>
                            <ReactTooltip
                              place="right"
                              type="light"
                              effect="solid"
                              id={`${p.id}${op.id}${rq.id}`}
                              className={styles.TooltipOverAttitude}
                              getContent={() => {
                                return (
                                  <SnippetCard
                                    id={p.id}
                                    type={p.type}
                                    isInTableView={true}
                                    allPieces={this.state.pieces}
                                    options={this.state.options}
                                    requirements={this.state.requirements}
                                    status={true}
                                    pieceIds={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.pieceIds : []}
                                    title={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.title}
                                    texts={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.texts}
                                    name={p.type === SNIPPET_TYPE.PIECE_GROUP ? null : (new URL(p.url)).hostname}
                                    link={p.url}
                                    icon={p.url}
                                    htmls={p.htmls}
                                    timestamp={p.timestamp}
                                    postTags={p.postTags}
                                    notes={p.notes}
                                    codeUseInfo={p.codeUseInfo}
                                    attitudeList={p.attitudeList}
                                    makeInteractionBox={(event, id) => this.makeInteractionbox(event, id)
                                    }/>
                                );
                              }}>

                            </ReactTooltip>
                          </Aux>
                        );

                      }): null}
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
      // console.log('tableview interaction box');
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
                requirements={this.props.task.requirements}

                attitudeList={piece.attitudeList}
                type={piece.type}
                url={piece.url}
                postTags={piece.postTags}
                htmls={piece.htmls}
                title={piece.title}
                autoSuggestedTitle={piece.autoSuggestedTitle}
                originalDimensions={piece.originalDimensions}
                selectedText={piece.texts}
                notes={piece.notes}
              />
            </div>
          </Aux>
        );
      }

    }

    let writeContent = (
      <div style={{}}>
      <table className={styles.ComparisonTable}>
        <thead>
          {newTableHeader}
        </thead>
        <tbody>
          {newTableBody}
        </tbody>
      </table>
      </div>
    );
    let readContent = (
      <div style={{position: 'relative'}}>
        <div id='bottom' style={{opacity:'1', zIndex: '15',borderSpacing: '0px',
                              maxWidth: '90vw', maxHeight: '50vw',
                              overflowY:'auto', overflowX:'auto'}}>
          <table className={styles.ComparisonTable}>
            <thead style={{ opacity: '1'}}>{viewTableHeader}</thead>
            <tbody style={{ opacity: '1'}}>{invisibleOptionsOverlay}</tbody>
          </table>
        </div>

        <div id='middle' style={{zIndex: '30', position: 'absolute', top: '0',
                      maxWidth: '90vw', maxHeight: '50vw',
                      overflowY:'scroll', overflowX:'scroll'}}>
        <table className={[styles.Overlay, styles.ComparisonTable].join(' ')}>
          <thead style={{opacity:'0'}}>{viewTableHeader}</thead>
          <tbody style={{opacity:'1'}}>{TableBodyOverlay}</tbody>
        </table>
        </div>

        <div id='top' style={{opacity: '1', zIndex: '45', position: 'absolute', top: '0', left: '0',
                      maxWidth: '90vw', maxHeight: '50vw',
                      overflowY:'scroll', overflowX:'scroll'}}
                      onScroll={(event) => this.scrollTable(event)}>
        <table className={[styles.Overlay].join(' ')}>
        <thead style={{ opacity: '0'}}>{emptyHeader}</thead>
        <tbody style={{ opacity: '1'}}>{invisibleIconOverlay}</tbody>
        </table>
        </div>

        <div style={{opacity: '1', zIndex: '44', position: 'absolute', top: '0', left: '0',
                      maxWidth: '90vw', maxHeight: '50vw',
                      overflowY:'hidden', overflowX:'hidden'}}>
        <table className={[styles.Overlay].join(' ')}>
        <thead style={{ opacity: '1'}}>{emptyHeader}</thead>
        <tbody style={{ visibility: 'hidden'}}>{invisibleOptionsOverlay}</tbody>
        </table>
        </div>
      </div>
  );

    return (
      <Aux>
        <div className={styles.Section}>
          <div className={styles.TableView}>
            <div className={styles.Header}>
              <div className={styles.HeaderNameContainer}>
                <div className={styles.HeaderName}
                onClick={(event) => this.switchTableIsOpenStatus(event)}>
                  <span>Comparison Table</span>
                </div>
                <div className={styles.HeaderCollapseButton}
                  onClick={(event) => this.switchTableIsOpenStatus(event)}>
                  {
                    this.state.tableviewisOpen
                    ? <FontAwesomeIcon icon={fasChevronUp} />
                    : <FontAwesomeIcon icon={fasChevronDown} />
                  }
                </div>
                { /* The show notes handler was not really working so it is temp. commented out
                <div onClick={(event) => this.showNotesChangedHandler(event)}>
                  {
                    this.state.shouldShowNotes
                    ? <span>Hide Notes</span>
                    : <span>Show Notes</span>
                  }
                </div>
                */}
              </div>

              <div className={styles.ModeToggleButtonsContainer}>
                <div className={styles.ModeToggleButton} style={{textDecoration: this.state.readModeisOn ? 'underline' : 'none'}}
                  onClick={(event) => this.switchTableMode(event)}>
                  View
                </div>

                <div>|</div>

                <div className={styles.ModeToggleButton} style={{textDecoration: this.state.readModeisOn ? 'none' : 'underline'}}
                onClick={(event) => this.switchTableMode(event)}>
                  Edit
                </div>
              </div>

            </div>
            <Collapse isOpened={this.state.tableviewisOpen} springConfig={{stiffness: 700, damping: 50}}>
              <div className={styles.Content}>
              {
                this.state.readModeisOn? readContent: writeContent
              }
              </div>
            </Collapse>
            {modal}
          </div>


        </div>

      </Aux>
    );
  }
}

export default withRouter(TableView);
