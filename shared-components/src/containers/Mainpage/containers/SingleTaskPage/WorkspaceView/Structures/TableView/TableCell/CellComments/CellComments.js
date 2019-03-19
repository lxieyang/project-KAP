import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import Textarea from 'react-textarea-autosize';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';
import CellCommentItem from './CellCommentItem/CellCommentItem';
import classesInCSS from './CellComments.css';

const styles = theme => ({
  button: {
    marginTop: 0,
    marginBottom: 0,
    marginRight: 8,
    padding: '1px 4px 1px 4px',
    fontSize: 12
  }
});

const ActionButton = withStyles({
  root: {
    minWidth: '0',
    padding: '0px 4px'
  },
  label: {
    textTransform: 'capitalize'
  }
})(Button);

class CellComments extends Component {
  state = {
    editCommentValue: ''
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
  }

  // also allow Enter to submit
  keyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.saveEditClickedHandler();
    }
  }

  handleInputChange = event => {
    this.setState({
      editCommentValue: event.target.value
    });
  };

  saveEditClickedHandler = () => {
    let comment = this.state.editCommentValue;
    if (comment !== '' && comment) {
      FirestoreManager.addCommentToATableCellById(
        this.props.workspaceId,
        this.props.cellId,
        comment
      );
      this.setState({ editCommentValue: '' });
      this.textarea.blur();
    }
  };

  cancelEditClickedHandler = () => {
    this.setState({ editCommentValue: '' });
  };

  render() {
    const {
      comments,
      commentAccess,
      classes,
      workspaceId,
      cellId,
      cellType
    } = this.props;

    let CommentList = (
      <div className={classesInCSS.CommentListContainer}>
        {comments.map((item, idx) => {
          // return <div key={idx}>{item.content}</div>;
          return (
            <CellCommentItem
              key={idx}
              item={item}
              idx={idx}
              workspaceId={workspaceId}
              cellId={cellId}
              cellType={cellType}
              expanded={true}
            />
          );
        })}
      </div>
    );

    return (
      <React.Fragment>
        <div>
          <div className={classesInCSS.CommentBox}>{CommentList}</div>
          {commentAccess ? (
            <div className={classesInCSS.EditCommentBox}>
              <div className={classesInCSS.TextAreaContainer}>
                <Textarea
                  inputRef={tag => (this.textarea = tag)}
                  minRows={1}
                  maxRows={3}
                  placeholder={'Add a comment'}
                  value={this.state.editCommentValue}
                  onKeyDown={this.keyPress}
                  onMouseEnter={e => {
                    e.target.focus();
                  }}
                  onChange={e => this.handleInputChange(e)}
                  className={classesInCSS.Textarea}
                />
              </div>
              {this.state.editCommentValue !== null &&
                this.state.editCommentValue !== '' && (
                  <div className={classesInCSS.TextareaActionBar}>
                    <ActionButton
                      color="primary"
                      className={classes.button}
                      onClick={() => this.saveEditClickedHandler()}
                    >
                      Save
                    </ActionButton>

                    {/* // Niki doesn't want this, says it's confusing
                <ActionButton
                  color="secondary"
                  className={classes.button}
                  onClick={() => this.cancelEditClickedHandler()}
                >
                  Cancel
                </ActionButton>
                */}
                  </div>
                )}
            </div>
          ) : null}
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(CellComments);
