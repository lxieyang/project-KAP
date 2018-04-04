import * as vscode from 'vscode';
import firebase from './firebase';
var _ = require('lodash');

// Get a reference to the database service
export let database = firebase.database();
export let codebasesRef = database.ref('codebases');
export let codebaseId: string = "";
export let setCodebaseId = (id) => {
    codebaseId = id;
};
export let userId = vscode.workspace.getConfiguration().userId;
export let userEditorIntegrationRef = database.ref('users').child(userId).child('editorSupport');



export const addNewEntryInCodebase = async (payload, filePath, lineIdx, gitInfo) => {
    const { title, content, userId, taskId, pieceId } = payload;
    let shouldAddToEntriesAsNew = true;
    let existingEntries = await codebasesRef.child(codebaseId).child('entries').once('value');

    if (existingEntries.val() !== null) {
        existingEntries.forEach((snap) => {
            let map = snap.val();
            let key = snap.key;
            if (map.title === title 
                && map.content === content 
                && map.userId === userId
                && map.taskId === taskId
                && map.pieceId === pieceId) {
                    shouldAddToEntriesAsNew = false;
                    // add in to usedBy
                    codebasesRef.child(codebaseId).child('entries').child(key).child('usedBy').once('value', (snapshot) => {
                        let usedBy = snapshot.val();
                        if (usedBy !== null) {
                            let filtered = usedBy.filter(useEntry => useEntry.filePath === filePath);
                            if (filtered.length === 0) {
                                usedBy.push({
                                    filePath: filePath,
                                    isUsing: true,
                                    useHistory: [{gitInfo, isUsing: true, lineIndices: [lineIdx]}]
                                });
                                codebasesRef.child(codebaseId).child('entries').child(key).child('usedBy').set(usedBy);
                            }
                        }
                    });
            }
        });
    }

    if (shouldAddToEntriesAsNew) {
        let newEntry = codebasesRef.child(codebaseId).child('entries').push();
        await newEntry.set({...payload, type: 'COPIED'});
        codebasesRef.child(codebaseId).child('entries').child(newEntry.key).child('usedBy').set([{
            filePath: filePath,
            isUsing: true,
            useHistory: [{gitInfo, isUsing: true, lineIndices: [lineIdx]}]
        }]);
        userEditorIntegrationRef.child('copyPayload').set(null);
    }
};


export const updateLineIndices = async (mappings, filePath, gitInfo) => {
    let reconstuctedEntries = {};
    for (let entry of mappings) {
        let usedBy = entry.usedBy;
        if (usedBy !== undefined) {
            let useIndex = 0;
            for (; useIndex < usedBy.length; useIndex++) {
                let use = usedBy[useIndex];
                if (use.filePath === filePath) {
                    let useHistory = use.useHistory;
                    if (useHistory.newLineIndices === undefined || useHistory.newLineIndices === null || useHistory.newLineIndices.length === 0) {
                        // not using any more
                        // console.log('NOT USING ANY MORE');
                        if (_.last(useHistory).gitInfo.sha === gitInfo.sha) {
                            // directly update the last element
                            useHistory[useHistory.length - 1].isUsing = false;
                            useHistory[useHistory.length - 1].lineIndices = [];
                        }                     
                    } else {
                        if (_.isEqual(_.sortBy(_.last(useHistory).lineIndices), _.sortBy(useHistory.newLineIndices))) {
                            // no need to update
                            // console.log('NO NEED TO UPDATE');
                        } else {
                            if (_.last(useHistory).gitInfo.sha === gitInfo.sha) {
                                // directly update the last element
                                // console.log('DIRECTLY UPDATE THE LAST ELEMENT');
                                useHistory[useHistory.length - 1].isUsing = true;
                                useHistory[useHistory.length - 1].lineIndices = _.sortBy(useHistory.newLineIndices);
                            } else {
                                // push a new entry in useHistory
                                // console.log('PUSH IN A NEW ENTRY');
                                useHistory.push({
                                    gitInfo, 
                                    isUsing: true, lineIndices: _.sortBy(useHistory.newLineIndices)
                                });
                            }
                        }
                    }
                    useHistory.newLineIndices = null;
                }
            }
        }
        reconstuctedEntries[entry.entryId] = {...entry, entryId: null};
    }
    codebasesRef.child(codebaseId).child('entries').set(reconstuctedEntries);
};