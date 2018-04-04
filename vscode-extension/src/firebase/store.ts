import * as vscode from 'vscode';
import firebase from './firebase';

// Get a reference to the database service
export let database = firebase.database();
export let codebasesRef = database.ref('codebases');
export let codebaseId: string = "";
export let setCodebaseId = (id) => {
    codebaseId = id;
};
export let userId = vscode.workspace.getConfiguration().userId;


