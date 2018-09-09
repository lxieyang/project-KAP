import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';

import { Collapse } from 'react-collapse';
// import Scrollspy from 'react-scrollspy';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasAngleDown from '@fortawesome/fontawesome-free-solid/faAngleDown';
import fasAngleRight from '@fortawesome/fontawesome-free-solid/faAngleRight';
import fasCode from '@fortawesome/fontawesome-free-solid/faCode';
import fasStickyNote from '@fortawesome/fontawesome-free-solid/faStickyNote';
import fasPuzzlePiece from '@fortawesome/fontawesome-free-solid/faPuzzlePiece';
import farQuestionCircle from '@fortawesome/fontawesome-free-regular/faQuestionCircle';
import fasFilter from '@fortawesome/fontawesome-free-solid/faFilter';
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
  let maxNumCol = 99;  // make it so big that this is useless
/*
  // if (windowSize > 1730) {
  //   maxNumCol = 5;
  // }
  // else if (windowSize <= 1730 && windowSize > 1220) {
  //   maxNumCol = 5;
  // }
  // else if (windowSize <= 1220 && windowSize > 900) {
  //   maxNumCol = 4;
  // }
  // else if (windowSize <= 900 && windowSize > 630) {
  //   maxNumCol = 3;
  // }
  // else if (windowSize <= 900 && windowSize > 630) {
  //   maxNumCol = 2;
  // }
  // else {
  //   maxNumCol = 1;
  // }
*/
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
                notes={page.notes}
                times={page.visitedCount}
                numPieces={page.numPieces}
                deleteThisPage={props.deletePage}
                updatePageNotes={props.updatePageNotes} />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <Aux>
      <div className={styles.Header}>
        <div className={styles.HeaderNameContainer}
        onClick={(event) => props.switchDisplayStatus(event)}
        >
          <div className={styles.HeaderName} >
            Pages
          </div>
          {
            props.pages.length > 0
            ? <div
                className={styles.HeaderCollapseButton}>
                {
                  props.isOpen
                  ? <FontAwesomeIcon icon={fasAngleDown} />
                  : <FontAwesomeIcon icon={fasAngleRight} />
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
                requirements={props.requirements}
                status={p.status}
                title={p.title}
                texts={p.texts}
                name={(new URL(p.url)).hostname}
                link={p.url}
                icon={p.url}
                htmls={p.htmls}
                timestamp={p.timestamp}
                postTags={p.postTags}
                notes={p.notes}
                codeUseInfo={p.codeUseInfo}
                attitudeList={p.attitudeList}
                codeFilterOn={props.codeFilterOn}
                notesFilterOn={props.notesFilterOn}
                specificPieceId={props.specificPieceId}
                unCategorizedFilterOn={props.unCategorizedFilterOn}
                attitudeOptionPairsList={attitudeOptionPairsList}
                deleteThisSnippet={props.deleteSnippet}
                makeInteractionBox={props.makeInteractionBox}
                incrementSelectedSnippetNumber={props.incrementSelectedSnippetNumber}
                decrementSelectedSnippetNumber={props.decrementSelectedSnippetNumber}
                selectable={true}
                />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <Aux>
      <Collapse isOpened={props.isOpen} springConfig={{stiffness: 700, damping: 50}}>
        {content}
      </Collapse>
    </Aux>
  );
}

class CollectionView extends Component {
  state = {
    numTopPageToDisplay: 5,
    selectedSnippets: 0,
    pieceGroupDisplayType: 'all',
    windowSize: window.innerWidth,
    showModal: false,
    modalPieceId: '',
    specificPieceId: this.props.specificPieceId !== undefined ? this.props.specificPieceId : null,
    topPageIsOpen: false,
    allSnippetSIsOpen: true,
    withCodeSnippetIsOpen: false,
    withNodeSnippetsIsOpen: false,
    codeFilterOn: false,
    notesFilterOn: false,
    unCategorizedFilterOn: false
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    this.setState({selectedSnippets: nextProps.selectedSnippets})
    if (nextProps.specificPieceId !== undefined) {
      this.setState({specificPieceId: nextProps.specificPieceId})
    } else {
      this.setState({specificPieceId: null});
    }
  }

  keyDownHandler = (event) => {
    if (event.key === 'Escape') {
      this.dismissModal();
    }
    // if (event.key === 'Enter' && this.state.showModal) {
      // console.log('enter pressed when interaction box is up');
    // }
  }

