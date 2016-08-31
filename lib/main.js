'use babel';

import { buildMirror } from 'value-mirror';
import TextEditorState from './TextEditorState';
import WatcherSelection from './WatcherSelection';
import WebSocketMirrorClient from 'value-mirror/lib/wsMirrorClient';
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

        atom.commands.add('atom-text-editor', {
            'pocket-watch:widen-selection': this.widenSelection.bind(this),
            'pocket-watch:narrow-selection': this.narrowSelection.bind(this),
        });
    }

    widenSelection() {
        if (this.watcher) {
            this.watcher.expandRange();
        }
    }

    narrowSelection() {
        if (this.watcher) {
            this.watcher.narrowRange();
        }
    }

    /**
    * Deactivates the minimap package.
    */
    deactivate() {
        this.subscriptions.dispose();
        this.subscriptions = null;
    }

    toggle() {
        this.mirrorClient = new WebSocketMirrorClient('127.0.0.1', 3300);
        this.ws = this.mirrorClient.ws;
        const onmessage = this.ws.onmessage;
        this.ws.onmessage = message => {
            onmessage(message);
            try {
                const { messageType, payload } = JSON.parse(message.data);
                if (messageType === messageTypes.VALUE_UPDATE) {
                    const { value, info } = payload;
                    const { filename } = info;
                    if (this.textEditorStateByPath.has(filename)) {
                        this.textEditorStateByPath.get(filename).addOrUpdateWatch(
                            buildMirror(value, this.mirrorClient), info);
                    }
                }
            } catch (err) {
                console.error( // eslint-disable-line
                    'Failed to decode response as json', message, err);
            }
        };
        this.initSubscriptions();
    }

    sendMessage = (type, payload) => {
        this.ws.send(JSON.stringify({
            messageType: type,
            payload,
        }));
    };

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
            this.textEditorStateByPath.set(
                textEditor.getPath(),
                new TextEditorState(textEditor)
            );
        }));
    }
}

/**
* The exposed instance of the `Main` class.
*
* @access private
*/
export default new Main();
