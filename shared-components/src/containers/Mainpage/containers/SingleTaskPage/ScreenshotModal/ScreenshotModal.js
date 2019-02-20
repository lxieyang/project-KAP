import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';

const SCREENSHOT_MODAL_TOGGLE_OPEN = 'screenshotModalToggleOpen';
const SCREENSHOT_MODAL_SET_SOURCE = 'screenshotModalSetSource';

function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`
  };
}

const styles = theme => ({
  paper: {
    position: 'absolute',
    width: '90%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 0,
    outline: 'none'
  }
});

const HighZIndexModal = withStyles({
  root: { zIndex: 999999999 }
})(Modal);

class SimpleModal extends React.Component {
  state = {
    open: false,
    imageDataUrl: null
  };

  componentDidMount() {
    window[SCREENSHOT_MODAL_TOGGLE_OPEN] = this.handleOpen;
    window[SCREENSHOT_MODAL_SET_SOURCE] = this.setImageDataUrl;
  }

  setImageDataUrl = imageDataUrl => {
    this.setState({ imageDataUrl });
  };

  handleOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
    const { classes } = this.props;

    return (
      <div>
        <HighZIndexModal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={this.state.open}
          onClose={this.handleClose}
        >
          <div style={getModalStyle()} className={classes.paper}>
            <img
              src={this.state.imageDataUrl}
              alt="modal"
              style={{ maxWidth: '80%', maxHeight: '80%' }}
            />
          </div>
        </HighZIndexModal>
      </div>
    );
  }

  static toggleModalOpen() {
    if (window[SCREENSHOT_MODAL_TOGGLE_OPEN]) {
      window[SCREENSHOT_MODAL_TOGGLE_OPEN]();
    }
  }

  static setDataSource(imageDataUrl) {
    if (window[SCREENSHOT_MODAL_SET_SOURCE]) {
      window[SCREENSHOT_MODAL_SET_SOURCE](imageDataUrl);
    }
  }
}

// We need an intermediary variable for handling the recursive nesting.
const SimpleModalWrapped = withStyles(styles)(SimpleModal);

export default SimpleModalWrapped;
