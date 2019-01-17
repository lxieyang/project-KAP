import React, { Component } from 'react';
import ReactTooltip from 'react-tooltip';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasPuzzlePiece from '@fortawesome/fontawesome-free-solid/faPuzzlePiece';
import farBookmark from '@fortawesome/fontawesome-free-regular/faBookmark';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import { APP_NAME_SHORT } from '../../../shared/constants';
import Logo from '../../UI/Logo/Logo';
import styles from './SelectTooltipButton.css';

class SelectTooltipButton extends Component {
  state = {
    displayDetailedMenu: false,

    canSubmitTask: false,
    canSubmitOption: false,
    canSubmitRequirement: false,
    shouldDisplaySelectInteraction: false
  };

  // collectButtonClickHandler = btnType => {
  //   const { selectedText, addPiece, clip } = this.props;
  //   if (btnType === 'task') {
  //     // console.log('task option clicked');
  //     FirebaseStore.addTaskFromSearchTerm(selectedText);
  //     this.setState({ canSubmitTask: true });
  //     if (clip !== undefined) {
  //       setTimeout(() => {
  //         clip();
  //       }, 900);
  //     }
  //   } else if (btnType === 'option') {
  //     // console.log('add option clicked');
  //     FirebaseStore.addAnOptionForCurrentTask(selectedText);
  //     this.setState({ canSubmitOption: true });
  //     if (clip !== undefined) {
  //       setTimeout(() => {
  //         clip();
  //       }, 900);
  //     }
  //   } else if (btnType === 'requirement') {
  //     FirebaseStore.addARequirementForCurrentTask(selectedText);
  //     this.setState({ canSubmitRequirement: true });
  //     if (clip !== undefined) {
  //       setTimeout(() => {
  //         clip();
  //       }, 900);
  //     }
  //   } else if (btnType === 'snippet') {
  //     if (addPiece !== undefined) {
  //       setTimeout(() => {
  //         addPiece();
  //       }, 10);
  //     }
  //   }
  // };

  mouseEnterTooltipButton = () => {
    this.tooltipButtonHoverTimeout = setTimeout(() => {
      this.setState({ displayDetailedMenu: true });
    }, 600);
  };

  mouseLeaveTooltipButton = () => {
    clearTimeout(this.tooltipButtonHoverTimeout);
  };

  mouseEnterDetailedMenu = () => {
    clearTimeout(this.detailedMenuHoverTimeout);
  };

  mouseLeaveDetailedMenu = () => {
    this.detailedMenuHoverTimeout = setTimeout(() => {
      this.setState({ displayDetailedMenu: false });
    }, 600);
  };

