import React from 'react';

const taskContext = React.createContext({
  currentTaskId: '',
  isDemoTask: true // need to remove when it actually works
});

export default taskContext;
