import React, { Component } from 'react';

import {Collapse} from 'react-collapse';
import Scrollspy from 'react-scrollspy';
import FontAwesome from 'react-fontawesome';
import InteractionBox from '../../../../../components/InteractionBox/InteractionBox';
// import * as actionTypes from '../../../../../shared/actionTypes';
import PageCard from '../../../../../components/UI/SnippetCards/PageCard/PageCard';
import SnippetCard from '../../../../../components/UI/SnippetCards/SnippetCard/SnippetCard';
import Aux from '../../../../../hoc/Aux/Aux';
import styles from './CollectionView.css';
import { SNIPPET_TYPE } from '../../../../../shared/constants';
import * as FirebaseStore from '../../../../../firebase/store';
import { sortBy, reverse, slice } from 'lodash';


const getNumColInResponsiveGridLayout = (windowSize) => {
  let maxNumCol = 5;

  if (windowSize > 1730) {
    maxNumCol = 5;
  } else if (windowSize <= 1730 && windowSize > 1220) {
    maxNumCol = 4;
  } else if (windowSize <= 1220 && windowSize > 900) {
    maxNumCol = 3;
  } else if (windowSize <= 900 && windowSize > 630) {
    maxNumCol = 2;
  } else {
    maxNumCol = 1;
  }

  return maxNumCol;
}


