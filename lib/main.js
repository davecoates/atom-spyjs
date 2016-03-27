'use babel';

import WebSocket from 'ws';
import TextEditorState from './TextEditorState';
import CircularJSON from 'circular-json';
import WatcherSelection from './WatcherSelection';
import { messageTypes } from 'babel-plugin-watcher';

import { CompositeDisposable } from 'atom';

/**
*/
class Main {

    /**
    * Used only at export time.
    */
    constructor() {
        this.textEditorStateByPath = new Map();
    }

    /**
    * Activates the minimap package.
    */
    activate() {
        this.subscriptionsOfCommands = atom.commands.add('atom-workspace', {
            'pocket-watch:connect': this.toggle.bind(this),
            'pocket-watch:watchFile': this.watchFile.bind(this),
        });

        this.subscriptions = new CompositeDisposable();
    }

    /**
    * Deactivates the minimap package.
    */
    deactivate() {
        this.subscriptions.dispose();
        this.subscriptions = null;
    }

    toggle() {
        console.log('connect yo');
        this.ws = new WebSocket('ws://127.0.0.1:3300');
        this.ws.onopen = () => this.ws.send('HELLO I CONNECTED');

        this.ws.on('message', message => {
            try {
                const { messageType, payload } = CircularJSON.parse(message);
                if (messageType === messageTypes.VALUE_UPDATE) {
                    const {value, info} = payload;
                    const {filename} = info;
                    if (this.textEditorStateByPath.has(filename)) {
                        this.textEditorStateByPath.get(filename).addOrUpdateWatch(value, info);
                    }
                }
            } catch(err) {
                console.error('Failed to decode response as json', message, err);
            }
        });
        this.initSubscriptions();
    }

    sendMessage = (type, payload) => {
        this.ws.send(JSON.stringify({
            messageType: type,
            payload,
        }));
    }

    watchFile() {
        const activeEditor = atom.workspace.getActiveTextEditor();
        const watcher = new WatcherSelection(activeEditor, this.sendMessage);
        this.watcher = watcher;
        window.watcher = watcher;
    }

    /**
    * Registers to the `observeTextEditors` method.
    *
    * @access private
    */
    initSubscriptions() {
        this.subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
            this.textEditorStateByPath.set(textEditor.getPath(), new TextEditorState(textEditor));
        }));
    }
}

/**
* The exposed instance of the `Main` class.
*
* @access private
*/
export default new Main()
