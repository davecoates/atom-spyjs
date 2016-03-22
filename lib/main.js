'use babel'

/*
The following hack clears the require cache of all the paths to the minimap when this file is laoded. It should prevents errors of partial reloading after an update.
*/
import path from 'path'
import WebSocket from 'ws';
import TextEditorState from './TextEditorState';
import CircularJSON from 'circular-json';

import {Emitter, CompositeDisposable} from 'atom'

/**
*/
class Main {

    /**
    * Used only at export time.
    */
    constructor () {
        this.textEditorStateByPath = new Map();
    }

    /**
    * Activates the minimap package.
    */
    activate () {
        console.log('activate');
        this.subscriptionsOfCommands = atom.commands.add('atom-workspace', {
            'pocket-watch:connect': () => {
                console.log('yoo')
                this.toggle()
            },
        })

        this.subscriptions = new CompositeDisposable()
    }

    /**
    * Deactivates the minimap package.
    */
    deactivate () {
        this.subscriptions.dispose()
        this.subscriptions = null
    }

    toggle () {
        console.log('connect yo');
        this.ws = new WebSocket('ws://127.0.0.1:3300');
        this.ws.onopen = () => this.ws.send('HELLO I CONNECTED');
        this.ws.on('message', message => {
            try {
                const {value, info} = CircularJSON.parse(message);
                const {filename} = info;
                if (this.textEditorStateByPath.has(filename)) {
                    this.textEditorStateByPath.get(filename).addOrUpdateWatch(value, info);
                }
            } catch(err) {
                console.error('Failed to decode response as json', message, err);
            }
        });
        this.initSubscriptions();
    }

    /**
    * Registers to the `observeTextEditors` method.
    *
    * @access private
    */
    initSubscriptions () {
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