  componentDidMount() {
    window.addEventListener('resize', this.windowSizeChangeHandler);
    document.body.addEventListener('keydown',  this.keyDownHandler);

    this.unlisten = this.props.history.listen((location, action) => {
      const search = qs.parse(location.search);
      if (search.pieceId !== null && search.pieceId !== undefined) {
        this.setState({modalPieceId: search.pieceId, showModal: true});

      } else {
        this.setState({showModal: false});
      }
    });
  }

  componentWillUnmount() {
    document.body.removeEventListener('keydown', this.keyDownHandler);
    this.unlisten();
  }

  updatePageNotes = (pageId, notes) => {
    FirebaseStore.updatePageNotes(pageId, notes);
  }

  switchTopPageOpenStatus = (event) => {
    this.setState(prevState => {
      return {topPageIsOpen: !prevState.topPageIsOpen};
    });
  }

  switchFilterStatus = (type) => {
    if (type === 'code') {
      this.setState(prevState => {
        return {codeFilterOn: !prevState.codeFilterOn};
      });
    } else if (type === 'notes') {
      this.setState(prevState => {
        return {notesFilterOn: !prevState.notesFilterOn};
      });
    } else if (type === 'uncat') {
      this.setState(prevState => {
        return {unCategorizedFilterOn: !prevState.unCategorizedFilterOn};
      });
    }
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
    this.setState({numTopPageToDisplay: num, topPageIsOpen: true});
  }

  windowSizeChangeHandler = (event) => {
    // console.log('Window Width: ' + window.innerWidth);
    this.setState({windowSize: window.innerWidth});
  }

  deletePageHandler = (event, id) => {
    FirebaseStore.deleteAPageFromCountList(id);
  }

  deletePieceHandler = (event, id, type) => {
    console.log("To delete piece with id: " + id);
    FirebaseStore.deleteAPieceWithId(id);
  }

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

  render () {
    const { task } = this.props;

    /* Top pages */
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
        updatePageNotes={this.updatePageNotes}
        deletePage={this.deletePageHandler}
        displayNumber={this.state.numTopPageToDisplay}
        switchDisplayNum={this.changeTopPageDisplayNumberTo}/>
    );




    /* Pieces */
    let piecesList = [];
    for (let pKey in task.pieces) {
      piecesList.push({
        ...task.pieces[pKey],
        status: true,
        id: pKey
      });
    }

    const { codeFilterOn, notesFilterOn, unCategorizedFilterOn } = this.state;
    let filteredPiecesAccordingToFilterStatus = piecesList.filter(p => {
      let codeQualified = true;
      let notesQualified = true;
      let uncategorizedQualified = true;

      if (codeFilterOn) {   // filtering code

        if (p.codeSnippetHTMLs !== undefined) {
          codeQualified = true;
        } else {
          codeQualified = false;
          let htmls = p.htmls;
          for (let html of htmls) {
            if (html.indexOf('prettyprint') !== -1
            || ((html.indexOf('<code') !== -1 && html.indexOf('</code>') !== -1))) {
              codeQualified = true;
              break;
            }
          }
        }
      }

      if (notesFilterOn) {  // filtering notes
        if (p.notes !== undefined && p.notes !== '') {
          notesQualified = true;
        } else {
          notesQualified = false;
        }
      }

      if (unCategorizedFilterOn) {  // filtering for uncategorized ones
        if (p.attitudeList === undefined || Object.keys(p.attitudeList).length === 0) {
          uncategorizedQualified = true;
        } else {
          uncategorizedQualified = false;
        }
      }

      return codeQualified && notesQualified && uncategorizedQualified;
    });

    let unCategorizedCount = piecesList.filter(p => p.attitudeList === undefined || Object.keys(p.attitudeList).length === 0).length;

    let filteredPieces = (
      <SnippetsGroup
        isOpen={this.state.allSnippetSIsOpen}
        options={task.options}
        pieces={task.pieces}
        codeFilterOn={codeFilterOn}
        notesFilterOn={notesFilterOn}
        unCategorizedFilterOn={unCategorizedFilterOn}
        requirements={task.requirements}
        piecesList={filteredPiecesAccordingToFilterStatus}
        specificPieceId={this.state.specificPieceId}
        makeInteractionBox={this.makeInteractionbox}
        deleteSnippet={this.deletePieceHandler}
        incrementSelectedSnippetNumber={this.props.incrementSelectedSnippetNumber}
        decrementSelectedSnippetNumber={this.props.decrementSelectedSnippetNumber}
        />
    );

    
    let piecesListClone = piecesList.map(p => JSON.parse(JSON.stringify(p)));   // ==> temporarily disable poece grouping
    piecesListClone = sortBy(piecesListClone, ['codeUseInfo']);
    


