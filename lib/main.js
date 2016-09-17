'use babel';

import { buildMirror } from 'value-mirror';
import TextEditorState from './TextEditorState';
import WatcherSelection from './WatcherSelection';
import WebSocketMirrorClient from 'value-mirror/lib/wsMirrorClient';
import { messageTypes } from 'babel-plugin-spyjs';

import { CompositeDisposable } from 'atom';
import { React, ReactDOM } from 'react-for-atom';
import StatusBarTile from './StatusBarTile';


/**
*/
class Main {

    /**
    * Used only at export time.
    */
    constructor() {
        this.textEditorStateByPath = new Map();
    }

    renderStatusBar() {
        const props = {
            connectionStatus: this.connectionStatus,
            onConnect: this.connect,
        };
        ReactDOM.render(<StatusBarTile {...props}/>, this.statusBarTileEl);
    }

    consumeStatusBar = (statusBar) => {
        const el = document.createElement('div');
        el.classList.add('inline-block');
        this.statusBarTileEl = el;
        this.statusBarTile = statusBar.addLeftTile({
            item: el,
            priority: 100,
        });
        this.renderStatusBar();
    };


    /**
    * Activates the minimap package.
    */
    activate() {
        this.subscriptionsOfCommands = atom.commands.add('atom-workspace', {
            'spyjs:connect': this.connect,
            'spyjs:add-spy': this.addWatch,
            'spyjs:clear-file-spies': this.clearFileWatches,
        });
        this.subscriptions = new CompositeDisposable();

        atom.commands.add('atom-text-editor', {
            'spyjs:widen-selection': this.widenSelection.bind(this),
            'spyjs:narrow-selection': this.narrowSelection.bind(this),
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
        if (this.statusBarTile) {
            this.statusBarTile.destroy();
            this.statusBarTile = null;
        }
    }

    connectionStatus = { connected: false };

    updateConnectionStatus = (obj) => {
        this.connectionStatus = {
            ...this.connectionStatus,
            ...obj,
        };
        this.renderStatusBar();
    };

    connect = () => {
        this.mirrorClient = new WebSocketMirrorClient('127.0.0.1', 3300);
        this.ws = this.mirrorClient.ws;
        this.mirrorClient.onOpen(() => {
            this.updateConnectionStatus({ connected: true });
        });
        this.mirrorClient.onClose(() => {
            this.updateConnectionStatus({ connected: false });
        });
        this.mirrorClient.onMessage(message => {
            try {
                const { messageType, payload } = message;
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
        });
        this.initSubscriptions();
    }

    sendMessage = (type, payload) => {
        this.ws.send(JSON.stringify({
            messageType: type,
            payload,
        }));
    };

    addWatch = () => {
        const activeEditor = atom.workspace.getActiveTextEditor();
        const watcher = new WatcherSelection(activeEditor, this.sendMessage);
        this.watcher = watcher;
    }

    clearFileWatches = () => {
        const activeEditor = atom.workspace.getActiveTextEditor();
        const filename = activeEditor.getPath();
        this.sendMessage(messageTypes.CLEAR_FILE_WATCHES, {
            filename,
        });
        if (this.watcher) {
            this.watcher.destroy();
        }
        if (this.textEditorStateByPath.has(filename)) {
            this.textEditorStateByPath.get(filename).reset();
        }
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
