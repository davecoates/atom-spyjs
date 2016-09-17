'use babel';

import { React, ReactDOM } from 'react-for-atom';
import TextEditorMarkersView from './TextEditorMarkersView';
import throttle from 'lodash.throttle';

export default class TextEditorState {

    textEditor = null;
    watchDataById = new Map();
    watchIdsByLine = new Map();
    // Marker for end of a line
    markersByLine = new Map();
    // Highlights within a range
    highlightsByRange = new Map();
    activeIdByLine = new Map();

    constructor(textEditor) {
        this.textEditor = textEditor;
        this.textEditorElement = document.createElement('div');
        this.textEditor.element.shadowRoot.appendChild(this.textEditorElement);
        this.throttledRender = throttle(this.render, 100);
        this.throttledRender();
        this.textEditor.onDidChangeCursorPosition(this.onCursorPositionChange);
    }

    render = () => {
        this.component = ReactDOM.render(this.renderUI(), this.textEditorElement);
    }

    renderUI = () => {
        return (
            <TextEditorMarkersView
                watchDataById={this.watchDataById}
                markersByLine={this.markersByLine}
                watchIdsByLine={this.watchIdsByLine}
                activeIdByLine={this.activeIdByLine}
            />
        );
    }

    onCursorPositionChange = ({ newBufferPosition }) => {
        let lastMatchRange;
        let match;
        for (const [, item] of this.highlightsByRange) {
            const { marker } = item;
            const range = marker.getBufferRange();
            if (range.containsPoint(newBufferPosition)) {
                if (lastMatchRange && range.containsRange(lastMatchRange)) continue;
                lastMatchRange = range;
                match = item;
            }
        }
        if (match) {
            this.activeIdByLine.set(match.info.loc.end.line, match.id);
            this.throttledRender();
        } else if (this.watchIdsByLine.has(newBufferPosition.row)) {
            const lineIds = this.watchIdsByLine.get(newBufferPosition.row);
            this.activeIdByLine.set(newBufferPosition.row, lineIds[lineIds.length - 1]);
            this.throttledRender();
        }
    }

    addOrUpdateWatch(value, info) {
        const { id, loc: { end, start } } = info;
        if (!end) {
            console.log(value, info);
        }
        this.watchDataById.set(id, { value, info });
        const rangeKey = [start.line, start.column, end.line, end.column].join('.');
        if (!this.markersByLine.has(end.line)) {
            const marker = this.textEditor.markBufferPosition([
                end.line - 1,
                this.textEditor.buffer.lineLengthForRow(end.line - 1),
            ]);
            const element =  document.createElement('div');
            const overlay = this.textEditor.decorateMarker(marker, {
                type: 'overlay', class: 'spyjs-ui', item: element,
            });
            // The overlay appears on the line after the line we want, so translate it back
            overlay.properties.item.style.transform =
                `translateY(${-this.textEditor.getLineHeightInPixels()}px)`;
            this.markersByLine.set(end.line, { marker, overlay, element });
        }
        if (!this.highlightsByRange.has(rangeKey)) {
            if (start.line === end.line) {
                const marker = this.textEditor.markBufferRange(
                    [[start.line - 1, start.column - 1], [end.line - 1, end.column - 1]]
                );
                this.textEditor.decorateMarker(marker, {
                    type: 'highlight', class: 'spyjs-highlight',
                });
                this.highlightsByRange.set(rangeKey, { marker, id, info });
            }
        }
        if (!this.watchIdsByLine.has(end.line)) {
            this.watchIdsByLine.set(end.line, []);
        }
        const line = this.watchIdsByLine.get(end.line);
        if (line.indexOf(id) === -1) {
            let insertIndex = -1;
            for (let i = 0; i < line.length; i++) {
                const loc = this.watchDataById.get(line[i]).info.loc;
                if (end.column <= loc.end.column && start.column >= loc.start.column) {
                    insertIndex = i;
                    break;
                }
            }
            if (insertIndex === -1) {
                line.push(id);
            } else {
                line.splice(insertIndex, 0, id);
            }
        }
        this.throttledRender();
    }

    reset() {
        for (const [, value] of this.markersByLine) {
            value.marker.destroy();
        }
        for (const [, value] of this.highlightsByRange) {
            value.marker.destroy();
        }
        this.watchDataById = new Map();
        this.watchIdsByLine = new Map();
        this.markersByLine = new Map();
        this.highlightsByRange = new Map();
        this.activeIdByLine = new Map();
    }

}
