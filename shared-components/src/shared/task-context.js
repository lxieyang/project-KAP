import React from 'react';

const taskContext = React.createContext({
  currentTaskId: '',
  isDemoTask: true, // need to remove when it actually works,
  selectedDomains: [],
  addSelectedDomain: () => {},
  removeSelectedDomain: () => {},
  setSelectedDomains: () => {},
  clearSelectedDomains: () => {},
  selectedUrls: [],
  assSelectedUrl: () => {},
  selectedQueries: [],
  assSelectedQuery: () => {},
  selectedSnippets: [],
  addSelectedSnippet: () => {},
  removeSelectedSnippet: () => {},
  setSelectedSnippets: () => {},
  clearSelectedSnippets: () => {},
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
