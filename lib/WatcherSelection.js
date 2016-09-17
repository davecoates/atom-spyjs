'use babel';

import fs from 'fs';
import path from 'path';
import { messageTypes, getWatchTargets } from 'babel-plugin-spyjs';
import { Range } from 'atom';


function locationToRange(loc) {
    const { start, end } = loc;
    return new Range(
        [start.line, start.column],
        [end.line, end.column],
    );
}

function findFile(dirname, filename) {
    const parts = dirname.split('/');
    while (parts.length) {
        const file = [parts.join('/'), filename].join('/');
        if (fs.existsSync(file)) return file;
        parts.pop();
    }
    return false;
}

export default class WatcherSelection {

    textEditor = null;
    target = null;
    highlight = null;
    sendMessage = null;
    marker = null;

    constructor(textEditor, sendMessage) {
        this.textEditor = textEditor;
        this.sendMessage = sendMessage;
        const babelOptions = {};
        const babelrc = findFile(path.dirname(textEditor.buffer.file.path), '.babelrc');
        if (babelrc) {
            babelOptions.extends = babelrc;
        }
        const code = textEditor.buffer.lines.join('\n');
        const { row, column } = textEditor.getCursorBufferPosition();
        const { watchMatchPath, matches } = getWatchTargets(code, {
            line: row + 1,
            column: column + 1,
        }, babelOptions);
        this.matches = matches;
        this.targetIndex = matches.indexOf(watchMatchPath);
        this.target = this.matches[this.targetIndex];
        this.updateHighlight();
    }

    updateHighlight() {
        const { range: { start, end } } = this.target;
        const range = new Range(
            // Babel lines are 1 based but columns 0 based
            // Atom both are 0 based
            [start.line - 1, start.column],
            [end.line - 1, end.column],
        );
        if (this.highlight) {
            this.highlight.getMarker().setBufferRange(range);
        } else {
            const marker = this.textEditor.markBufferRange(range);
            this.marker = marker;
            this.highlight = this.textEditor.decorateMarker(marker, {
                type: 'highlight', class: 'spyjs-selection',
            });
        }
        this.watchSelection();
    }

    expandRange() {
        const existingRange = locationToRange(this.target.range);
        while (this.targetIndex > 0) {
            this.targetIndex = Math.max(0, this.targetIndex - 1);
            const target = this.matches[this.targetIndex];
            if (target.range) {
                this.target = target;
                if (!existingRange.containsRange(locationToRange(this.target.range))) {
                    this.updateHighlight();
                    return;
                }
            }
        }
    }

    narrowRange() {
        const existingRange = locationToRange(this.target.range);
        const max = this.matches.length - 1;
        while (this.targetIndex < max) {
            this.targetIndex = Math.min(max, this.targetIndex + 1);
            this.target = this.matches[this.targetIndex];
            if (this.target.range) {
                if (!locationToRange(this.target.range).containsRange(existingRange)) {
                    this.updateHighlight();
                    return;
                }
            }
        }
    }

    watchSelection() {
        this.sendMessage(messageTypes.WATCH_TARGET, {
            filename: this.textEditor.getPath(),
            target: this.target.range,
        });
    }

    destroy() {
        this.marker.destroy();
    }

}
