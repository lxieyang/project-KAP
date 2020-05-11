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
  addSelectedUrl: () => {},
  setSelectedUrls: () => {},
  clearSelectedUrls: () => {},
  selectedQueries: [],
  addSelectedQuery: () => {},
  selectedSnippets: [],
  addSelectedSnippet: () => {},
  removeSelectedSnippet: () => {},
  setSelectedSnippets: () => {},
  clearSelectedSnippets: () => {},
  cellColors: {},
  setCellColors: () => {},
  selectedCells: [],
  addSelectedCell: () => {},
  removeSelectedCell: () => {},
  setSelectedCells: () => {},
  clearSelectedCells: () => {},
  otherOptions: [],
  addToOtherOptions: () => {},
  currentTaskView: 'default', // 'default', 'context', 'trustworthiness', 'thoroughness',
  setCurrentTaskView: () => {},
  activeSections: [],
  setActiveSections: () => {},
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
