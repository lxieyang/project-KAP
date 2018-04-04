import * as firebase from 'firebase';

var config = {
  apiKey: "AIzaSyBM5KfBU6uVRIpBSZ_V-fFO43lwLlU49z8",
  authDomain: "project-kap-dev.firebaseapp.com",
  databaseURL: "https://project-kap-dev.firebaseio.com",
  projectId: "project-kap-dev",
  storageBucket: "project-kap-dev.appspot.com",
  messagingSenderId: "818929642190"
};
firebase.initializeApp(config);

export default firebase;