    let allPieces = (
      <SnippetsGroup
        isOpen={this.state.allSnippetSIsOpen}
        options={task.options}
        pieces={task.pieces}
        requirements={task.requirements}
        codeFilterOn={codeFilterOn}
        notesFilterOn={notesFilterOn}
        unCategorizedFilterOn={unCategorizedFilterOn}
        // piecesList={newPiecesList}
        piecesList={piecesListClone}
        specificPieceId={this.state.specificPieceId}
        makeInteractionBox={this.makeInteractionbox}
        deleteSnippet={this.deletePieceHandler}
        incrementSelectedSnippetNumber={this.props.incrementSelectedSnippetNumber}
        decrementSelectedSnippetNumber={this.props.decrementSelectedSnippetNumber}
        />
    );



    /* Interaction box */
    let modal = null;
    if (this.state.showModal) {
      // console.log('bringing up interactionbox in collection view');
      let piece = this.props.task.pieces[this.state.modalPieceId];
      // console.log(piece);
      if (piece !== undefined) {
        // console.log('collectionview interaction box');
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
                codeSnippetHTMLs={piece.codeSnippetHTMLs}
                codeSnippetTexts={piece.codeSnippetTexts}
                notes={piece.notes}
                used={piece.used}
              />
            </div>
          </Aux>
        );
      }
    }

    return (
      <Aux>
        <div className={styles.CollectionView}>
            <div className={styles.Main} id="scrollable-content-container">


              <div className={styles.Section}>
                <Aux>
                  <div className={styles.Header}>
                    <div className={styles.HeaderNameContainer}
                        onClick={(event) => this.switchAllSnippetsOpenStatus(event)}
                    >
                      <div className={styles.HeaderName}
                      >
                        <span>Snippets</span>
                      </div>
                      {
                        piecesList.length > 0
                        ? <div
                            className={styles.HeaderCollapseButton}>
                            {
                              this.state.allSnippetSIsOpen
                              ? <FontAwesomeIcon icon={fasAngleDown} />
                              : <FontAwesomeIcon icon={fasAngleRight} />
                            }
                          </div>
                        : null
                      }
                    </div>
                    <div className={styles.FilterNameContainer}>
                      <div>
                        <FontAwesomeIcon icon={fasFilter} className={styles.FilterIcon}/>
                      </div>
                      <div className={styles.SectionFilterContainer}>
                        <div
                          className={[styles.SectionFilterName,
                            (
                              this.state.codeFilterOn === true
                              ? styles.Active
                              : null
                            )
                          ].join(' ')}
                          onClick={() => this.switchFilterStatus('code')}>
                          With Code <FontAwesomeIcon icon={fasCode} />
                        </div>
                      </div>

                      <div className={styles.SectionFilterContainer}>
                        <div
                          className={[styles.SectionFilterName,
                            (
                              this.state.notesFilterOn === true
                              ? styles.Active
                              : null
                            )
                          ].join(' ')}
                          onClick={() => this.switchFilterStatus('notes')}>
                          With Notes <FontAwesomeIcon icon={fasStickyNote} />
                        </div>
                      </div>

                      <div className={styles.SectionFilterContainer}>
                        {
                          unCategorizedCount !== 0
                          ? <div
                              className={[styles.SectionFilterBadge, styles.SectionFilterBadgeDanger].join(' ')}>
                              {unCategorizedCount}
                            </div>
                          : null
                        }
                        <div
                          className={[styles.SectionFilterName,
                            (
                              this.state.unCategorizedFilterOn === true
                              ? styles.Active
                              : null
                            )
                          ].join(' ')}
                          onClick={() => this.switchFilterStatus('uncat')}>
                          Uncategorized <FontAwesomeIcon icon={farQuestionCircle} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Aux>
                {
                  this.state.codeFilterOn || this.state.notesFilterOn || this.state.unCategorizedFilterOn
                  ? filteredPieces
                  : allPieces
                }
              </div>
              {
                this.props.shouldDisplayAllPages
                ? <div className={styles.Section}>
                    {topPages}
                  </div>
                : null
              }
            </div>
        </div>
        {modal}
      </Aux>
    );
  }
}

export default withRouter(CollectionView);
