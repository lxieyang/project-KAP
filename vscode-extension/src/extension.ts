import * as vscode from 'vscode';
import TextDocumentContentProvider from './TextDocumentContentProvider';
import { open, getLanguageType, prepareCopiedCode, getFileNameWithinWorkspace } from './util';
import * as FirebaseStore from './firebase/store';
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var getRepoInfo = require('git-repo-info');


interface Decoration {
    decorations: vscode.DecorationOptions[];
    payload: any;
}

// interface Mapping {
//     pieceId: string;
//     userId: string;
//     taskId: string;
//     content: string;
//     note: string;
//     existingOptions: Object;
//     originalCodeSnippet: string[];
//     url: string;
//     title: string;
//     type: string;
// }

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log("USER ID: " + FirebaseStore.userId);
    
    let mappings = [];
    let activeLanguage: string = "";
    let copiedPayload: any = {};

    // listen for code copies
    FirebaseStore.userEditorIntegrationRef.child('copyPayload').on('value', (snap) => {
        if (snap.val() !== null) {
            copiedPayload = snap.val();
            prepareCopiedCode(context, copiedPayload);
        }
    });

    let handleConfigFile = () => {
        fs.readFile(path.resolve(vscode.workspace.rootPath, 'kap.json'), 'utf8', (error, data) => {
            if (error ) {
                // console.log(error);
                // create such a file
                let newCodebase = FirebaseStore.codebasesRef.push();
                FirebaseStore.setCodebaseId(newCodebase.key);
                let config = {
                    workspaceId: FirebaseStore.codebaseId,
                    timestamp: (new Date()).getTime()
                };
                newCodebase.set({
                    created: config.timestamp,
                    name: vscode.workspace.name !== undefined ? vscode.workspace.name : null,
                    entries: null
                });
    
                fs.writeFile(path.resolve(vscode.workspace.rootPath, 'kap.json'), JSON.stringify(config, null, 2), 'utf8', (err) => {
                    // console.log("WRITE ERROR: " + err);
                });
                context.workspaceState.update('mappings', []).then(response => {
                    // console.log(response);
                    throttledScan();
                });
            } else {
                // console.log(data);
                let config = JSON.parse(data);
                FirebaseStore.setCodebaseId(config.workspaceId);
                // update codebase name
                FirebaseStore.codebasesRef.child(FirebaseStore.codebaseId).child('name').set(vscode.workspace.name !== undefined ? vscode.workspace.name : null);
                syncFromCloud();
            }
        });
    };
    
    let syncFromCloud = () => {
        let maps = [];
        FirebaseStore.codebasesRef.child(FirebaseStore.codebaseId).child('entries').on('value', (snap) => {
            if (snap.val() !== null) {
                snap.forEach((childSnap) => {
                    maps.push({
                        ...childSnap.val(),
                        entryId: childSnap.key
                    });
                    return false;   // https://stackoverflow.com/questions/39845758/argument-of-type-snap-datasnapshot-void-is-not-assignable-to-parameter-o
                });
            }
            
            // update in workspace
            context.workspaceState.update('mappings', maps).then(response => {
                throttledScan();
            });
        });
    };



    let taskToNavigateTo = {
        userId: "",
        taskId: "",
        pieceId: ""
    };
    
    let hoverProvider = {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Hover> {
            // console.log(lastScanResult);
            
            // console.log(position.line + " | " + position.character);
            let range = document.getWordRangeAtPosition(position);
            // console.log("HOVER " + JSON.stringify(range));
            const matchingDecorationAndItem = lastScanResult.map(item => {
                return {
                    item: item,
                    range: item.decorations[0].range
                };
            }).find(pair => pair.range !== null && pair.range.start.line === range.start.line);            

            let result: Thenable<vscode.Hover> = undefined;

            if (matchingDecorationAndItem) {
                let payload = matchingDecorationAndItem.item.payload;
                taskToNavigateTo = {
                    userId: payload.userId,
                    taskId: payload.taskId,
                    pieceId: payload.pieceId
                };

                let hoverMessage = "";

                hoverMessage += `### [${payload.title} ](${payload.url})    \n`;
                hoverMessage += `(${moment(new Date(payload.timestamp)).format("dddd, MMMM Do YYYY, h:mm:ss a")})   \n`;
                hoverMessage += `#### [View Original Task in side Panel](command:extension.openTask)    \n`;
                hoverMessage += `----   \n`;

                hoverMessage += `#### Pasted Code Snippets:   \n`;
                hoverMessage += `\`\`\`${activeLanguage}  \n`;
                hoverMessage += `${payload.content}   `;
                hoverMessage += `\`\`\`   \n`;
                hoverMessage += `----  \n`;


                let existingOptions = payload.existingOptions;
                if (existingOptions !== undefined ) {
                    let requirements = {};
                    payload.existingRequirements.map((rq) => {
                        requirements[rq.id] = {...rq};
                    });

                    hoverMessage += `#### Options & Requirements:   \n`;
                    for (let op of existingOptions.filter(op => op.attitudeRequirementPairs !== null)) {
                        hoverMessage += `- ${op.name}:  \n`;
                        let attitudeRequirementPairs = op.attitudeRequirementPairs;
                        for (let rqKey of Object.keys(attitudeRequirementPairs)) {
                            let attitude = attitudeRequirementPairs[rqKey];
                            let rqName = requirements[rqKey].name;
                            hoverMessage += `> - ${rqName}: ${attitude === 'good' ? '👍' : attitude === 'bad' ? '👎' : '❓'}  \n`;
                        }

                    }
                }
                
                let constructed = new vscode.MarkdownString(hoverMessage);
                constructed.isTrusted = true;

                return Promise.resolve(new vscode.Hover(constructed, document.getWordRangeAtPosition(position)));
            }
            return result;
        }
    };

    let dummy = vscode.languages.registerHoverProvider(['*'], hoverProvider);
    
    
    let lastScanResult: Decoration[] = [];
    let throttleId = undefined;
    let throttledScan = (timeout: number = 500) => {
        if (throttleId) {
            clearTimeout(throttleId);
        }
        throttleId = setTimeout(() => scan(), timeout);
    };

    const scan = () => {
        // console.log("scanning");
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            lastScanResult = [];
            collectEntries(editor, '@@@source', '@@@', lastScanResult);
        }
    };

    const collectEntries = (editor: vscode.TextEditor, identifier: string, endingIdentifier: string,lastScanResult: Decoration[]) => {
        mappings = context.workspaceState.get('mappings', []);
        let currentFilePath = getFileNameWithinWorkspace(vscode.workspace.name, editor.document.fileName);
        let gitInfo = getRepoInfo(path.resolve(vscode.workspace.rootPath, '.git'));

        let max = editor.document.lineCount;
        for (let lineIdx = 0; lineIdx < max; lineIdx++) {
            let lineObject = editor.document.lineAt(lineIdx);
            let line = lineObject.text;
            if (line.indexOf(identifier) !== -1) {
                // console.log("Line: " + lineIdx + " | " + line);
                let decorations: vscode.DecorationOptions[] = [];
                decorations.push({
                    range: new vscode.Range(lineIdx, 0, lineIdx, 0),
                    hoverMessage: ""
                });

                let start = line.indexOf(identifier);
                let end = line.lastIndexOf(endingIdentifier);
                if (start !== -1 && end !== -1) {
                    let lineIdentity = line.substring(start, end).trim();

                    // check copy
                    if (copiedPayload !== null) {
                        const { userId, taskId, pieceId, title, timestamp } = copiedPayload;
                        if (`@@@source: (${userId}) (${taskId}) (${pieceId}) (${timestamp})` === lineIdentity) {
                            FirebaseStore.addNewEntryInCodebase(copiedPayload, currentFilePath, lineIdx, gitInfo);
                        }  
                    }


                    // find mapping
                    if (mappings !== undefined && mappings.length > 0) {
                        for (let entry of mappings) {
                            const { userId, taskId, pieceId, title, timestamp } = entry;
                            // console.log(lineIdentity);
                            if (`@@@source: (${userId}) (${taskId}) (${pieceId}) (${timestamp})` === lineIdentity) {
                                // console.log("pushed");
                                let payload = {
                                    ...entry
                                };
                                lastScanResult.push({
                                    decorations,
                                    payload
                                });
    
                                // update line index
                                let usedBy = entry.usedBy;
                                if (usedBy !== undefined) {
                                    let targetIdx = 0;
                                    for (; targetIdx < usedBy.length; targetIdx++) {
                                        if (usedBy[targetIdx].filePath === currentFilePath) {
                                            let useHistory = usedBy[targetIdx].useHistory;
                                            if (useHistory.newLineIndices === undefined || useHistory.newLineIndices === null) {
                                                useHistory.newLineIndices = [lineIdx];
                                            } else {
                                                useHistory.newLineIndices.push(lineIdx);
                                            }
                                        }
                                    }
                                }
                            }           
                        }
                    }
                    
                }
            }
        }

        // check mappings again before update firebase
        if (mappings !== undefined && mappings.length > 0) {
            FirebaseStore.updateLineIndices(mappings, currentFilePath, gitInfo);
        }
    };

    const updateLanType = () => {
        activeLanguage = getLanguageType();
        // console.log(activeLanguage);
        FirebaseStore.database.ref('editor/languagetype').set(activeLanguage);
    };
    

    let previewUri = vscode.Uri.parse('open-webview://open-webview/http://localhost:3002/');
    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('open-webview', provider);






    /* Change Listeners */
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        // console.log(e);
        throttledScan();
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor) => {
        throttledScan();
        if (Object.keys(copiedPayload).length > 0) {
            prepareCopiedCode(context, copiedPayload);
        }
        updateLanType();
    });

    vscode.workspace.onDidChangeWorkspaceFolders(e => {
        handleConfigFile();
        throttledScan();
        if (Object.keys(copiedPayload).length > 0) {
            prepareCopiedCode(context, copiedPayload);
        }
        updateLanType();
    });

    vscode.workspace.onDidOpenTextDocument(() => {
        lastScanResult = [];
        throttledScan();
        if (Object.keys(copiedPayload).length > 0) {
            prepareCopiedCode(context, copiedPayload);
        }
        updateLanType();
    });

    throttledScan();
    handleConfigFile();

    vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
        // console.log("selection event fired");
        // console.log(e.textEditor.selection);
        if (e.textEditor === vscode.window.activeTextEditor) {
            provider.update(previewUri);
        }
    });








    /* Register Commands */
    let disposable = vscode.commands.registerCommand('extension.openWebview', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'KAP').then((success) => {

        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });

    vscode.commands.registerCommand('extension.openTask', () => {
        // console.log(taskToNavigateTo);
        vscode.commands.executeCommand('extension.openWebview').then(() => {
            FirebaseStore.database.ref('users').child(FirebaseStore.userId).child('editor').child('taskToNavigateTo').set(taskToNavigateTo);
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });    
        // FirebaseStore.database.ref('users').child(FirebaseStore.userId).child('editor').child('taskToNavigateTo').set(taskToNavigateTo);
    });

    vscode.commands.registerCommand('extension.openLink', (link) => {
        // console.log(link);
        open(link);
    });

    // vscode.commands.registerCommand('extension.setUser', (_userId) => {
    //     console.log(userId);
    //     userId = _userId;
    // });

    vscode.commands.registerCommand('extension.copyDetected', (payload) => {
        // console.log(payload);
        copiedPayload = payload;
        prepareCopiedCode(context, payload);
    });







    /* Disposable */
    context.subscriptions.push(disposable, registration, dummy);
}


// this method is called when your extension is deactivated
export function deactivate() {
}