  render() {
    return (
      <React.Fragment>
        <div className={styles.TooltipButtonContainer}>
          <div
            className={styles.TooltipButton}
            onMouseEnter={e => this.mouseEnterTooltipButton()}
            onMouseLeave={e => this.mouseLeaveTooltipButton()}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon
                icon={fasBookmark}
                style={{ marginRight: '5px' }}
              />
              <div
                style={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span>Save to</span>
                <Logo size={'18px'} style={{ marginLeft: '5px' }} />
              </div>
            </div>
          </div>
          {this.state.displayDetailedMenu ? (
            <div
              className={styles.TooltipButtonDetailedMenu}
              onMouseEnter={e => this.mouseEnterDetailedMenu()}
              onMouseLeave={e => this.mouseLeaveDetailedMenu()}
            >
              <div className={styles.DetailedMenuItem}>
                <a
                  data-tip
                  data-for="add_pc"
                  // onClick={() => this.switchPopoverOpenStatus(false)}
                  className={styles.DetailedMenuItemIcon}
                  style={{ backgroundColor: 'rgb(193, 40, 27)' }}
                >
                  <FontAwesomeIcon icon={fasBookmark} />
                </a>
                <ReactTooltip
                  id="add_pc"
                  type="dark"
                  effect="solid"
                  place={'bottom'}
                  // globalEventOff="click"
                  className={styles.TooltipContainer}
                >
                  Snippet
                </ReactTooltip>
              </div>
              <div className={styles.DetailedMenuItem}>
                <a
                  data-tip
                  data-for="add_op"
                  // onClick={() => this.switchPopoverOpenStatus(false)}
                  className={styles.DetailedMenuItemIcon}
                  style={{ backgroundColor: 'rgb(232, 173, 84)' }}
                >
                  <FontAwesomeIcon icon={fasListUl} />
                </a>
                <ReactTooltip
                  id="add_op"
                  type="dark"
                  effect="solid"
                  place={'bottom'}
                  // globalEventOff="click"
                  className={styles.TooltipContainer}
                >
                  Option
                </ReactTooltip>
              </div>
              <div className={styles.DetailedMenuItem}>
                <a
                  data-tip
                  data-for="add_rq"
                  // onClick={() => this.switchPopoverOpenStatus(false)}
                  className={styles.DetailedMenuItemIcon}
                  style={{ backgroundColor: 'rgb(73, 132, 233)' }}
                >
                  <FontAwesomeIcon icon={fasFlagCheckered} />
                </a>
                <ReactTooltip
                  id="add_rq"
                  type="dark"
                  effect="solid"
                  place={'bottom'}
                  // globalEventOff="click"
                  className={styles.TooltipContainer}
                >
                  Criterion
                </ReactTooltip>
              </div>
            </div>
          ) : null}
        </div>
      </React.Fragment>
    );
  }
}

export default SelectTooltipButton;

// <div className={styles.SelectInteractionContainer}>
//   <div className={styles.TitleContainer}>
//     <div className={styles.Title}>
//       <div className={styles.LogoContainer}>
//         <Logo size="20px" />
//       </div>{' '}
//       &nbsp; Collect as:
//     </div>
//   </div>
//   <div className={styles.ButtonContainer}>
//     {/* Task Button begins */}
//     <div
//       className={styles.Button}
//       style={{ width: '42px' }}
//       onClick={event => this.collectButtonClickHandler('task')}
//     >
//       <div>
//         <div
//           className={[
//             styles.ButtonContentWrapper,
//             this.state.canSubmitTask ? styles.ButtonTextDisappear : null
//           ].join(' ')}
//         >
//           <div className={styles.ButtonIconWrapper}>
//             <FontAwesomeIcon
//               icon={fasBriefcase}
//               className={styles.ButtonIcon}
//             />
//           </div>
//           <div className={styles.ButtonText}>New Task</div>
//         </div>
//       </div>
//       <div className={styles.CheckmarkContainer}>
//         <div
//           className={[
//             styles.AddedSomething,
//             this.state.canSubmitTask ? null : styles.TextAppear
//           ].join(' ')}
//         >
//           Started New Task
//         </div>
//       </div>
//     </div>

//     {/* Option Button begins */}
//     <div
//       className={styles.Button}
//       style={{ width: '42px' }}
//       onClick={event => this.collectButtonClickHandler('option')}
//     >
//       <div className={styles.ButtonOption}>
//         <div
//           className={[
//             styles.ButtonContentWrapper,
//             this.state.canSubmitOption ? styles.ButtonTextDisappear : null
//           ].join(' ')}
//         >
//           <div className={styles.ButtonIconWrapper}>
//             <FontAwesomeIcon
//               icon={fasListUl}
//               className={styles.ButtonIcon}
//             />
//           </div>
//           <div className={styles.ButtonText}>Option</div>
//         </div>
//         <div className={styles.CheckmarkContainer}>
//           <div
//             className={[
//               styles.AddedSomething,
//               this.state.canSubmitOption ? null : styles.TextAppear
//             ].join(' ')}
//           >
//             Added Option
//           </div>
//         </div>
//       </div>
//     </div>

//     {/*
//       Criterion Button begins
//       */}
//     <div
//       className={styles.Button}
//       style={{ width: '42px' }}
//       onClick={event => this.collectButtonClickHandler('requirement')}
//     >
//       <div className={styles.ButtonRequirement}>
//         <div
//           className={[
//             styles.ButtonContentWrapper,
//             this.state.canSubmitRequirement
//               ? styles.ButtonTextDisappear
//               : null
//           ].join(' ')}
//         >
//           <div className={styles.ButtonIconWrapper}>
//             <FontAwesomeIcon
//               icon={fasFlagCheckered}
//               className={styles.ButtonIcon}
//             />
//           </div>
//           <div className={styles.ButtonText}>Criterion</div>
//         </div>
//       </div>
//       <div className={styles.CheckmarkContainer}>
//         <div
//           className={[
//             styles.AddedSomething,
//             this.state.canSubmitRequirement ? null : styles.TextAppear
//           ].join(' ')}
//         >
//           Added Criterion
//         </div>
//       </div>
//     </div>

//     {/*
//       Snippet Button begins
//       */}
//     <div
//       className={styles.Button}
//       style={{ width: '42px' }}
//       onClick={event => this.collectButtonClickHandler('snippet')}
//     >
//       <div>
//         <div className={[styles.ButtonContentWrapper].join(' ')}>
//           <div className={styles.ButtonIconWrapper}>
//             <FontAwesomeIcon
//               icon={fasPuzzlePiece}
//               className={styles.ButtonIcon}
//             />
//           </div>
//           <div className={styles.ButtonText}>Snippet</div>
//         </div>
//       </div>
//     </div>
//     {/*
//       End of snippet button
//       */}
//   </div>
// </div>
