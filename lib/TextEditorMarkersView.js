/* @flow */

import { React, ReactDOM } from 'react-for-atom';
import ValueMirrorInspector, { getStylingFromBase16 } from 'value-mirror-inspector';

function getStyling(colors) {
    const styles = getStylingFromBase16(colors);
    return {
        ...styles,
        root: () => ({
            className: 'watcher-inspector-root',
            style: styles.root,
        }),
    };
}

export default class TextEditorMarkersView extends React.Component {

    componentWillReceiveProps() {
        for (const [line, ids] of this.props.watchIdsByLine) {
            const { element } = this.props.markersByLine.get(line);
            let id = this.props.activeIdByLine.get(line);
            if (id == null) id = ids[ids.length - 1];
            const { value } = this.props.watchDataById.get(id);
            ReactDOM.render(this.renderMarker(value), element);
        }
    }

    renderMarker(value) {
        return (
            <div className="watch-mark-overlay">
                <ValueMirrorInspector getStylingFromBase16={getStyling} mirror={value} themeName="isotope" />
            </div>
        );
    }

    render() {
        return null;
    }
}
