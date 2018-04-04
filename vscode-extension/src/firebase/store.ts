import * as vscode from 'vscode';
import firebase from './firebase';
import { SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG } from 'constants';

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
                                    useHistory: [{lineIdx, gitInfo, isUsing: true}]
                                });
                                codebasesRef.child(codebaseId).child('entries').child(key).child('usedBy').set(usedBy);
                            } else {
                                for (let result of filtered) {
                                    let useHistory = result.useHistory;
                                    if (useHistory !== undefined && useHistory !== null) {
                                        let filteredUseHistory = useHistory.filter(h => h.lineIdx === lineIdx);
                                        if (filteredUseHistory.length === 0) {
                                            useHistory.push({lineIdx, gitInfo, isUsing: true});
                                            codebasesRef.child(codebaseId).child('entries').child(key).child('usedBy').set(usedBy);
                                        }
                                    }
                                    
                                }
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
            useHistory: [{lineIdx, gitInfo, isUsing: true}]
        }]);
        userEditorIntegrationRef.child('copyPayload').set(null);
    }
};