'use babel';

import fs from 'fs';
import path from 'path';
import { messageTypes, getWatchTargets } from 'babel-plugin-watcher';
import { Range } from 'atom';

export default class WatcherSelection {

    textEditor = null;
    target = null;
    highlight = null;
    sendMessage = null;

    constructor(textEditor, sendMessage) {
        this.textEditor = textEditor;
        this.sendMessage = sendMessage;
        const babelOptions = {};
        const babelrc = path.resolve(
            atom.workspace.project.rootDirectories[0].path,
            '.babelrc'
        );
        if (fs.existsSync(babelrc)) {
            babelOptions.extends = babelrc;
        }
        const code = textEditor.buffer.lines.join('\n');
        const { row, column } = textEditor.getCursorBufferPosition();
        this.target = getWatchTargets(code, {
            line: row + 1,
            column: column + 1,
        }, babelOptions);
        this.updateHighlight();
    }

    updateHighlight() {
        const { loc } = this.target.node;
        const range = new Range(
            // Babel lines are 1 based but columns 0 based
            // Atom both are 0 based
            [loc.start.line - 1, loc.start.column],
            [loc.end.line - 1, loc.end.column],
        );
        if (this.highlight) {
            this.highlight.getMarker().setBufferRange(range);
        } else {
            const marker = this.textEditor.markBufferRange(range);
            this.highlight = this.textEditor.decorateMarker(marker, {
                type: 'highlight', class: 'watch-mark-highlight',
            });
        }
    }

    expandRange() {
        if (this.target.parentPath) {
            this.target = this.target.parentPath;
            this.updateHighlight();
        }
    }

    watchSelection() {
        this.sendMessage(messageTypes.WATCH_TARGET, {
            filename: this.textEditor.getPath(),
            target: this.target.node.loc,
        });
    }

}