const TopPages = (props) => {
  let numberOptions = [
    {limit: 5, displayValue: 'Top 5', sizeCutOff: [1, 3, 5]},
    {limit: 10, displayValue: 'Top 10', sizeCutOff: [2, 5, 8]},
    {limit: Number.MAX_VALUE, displayValue: 'All', sizeCutOff: [3, 7, 11]}
  ];

  /* preprocess page title sizes */
  let sizeCutOff = numberOptions.filter(op => op.limit === 5)[0].sizeCutOff;
  if (props.pages.length > 7 && props.pages.length <= 12) {
    sizeCutOff = numberOptions.filter(op => op.limit === 10)[0].sizeCutOff;
  } else if (props.pages.length > 12) {
    sizeCutOff = numberOptions.filter(op => op.limit === Number.MAX_VALUE)[0].sizeCutOff;
  }

  for (let idx = 0; idx < props.pages.length; idx++) {
    let size = 'giant';
    if (idx < sizeCutOff[0]) {
      size = 'giant';
    } else if (idx >= sizeCutOff[0] && idx < sizeCutOff[1]) {
      size = 'large'
    } else if (idx >= sizeCutOff[1] && idx < sizeCutOff[2]) {
      size = 'medium'
    } else {
      size = 'small'
    }
    props.pages[idx].sizeAssignment = size;
  }

  /* Experimental responsive grid */
  let maxNumCol = getNumColInResponsiveGridLayout(props.windowSize);

  let responsiveGridViewPartitionOfPages = [];
  for (let i = 0; i < maxNumCol; i++)
    responsiveGridViewPartitionOfPages.push([]);
  for (let i = 0; i < props.pages.length; i++) {
    responsiveGridViewPartitionOfPages[i%maxNumCol].push(props.pages[i]);
  }

  let content = (
    <div className={styles.Content}>
      {responsiveGridViewPartitionOfPages.map((pgroup, outerIndex) => (
        <div className={styles.ResponsiveColumn} key={outerIndex}>
          {pgroup.map((page, idx) => {
            return (
              <PageCard
                key={page.id}
                id={page.id}
                type="toppages"
                title={page.siteTitle}
                titleSize={page.sizeAssignment}
                siteName={page.domainName}
                siteLink={page.url}
                siteIcon={page.url}
                times={page.visitedCount}
                numPieces={page.numPieces}
                deleteThisPage={props.deletePage} />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <Aux>
      <div className={styles.Header}>
        <div className={styles.HeaderNameContainer}>
          <div className={styles.HeaderName}>
            Pages
          </div>
          {
            props.pages.length > 0
            ? <div 
                className={styles.HeaderCollapseButton}
                onClick={(event) => props.switchDisplayStatus(event)}>
                {
                  props.isOpen 
                  ? <FontAwesome name={'chevron-up'} />
                  : <FontAwesome name={'chevron-down'} />
                }
              </div>
            : null
          }
        </div>
        <div className={styles.DisplayNumberContainer}>
          {
            numberOptions.map((op, idx) => (
              <div
                key={idx}
                className={[styles.DisplayNumber,
                  (
                    props.displayNumber === op.limit
                    ? styles.Active
                    : null
                  )
                ].join(' ')}
                onClick={() => props.switchDisplayNum(op.limit)}>
                {op.displayValue}
              </div>
            ))
          }
        </div>
      </div>
      <Collapse isOpened={props.isOpen} springConfig={{stiffness: 700, damping: 50}}>
        {content}
      </Collapse>
      
    </Aux>
  );
}


const SnippetsGroup = (props) => {
  
  const { piecesList, options } = props;

  /* Experimental responsive grid */
  let maxNumCol = getNumColInResponsiveGridLayout(props.windowSize);

  let responsiveGridViewPartitionOfSnippets = [];
  for (let i = 0; i < maxNumCol; i++)
    responsiveGridViewPartitionOfSnippets.push([]);
  for (let i = 0; i < piecesList.length; i++) {
    responsiveGridViewPartitionOfSnippets[i%maxNumCol].push(piecesList[i]);
  }

  let content = (
    <div className={styles.Content}>
      {responsiveGridViewPartitionOfSnippets.map((pgroup, outerIndex) => (
        <div className={styles.ResponsiveColumn} key={outerIndex}>
          {pgroup.map((p, idx) => {
            let attitudeOptionPairsList = [];
            if (Object.keys(options).length > 0 && p.attitudeOptionPairs !== undefined) {
              p.attitudeOptionPairs.forEach((pair) => {
                attitudeOptionPairsList.push({
                  optionId: pair.optionId,
                  optionName: options[pair.optionId].name,
                  attitude: pair.attitude !== undefined ? pair.attitude : null
                }); 
              });
            }
            attitudeOptionPairsList = sortBy(attitudeOptionPairsList, ['attitude']);
            return (
              <SnippetCard
                key={idx}
                id={p.id} 
                type={p.type}
                allPieces={props.pieces}
                options={props.options}
                status={p.status}
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
                attitudeOptionPairsList={attitudeOptionPairsList}
                deleteThisSnippet={props.deleteSnippet}
                makeInteractionBox={props.makeInteractionBox}
                createAPieceGroup={props.createAPieceGroup}
                addAPieceToGroup={props.addAPieceToGroup}/>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <Aux>
      <div className={styles.Header}>
        <div className={styles.HeaderNameContainer}>
          <div className={styles.HeaderName}>
            {props.title}
          </div>
          {
            piecesList.length > 0
            ? <div 
                className={styles.HeaderCollapseButton}
                onClick={(event) => props.switchDisplayStatus(event)}>
                {
                  props.isOpen 
                  ? <FontAwesome name={'chevron-up'} />
                  : <FontAwesome name={'chevron-down'} />
                }
              </div>
            : null
          }
        </div>
      </div>
      <Collapse isOpened={props.isOpen} springConfig={{stiffness: 700, damping: 50}}>
        {content}
      </Collapse>
    </Aux>
  );
}

class CollectionView extends Component {
  state = {
    numTopPageToDisplay: 5,
    windowSize: window.innerWidth,
    showModal: false,
    modalPieceId: '',
    topPageIsOpen: true,
    allSnippetSIsOpen: true,
    withCodeSnippetIsOpen: false,
    withNodeSnippetsIsOpen: false
  }

  componentDidMount() {
    window.addEventListener('resize', this.windowSizeChangeHandler);
    document.body.addEventListener('keydown',  (event) => {
      if (event.key === 'Escape') {
        this.dismissModal();
      }
    });
  }

  switchTopPageOpenStatus = (event) => {
    console.log(this.state.topPageIsOpen);
    this.setState(prevState => {
      return {topPageIsOpen: !prevState.topPageIsOpen};
    });
  }

  switchAllSnippetsOpenStatus = (event) => {
    this.setState(prevState => {
      return {allSnippetSIsOpen: !prevState.allSnippetSIsOpen};
    });
  }

  switchWithCodeSnippetsOpenStatus = (event) => {
    this.setState(prevState => {
      return {withCodeSnippetIsOpen: !prevState.withCodeSnippetIsOpen};
    });
  }

  switchWithNoteSnippetsOpenStatus = (event) => {
    this.setState(prevState => {
      return {withNodeSnippetsIsOpen: !prevState.withNodeSnippetsIsOpen};
    })
  }

  changeTopPageDisplayNumberTo = (num) => {
    this.setState({numTopPageToDisplay: num});
  }

  windowSizeChangeHandler = (event) => {
    // console.log('Window Width: ' + window.innerWidth);
    this.setState({windowSize: window.innerWidth});
  }

  deletePageHandler = (event, id) => {
    console.log("To delete id: " + id);
    // chrome.runtime.sendMessage({
    //   msg: actionTypes.DELETE_A_PAGE_FROM_COUNT_LIST,
    //   payload: {id}
    // });
    FirebaseStore.deleteAPageFromCountList(id);
  }

  createAPieceGroup = (piece1Id, piece2Id) => {
    let pieceGroup = {
      pieceIds: [piece1Id, piece2Id],
      name: '',
      timestamp: (new Date()).getTime(),
      type: SNIPPET_TYPE.PIECE_GROUP
    };
    // chrome.runtime.sendMessage({
    //   msg: actionTypes.CREATE_A_PIECE_GROUP_WITH_TWO_PIECES,
    //   payload: {
    //     pieceGroup
    //   }
    // });
    FirebaseStore.createAPieceGroup(pieceGroup);
  }

  addAPieceToGroup = (groupId, pieceId) => {
    // chrome.runtime.sendMessage({
    //   msg: actionTypes.ADD_A_PIECE_TO_A_GROUP,
    //   payload: {
    //     groupId, pieceId
    //   }
    // });
    FirebaseStore.addAPieceToGroup(groupId, pieceId);
  }

  deletePieceHandler = (event, id, type) => {
    console.log("To delete piece with id: " + id);
    if (type === SNIPPET_TYPE.PIECE_GROUP) {
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.DELETE_A_PIECE_GROUP,
      //   payload: {groupId: id}
      // });
      FirebaseStore.deleteAPieceGroup(id);
    } else {
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.DELETE_A_PIECE_WITH_ID,
      //   payload: {id}
      // });
      FirebaseStore.deleteAPieceWithId(id);
    }
    
    
  }

  dismissModal = () => {
    this.setState({showModal: false});
  }

  makeInteractionbox = (event, pieceId) => {
    this.setState({modalPieceId: pieceId, showModal: true});
  }

  render () {
    const { task } = this.props;
    const { pageCountList } = task;
    let pageList = [];
    for (let pageKey in pageCountList) {
      let page = {
        ...pageCountList[pageKey],
        id: pageKey
      }
      pageList.push(page);
    }

    let ordered_page_list = slice(
      reverse(sortBy(pageList, ['visitedCount'])),
      0,
      this.state.numTopPageToDisplay
    );
    let topPages = (
      <TopPages
        switchDisplayStatus={this.switchTopPageOpenStatus}
        isOpen={this.state.topPageIsOpen}
        windowSize={this.state.windowSize}
        pages={ordered_page_list}
        deletePage={this.deletePageHandler}
        displayNumber={this.state.numTopPageToDisplay}
        switchDisplayNum={this.changeTopPageDisplayNumberTo}/>
    );

    let piecesList = [];
    for (let pKey in task.pieces) {
      piecesList.push({
        ...task.pieces[pKey],
        status: true,
        id: pKey
      });
    }
    let filteredPiecesWithCode = piecesList.filter(p => {
      if (p.codeSnippetHTMLs !== undefined) 
        return true;
      let htmls = p.htmls;
      for (let html of htmls) {
        if (html.indexOf('prettyprint') !== -1 
        || (html.indexOf('<code') !== -1 && html.indexOf('</code>') !== -1)) {
          return true;
        }
      }
      return false;
    });

    let codeSnippets = (
      <SnippetsGroup
        title={<span>With Code Snippets <FontAwesome name="code" /></span>}
        switchDisplayStatus={this.switchWithCodeSnippetsOpenStatus}
        isOpen={this.state.withCodeSnippetIsOpen}
        windowSize={this.state.windowSize}
        options={task.options}
        pieces={task.pieces}
        piecesList={filteredPiecesWithCode}
        makeInteractionBox={this.makeInteractionbox}
        deleteSnippet={this.deletePieceHandler}/>
    );

    let filteredPiecesWithNotes = piecesList.filter(p => {
      if (p.notes !== undefined && p.notes !== '') {
        return true;
      }
      return false;
    });

    let noteSnippets = (
      <SnippetsGroup
        title={<span>With Notes <FontAwesome name="sticky-note" /></span>}
        switchDisplayStatus={this.switchWithNoteSnippetsOpenStatus}
        isOpen={this.state.withNodeSnippetsIsOpen}
        windowSize={this.state.windowSize}
        options={task.options}
        pieces={task.pieces}
        piecesList={filteredPiecesWithNotes}
        makeInteractionBox={this.makeInteractionbox}
        deleteSnippet={this.deletePieceHandler} />
    );

    const { pieceGroups } = task;
    let pieceGroupsList = [];
    let piecesListClone = piecesList.map(p => JSON.parse(JSON.stringify(p)));
    for (let pgKey in pieceGroups) {
      let group = pieceGroups[pgKey];
      pieceGroupsList.push({
        ...group,
        id: pgKey,
        status: true  // should display
      });
      for (let pId of group.pieceIds) {
        piecesListClone.filter(p => p.id === pId)[0].status = false;
      }
    }
    let newPiecesList = pieceGroupsList.concat(reverse(sortBy(piecesListClone, ['status'])));
    // console.log(newPiecesList);


    let allSnippets = (
      <SnippetsGroup
        title={<span>All Pieces Collected <FontAwesome name="puzzle-piece" /></span>}
        switchDisplayStatus={this.switchAllSnippetsOpenStatus}
        isOpen={this.state.allSnippetSIsOpen}
        windowSize={this.state.windowSize}
        options={task.options}
        pieces={task.pieces}
        piecesList={newPiecesList}
        makeInteractionBox={this.makeInteractionbox}
        deleteSnippet={this.deletePieceHandler} 
        createAPieceGroup={this.createAPieceGroup}
        addAPieceToGroup={this.addAPieceToGroup}/>
    );


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
                attitudeOptionPairs={piece.attitudeOptionPairs}
                type={piece.type}
                url={piece.url}
                postTags={piece.postTags}
                htmls={piece.htmls}
                title={piece.title}
                originalDimensions={piece.originalDimensions}
                selectedText={piece.texts}
                codeSnippetHTMLs={piece.codeSnippetHTMLs}
                codeSnippetTexts={piece.codeSnippetTexts}
                notes={piece.notes}
              />
            </div>
          </Aux>
        );
      }

    }


    return (
      <Aux>
        <div className={styles.CollectionView}>
            <div className={styles.SideNav}>
              <Scrollspy
                items={ ['section-1', 'section-2', 'section-3', 'section-4'] }
                currentClassName={styles.Current}
                offset={-200}>
                <li><a href="#section-1">Top Pages</a></li>
                <li><a href="#section-2">All Pieces
                </a></li>
                <li><a href="#section-3">With Code Snippets</a></li>
                <li><a href="#section-4">With Notes</a></li>
                </Scrollspy>
            </div>

            <div className={styles.Main} id="scrollable-content-container">

              <div id="section-1" className={styles.Section}>
                {topPages}
              </div>

              <div id="section-2" className={styles.Section}>
                {allSnippets}
              </div>

              <div 
                id="section-3" 
                className={styles.Section}>
                {codeSnippets}
              </div>

              <div 
                id="section-4" 
                className={styles.Section}>
                {noteSnippets}
              </div>


              

            </div>
        </div>

        {modal}
      </Aux>
    );
  }
}

export default CollectionView;