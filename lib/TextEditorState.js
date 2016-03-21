'use babel';

export default class TextEditorState {

    textEditor = null;
    nodeMarkersById = new Map();

    constructor(textEditor) {
        this.textEditor = textEditor;
        this.textEditor.onDidChangeCursorPosition(this.onCursorPositionChange);
        this.visibleMarker = null;
    }

    onCursorPositionChange = ({ newBufferPosition }) => {
        let lastMatchRange;
        let match;
        for (const [, item] of this.nodeMarkersById) {
            const { marker } = item;
            const range = marker.getBufferRange();
            if (range.containsPoint(newBufferPosition)) {
                if (lastMatchRange && range.containsRange(lastMatchRange)) continue;
                lastMatchRange = range;
                match = item;
            }
        }

        if (match) {
            if (this.visibleMarker) {
                this.visibleMarker.overlay.destroy();
            }
            const { value, marker } = match;
            const view = document.createElement('pre');
            view.innerHTML = JSON.stringify(value, null, 2);
            const overlay = this.textEditor.decorateMarker(marker, {
                type: 'overlay', class: 'watch-mark-overlay', item: view,
            });
            this.visibleMarker = { ...match, overlay, view };
        }
    };

    addOrUpdateWatch(value, info) {
        const { id, loc: { start, end } } = info;
        const range = [
            [start.line - 1, start.column - 1],
            [end.line - 1, end.column - 1],
        ];
        let watchValue;
        if (!this.nodeMarkersById.has(id)) {
            const marker = this.textEditor.markBufferRange(range);
            this.textEditor.decorateMarker(marker, {
                type: 'highlight', class: 'watch-mark-highlight',
            });
            watchValue = {
                marker,
            };
        } else {
            watchValue = this.nodeMarkersById.get(id);
        }
        this.nodeMarkersById.set(id, { ...watchValue, id, value });
        if (this.visibleMarker && this.visibleMarker.id === id) {
            this.visibleMarker.view.innerHTML = JSON.stringify(value, null, 2);
        }
    }

}
