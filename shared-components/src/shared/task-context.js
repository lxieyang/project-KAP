import React from 'react';

const taskContext = React.createContext({
  currentTaskId: '',
  isDemoTask: true, // need to remove when it actually works,
  selectedDomains: [],
  addSelectedDomain: () => {},
  selectedUrls: [],
  assSelectedUrl: () => {},
  selectedQueries: [],
  assSelectedQuery: () => {}
});

export default taskContext;