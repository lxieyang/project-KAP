import React from 'react';

const taskContext = React.createContext({
  currentTaskId: '',
  isDemoTask: true, // need to remove when it actually works,
  selectedDomains: [],
  addSelectedDomain: () => {},
  selectedUrls: [],
  assSelectedUrl: () => {},
  selectedQueries: [],
  assSelectedQuery: () => {},
  currentTaskView: 'default', // 'default', 'context', 'trustworthiness', 'thoroughness',
  setCurrentTaskView: () => {},
  honestSignalsInTable: {
    sourceDomain: true,
    sourcePage: false,
    sourcePageDuration: false,
    updateTime: true,
    captureTime: false,
    popularity: true,
    versions: false,
    searchQuery: false,
    code: false
  },
  setHonestSignalsInTable: () => {}
});

export default taskContext;
