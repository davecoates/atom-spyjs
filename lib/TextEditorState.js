'use babel';

import { React, ReactDOM } from 'react-for-atom';
import TextEditorMarkersView from './TextEditorMarkersView';
import throttle from 'lodash.throttle';

export default class TextEditorState {

    textEditor = null;
    watchDataById = new Map();
    watchIdsByLine = new Map();
    markersByLine = new Map();

    constructor(textEditor) {
        this.textEditor = textEditor;
        this.textEditorElement = document.createElement('div');
        this.textEditor.element.shadowRoot.appendChild(this.textEditorElement);
        this.throttledRender = throttle(this.render, 100);
        this.throttledRender();
    }

    render = () => {
        this.component = ReactDOM.render(this.renderUI(), this.textEditorElement);
    }

    renderUI = () => {
        return <TextEditorMarkersView
            watchDataById={this.watchDataById}
            markersByLine={this.markersByLine}
            watchIdsByLine={this.watchIdsByLine}
               />;
    }

    addOrUpdateWatch(value, info) {
        const { id, loc: { end } } = info;
        this.watchDataById.set(id, { value, info });
        if (!this.markersByLine.has(end.line)) {
            const marker = this.textEditor.markBufferPosition([
                end.line - 1,
                this.textEditor.buffer.lineLengthForRow(end.line - 1),
            ]);
            const element =  document.createElement('div');
            const overlay = this.textEditor.decorateMarker(marker, {
                type: 'overlay', class: 'watch-mark-ui', item: element,
            });
            overlay.properties.item.style.transform =
                `translateY(${-this.textEditor.getLineHeightInPixels()}px)`;
            this.markersByLine.set(end.line, { overlay, element });
        }
        if (!this.watchIdsByLine.has(end.line)) {
            this.watchIdsByLine.set(end.line, []);
        }
        const line = this.watchIdsByLine.get(end.line);
        if (line.indexOf(id) === -1) {
            let insertIndex = -1;
            for (let i = 0; i < line.length; i++) {
                if (end.column < this.watchDataById.get(line[i]).info.loc.end.column) {
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

}
