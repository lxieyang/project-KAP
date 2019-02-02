import React, { Component } from 'react';

import Avatar from '@material-ui/core/Avatar';
import Divider from '@material-ui/core/Divider';
import LinesEllipsis from 'react-lines-ellipsis';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { PencilCircleOutline, DeleteCircleOutline } from 'mdi-material-ui';
import classesInCSS from './Comment.css';

const fakeComments = [
  {
    authorId: 'author-01',
    authorAvatarURL:
      'http://d28fo5khwixgu6.cloudfront.net/blog/wp-content/uploads/2013/01/president-barack-obama-square.png',
    content: `This is a good deal, grab it before it\'s gone. This is a good deal, grab it before it\'s gone.`
  },
  {
    authorId: 'author-02',
    authorAvatarURL:
      'http://barryyeoman.com/wp-content/uploads/2004/04/George-W-Bush-square.jpg',
    content: `This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it.`
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
  state = { anchorEl: null };

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
    const { expanded } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    let compactView = (
      <React.Fragment>
        <div className={classesInCSS.CommentBox}>
          <div className={classesInCSS.CommentListContainer}>
            {fakeComments.map((item, idx) => {
              return (
                <React.Fragment key={idx}>
                  <div className={classesInCSS.CommentItem}>
                    <div>
                      <Avatar
                        aria-label="avatar"
                        style={{
                          width: '24px',
                          height: '24px'
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
                      <div className={classesInCSS.CommentContent}>
                        <LinesEllipsis
                          text={item.content}
                          maxLine={1}
                          ellipsis="..."
                          trimRight
                          basedOn="words"
                        />
                      </div>
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
                        <MoreVertIcon
                          style={{ width: '16px', height: '16px' }}
                        />
                      </IconButton>
                    </div>
                  </div>
                  {/*{idx === fakeComments.length - 1 ? null : (
                    <Divider variant="middle" />
                  )}*/}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </React.Fragment>
    );

    let expandedView = (
      <React.Fragment>
        <div>
          <div>Comment List</div>
          <div>Add/Edit Comment</div>
        </div>
      </React.Fragment>
    );

    return expanded ? expandedView : compactView;
  }
}

export default Comment;
