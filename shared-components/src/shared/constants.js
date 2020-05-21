export const APP_NAME_LONG = 'Knowledge Accelerator for Programming';
export const APP_NAME_SHORT = 'Unakite';
export const APP_WEBSITE = 'https://lxieyang.github.io/project-KAP/unakite/';

export const DEFAULT_SETTINGS = {
  shouldOverrideNewtab: false,
  shouldDisplayAllPages: false,
  shouldShowSelector: false,
  taskOngoing: true
};

export const showoffSurveyUrl =
  'https://oberlin.qualtrics.com/jfe/form/SV_eFqJnCBcw4AO0zb?Source=';

export const projectIntroPage =
  'https://lxieyang.github.io/project-KAP/unakite/';

// https://stackoverflow.com/questions/10282939/how-to-get-favicons-url-from-a-generic-webpage-in-javascript
export const GET_FAVICON_URL_PREFIX =
  'https://plus.google.com/_/favicon?domain_url=';
export const SNIPPET_TYPE = {
  SELECTION: 1,
  LASSO: 2,
  POST_SNAPSHOT: 3,
  PIECE_GROUP: 4,
  COPIED_PIECE: 5
};

export const credibleDomainsInitial = [
  'stackoverflow.com',
  'developer.mozilla.org',
  'www.w3schools.in',
  'www.geeksforgeeks.org',
  'www.quora.com',
  'azure.microsoft.com',
  'cloud.google.com',
  'medium.com'
];

// https://insights.stackoverflow.com/survey/2019#technology-_-programming-scripting-and-markup-languages
export const supportedLanguages = [
  {
    id: 'js',
    name: 'JavaScript',
    detectors: [
      'javascript',
      'ecmascript',
      'js',
      'es5',
      'es6',
      'es7',
      'console.log',
      'settimeout'
    ]
  },
  { id: 'html', name: 'HTML', detectors: ['html', 'html5', 'div'] },
  { id: 'css', name: 'CSS', detectors: ['css', 'css2', 'css3', 'color:'] },
  // { id: 'sql', name: 'SQL', detectors: ['sql'] },
  {
    id: 'python',
    name: 'Python',
    detectors: ['python', 'py'],
    versionDetectors: ['python']
  },
  {
    id: 'java',
    name: 'Java',
    detectors: ['java', 'system.out.println'],
    versionDetectors: ['java']
  }
];

// https://insights.stackoverflow.com/survey/2019#technology-_-web-frameworks
export const supportedWebFrameworks = [
  {
    id: 'jquery',
    name: 'jQuery',
    detectors: ['jquery', /\$/],
    versionDetectors: ['jquery']
  },
  {
    id: 'angular',
    name: 'Angular',
    detectors: ['angular', ' ng'],
    versionDetectors: ['angular']
  },
  {
    id: 'react',
    name: 'React.js',
    detectors: ['react', 'useState', 'useEffect', 'componentDidMount'],
    versionDetectors: ['react']
  },
  { id: 'asp.net', name: 'ASP.NET', detectors: ['asp', '.net'] },
  { id: 'express', name: 'Express', detectors: ['express'] },
  {
    id: 'vue',
    name: 'Vue.js',
    detectors: ['vue'],
    versionDetectors: ['vue']
  }
];

// https://insights.stackoverflow.com/survey/2019#technology-_-other-frameworks-libraries-and-tools
export const supportedOtherFrameworksLibrariesTools = [
  { id: 'nodejs', name: 'Node.js', detectors: ['node', 'node.js', 'nodejs'] },
  { id: '.net', name: '.NET', detectors: ['.net'] },
  { id: 'pandas', name: 'Pandas', detectors: ['pandas'] },
  {
    id: 'reactnative',
    name: 'React Native',
    detectors: ['react native', 'react-native', 'reactnative']
  },
  {
    id: 'tensorflow',
    name: 'Tensorflow',
    detectors: ['tf', 'tensorflow', 'tensorflow.js'],
    versionDetectors: ['tensorflow']
  },
  {
    id: 'numpy',
    name: 'Numpy',
    detectors: ['numpy', 'np', 'ndarray'],
    versionDetectors: ['numpy']
  }
];

// https://insights.stackoverflow.com/survey/2019#technology-_-platforms
export const supportedPlatforms = [
  { id: 'linux', name: 'Linux', detectors: ['ubuntu', 'linux', 'debian'] },
  {
    id: 'windows',
    name: 'Windows',
    detectors: [
      'windows',
      'windows xp',
      'windows vista',
      'windows 7',
      'windows 10'
    ]
  },
  { id: 'docker', name: 'Docker', detectors: ['docker'] },
  { id: 'android', name: 'Android', detectors: ['android', 'android studio'] },
  { id: 'mac', name: 'macOS', detectors: ['mac', 'macos', 'mac os', 'osx'] }
];

export const versionRegex = /\d+(\.\d+){0,2}/;
