import React, { Component } from 'react';
import cx from 'classnames';
import { css } from 'glamor';
import { node, object, string, number, func } from 'prop-types';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faChevronLeft from '@fortawesome/fontawesome-free-solid/faChevronLeft';
import faChevronRight from '@fortawesome/fontawesome-free-solid/faChevronRight';

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
  transform: 'translateX(100%)',
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
    transform: 'translateX(96%)'
  },
  '& > iframe': {
    pointerEvents: 'none'
  }
});

const toggleButtonClass = css({
  position: 'absolute',
  top: '3px',
  left: '-30px',
  cursor: 'pointer',
  width: '30px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  backgroundColor: 'white',
  color: 'rgb(193, 40, 27)',
  borderRadius: '3px',
  boxShadow: '-1px 1px 8px rgba(0,0,0,.15)',
  // opacity: 0.7,
  ':hover': {
    // opacity: 1,
    backgroundColor: 'rgb(193, 40, 27)',
    color: 'white'
  },
  transition: 'all 0.1s ease-in'
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
      <div>
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
          <div
            className={cx({
              [toggleButtonClass]: true
            })}
            title={`${
              this.state.isMinimized ? 'Open' : 'Hide'
            } ${APP_NAME_SHORT} Panel`}
            // onClick={this.toggleMinimizedStatus}
          >
            <FontAwesomeIcon
              icon={this.state.isMinimized ? faChevronLeft : faChevronRight}
            />
          </div>

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
      </div>
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

  toggleFrame = () => {
    this.setState(prevState => {
      this.props.shrinkBody(prevState.isMinimized);
      return { isMinimized: !prevState.isMinimized };
    });
  };

  static isReady() {
    return typeof window[FRAME_TOGGLE_FUNCTION] !== 'undefined';
  }

  static toggle() {
    if (window[FRAME_TOGGLE_FUNCTION]) {
      window[FRAME_TOGGLE_FUNCTION]();
    }
  }
}

export default Frame;
