import React, { Component } from 'react';
import cx from 'classnames';
import { css } from 'glamor';
import { node, object, string, number, func } from 'prop-types';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import Logo from '../../../../shared-components/src/components/UI/Logo/Logo';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faChevronLeft from '@fortawesome/fontawesome-free-solid/faChevronLeft';
import faChevronRight from '@fortawesome/fontawesome-free-solid/faChevronRight';
import styles from './frame.css';

const flexContainer = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around'
});

const iframeClass = css({
  border: 'none',
  width: '100%',
  height: '100%',
  background: 'white',
  borderRadius: '3px',
  boxShadow: '-1px 1px 8px rgba(0,0,0,.15)'
});

const containerClass = css({
  position: 'fixed',
  top: '0px',
  right: '0px',
  height: '100%',
  width: '65%',
  maxWidth: '400px',
  padding: '3px',
  boxSizing: 'border-box',
  transform: 'translateX(102%)',
  transition: 'transform .25s cubic-bezier(0, 0, 0.3, 1)',
  zIndex: 10000
});

const containerVisibleClass = css({
  transform: 'translate3d(0,0,0)'
});

const containerMinimizedClass = css({
  cursor: 'pointer',
  transform: 'translateX(98%)',
  ':hover': {
    transform: 'translateX(94%)'
  },
  '& > iframe': {
    pointerEvents: 'none'
  }
});

const toggleButtonClass = css({
  position: 'fixed',
  bottom: '40px',
  right: '30px',
  zIndex: 20000
});

const toggleButtonInnerClass = css({
  position: 'absolute',
  right: '0px',
  bottom: '0px',
  width: '45px',
  height: '35px',
  boxSizing: 'border-box',
  cursor: 'pointer',
  padding: '2px 5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  fontSize: '16px',
  backgroundColor: 'white',
  color: 'rgb(193, 40, 27)',
  borderRadius: '6px',
  boxShadow: '-1px 1px 8px rgba(0,0,0,.2)',
  transition: 'all 0.3s',
  opacity: 0.3,
  ':hover': {
    width: '210px',
    opacity: 1
  }
});

const FRAME_TOGGLE_FUNCTION = 'chromeIframeSheetToggle';

export class Frame extends Component {
  render() {
    const { isVisible, isMinimized } = this.state;
    const {
      url,
      className,
      containerClassName,
      containerStyle,
      iframeClassName,
      iframeStyle,
      children,
      containerChildren
    } = this.props;

    return (
      <React.Fragment>
        <div
          className={cx({
            [toggleButtonClass]: true
          })}
          title={`${
            this.state.isMinimized ? 'Open' : 'Hide'
          } ${APP_NAME_SHORT} sidebar`}
          // onClick={this.toggleMinimizedStatus}
          onClick={this.onFrameClick}
        >
          <div
            className={cx({
              [toggleButtonInnerClass]: true
            })}
            style={{ margin: '5px' }}
          >
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FontAwesomeIcon
                icon={this.state.isMinimized ? faChevronLeft : faChevronRight}
                style={{ marginRight: '5px' }}
              />
              <div style={{ width: '20px' }}>
                <Logo size={'20px'} />
              </div>
              <div style={{ marginLeft: '5px' }}>
                {` ${
                  this.state.isMinimized ? 'Open' : 'Close'
                } ${APP_NAME_SHORT} sidebar`}
              </div>
            </div>
          </div>
        </div>
        <div
          className={cx({
            [containerClass]: true,
            [containerVisibleClass]: isVisible,
            [containerMinimizedClass]: isMinimized,
            [containerClassName]: true
          })}
          style={containerStyle}
          onClick={this.onFrameClick}
        >
          <iframe
            title={'kap-sidebar-iframe'}
            className={cx({
              [iframeClass]: true,
              [iframeClassName]: true
            })}
            style={iframeStyle}
            src={url}
            ref={frame => (this.frame = frame)}
            onLoad={this.onLoad}
          />

          {containerChildren}
        </div>

        {children}
      </React.Fragment>
    );
  }

  state = {
    isVisible: false,
    isMinimized: true // default is minimized
  };

  static defaultProps = {
    url: '',
    delay: 500,
    maskClassName: '',
    maskStyle: {},
    containerClassName: '',
    containerStyle: {},
    iframeClassName: '',
    iframeStyle: {},
    onMount: () => {},
    onUnmount: () => {},
    onLoad: () => {}
  };

  static propTypes = {
    url: string,
    delay: number,
    maskClassName: string,
    maskStyle: object,
    containerClassName: string,
    containerStyle: object,
    iframeClassName: string,
    iframeStyle: object,
    children: node,
    containerChildren: node,
    onMount: func,
    onUnmount: func,
    onLoad: func
  };

  componentDidMount() {
    const { delay, onMount } = this.props;

    window[FRAME_TOGGLE_FUNCTION] = this.toggleFrame;

    onMount({
      mask: this.mask,
      frame: this.frame
    });

    this._visibleRenderTimeout = setTimeout(() => {
      this.setState({
        isVisible: true
      });
    }, delay);
  }

  componentWillUnmount() {
    const { onUnmount } = this.props;

    onUnmount({
      mask: this.mask,
      frame: this.frame
    });

    delete window[FRAME_TOGGLE_FUNCTION];
    clearTimeout(this._visibleRenderTimeout);
  }

  onLoad = () => {
    const { onLoad } = this.props;

    onLoad({
      mask: this.mask,
      frame: this.frame
    });
  };

  toggleMinimizedStatus = e => {
    // e.stopPropagation();
    window[FRAME_TOGGLE_FUNCTION]();
  };

  onMaskClick = () => {
    this.setState({
      isMinimized: true
    });
  };

  onFrameClick = () => {
    // this.setState({
    //   isMinimized: false
    // });

    this.toggleFrame();
  };

  toggleFrame = (to = undefined) => {
    if (to === undefined) {
      this.setState(prevState => {
        this.props.shrinkBody(prevState.isMinimized);
        return { isMinimized: !prevState.isMinimized };
      });
    } else {
      this.props.shrinkBody(!to);
      this.setState({ isMinimized: to });
    }
  };

  static isReady() {
    return typeof window[FRAME_TOGGLE_FUNCTION] !== 'undefined';
  }

  static toggle(to = undefined) {
    if (window[FRAME_TOGGLE_FUNCTION]) {
      window[FRAME_TOGGLE_FUNCTION](to);
    }
  }
}

export default Frame;
