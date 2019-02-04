import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import LinesEllipsis from 'react-lines-ellipsis';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { PencilCircleOutline, DeleteCircleOutline } from 'mdi-material-ui';
import classesInCSS from './Comment.css';
import moment from 'moment';
import Textarea from 'react-textarea-autosize';

const styles = theme => ({
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: '95%',
    boxSizing: 'border-box'
  }
});

const fakeComments = [
  {
    authorId: 'author-01',
    authorName: 'Barack Obama',
    updateDate: new Date(),
    authorAvatarURL:
      'https://radioviceonline.com/wp-content/uploads/2012/05/square-obama-halo.png',
    content: `This is a good deal, grab it before it\'s gone. This is a good deal, grab it before it\'s gone.`
  },
  {
    authorId: 'author-02',
    authorName: 'George Bush',
    updateDate: new Date(),
    authorAvatarURL:
      'https://www.abc.net.au/radionational/image/7174982-1x1-700x700.jpg',
    content: `This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it.`
  }
];

const options = [
  {
    icon: <PencilCircleOutline style={{ width: '20px', height: '20px' }} />,
    text: 'Edit',
    action: 'edit'
  },
  {
    icon: <DeleteCircleOutline style={{ width: '20px', height: '20px' }} />,
    text: 'Delete',
    action: 'delete'
  }
];

class Comment extends Component {
  state = { anchorEl: null, editCommentValue: '' };

  handleInputChange = event => {
    this.setState({
      editCommentValue: event.target.value
    });
  };

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleAction = action => {
    console.log(action);
    this.handleClose();
  };

  render() {
    const { expanded, classes } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    let CommentList = (
      <div className={classesInCSS.CommentListContainer}>
        {fakeComments.map((item, idx) => {
          return (
            <React.Fragment key={idx}>
              <div
                className={[
                  classesInCSS.CommentItem,
                  expanded
                    ? classesInCSS.CommentItemExpanded
                    : classesInCSS.CommentItemCompact
                ].join(' ')}
              >
                <div>
                  <Avatar
                    aria-label="avatar"
                    style={{
                      width: expanded ? '30px' : '24px',
                      height: expanded ? '30px' : '24px'
                    }}
                    className={classesInCSS.Avatar}
                  >
                    <img
                      src={item.authorAvatarURL}
                      alt={item.authorId}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </Avatar>
                </div>
                <div
                  style={{
                    flex: '1'
                  }}
                >
                  {!expanded ? (
                    <div className={classesInCSS.CommentContentCompact}>
                      <LinesEllipsis
                        text={item.content}
                        maxLine={1}
                        ellipsis="..."
                        trimRight
                        basedOn="words"
                      />
                    </div>
                  ) : (
                    <div className={classesInCSS.CommentContentExpanded}>
                      <div className={classesInCSS.CommentInfoBar}>
                        <span className={classesInCSS.CommentAuthor}>
                          {item.authorName}
                        </span>
                        <span className={classesInCSS.CommentMoment}>
                          {moment(item.updateDate).fromNow()}
                        </span>
                      </div>
                      <div className={classesInCSS.CommentContent}>
                        {item.content}
                      </div>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    flexBasis: '28px',
                    marginLeft: 'auto',
                    order: '3',
                    paddingTop: '3px'
                  }}
                >
                  <Menu
                    id="long-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={this.handleClose}
                    style={{ padding: '2px' }}
                    PaperProps={{
                      style: {
                        maxHeight: 24 * 4.5,
                        width: 70
                      }
                    }}
                  >
                    {options.map(option => (
                      <MenuItem
                        key={option.text}
                        selected={false}
                        onClick={() => this.handleAction(option.action)}
                        style={{
                          padding: '4px 4px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: '0.8'
                        }}
                      >
                        {option.icon} &nbsp; {option.text}
                      </MenuItem>
                    ))}
                  </Menu>
                  <IconButton
                    aria-label="More"
                    aria-owns={open ? 'long-menu' : undefined}
                    aria-haspopup="true"
                    style={{ padding: '6px' }}
                    onClick={this.handleClick}
                  >
                    <MoreVertIcon style={{ width: '16px', height: '16px' }} />
                  </IconButton>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );

    let compactView = (
      <React.Fragment>
        <div className={classesInCSS.CommentBox}>{CommentList}</div>
      </React.Fragment>
    );

    let expandedView = (
      <React.Fragment>
        <div>
          <div className={classesInCSS.CommentBox}>{CommentList}</div>
          <div className={classesInCSS.EditCommentBox}>
            <Textarea
              inputRef={tag => (this.textarea = tag)}
              minRows={3}
              maxRows={6}
              placeholder={'Add a comment'}
              value={this.state.editCommentValue}
              onChange={e => this.handleInputChange(e)}
            />
          </div>
        </div>
      </React.Fragment>
    );

    return expanded ? expandedView : compactView;
  }
}

export default withStyles(styles)(Comment);
