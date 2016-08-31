/* @flow */

import { React, ReactDOM } from 'react-for-atom';
import ValueMirrorInspector from 'value-mirror-inspector/lib/index';

export default class TextEditorMarkersView extends React.Component {

    componentWillReceiveProps() {
        for (const [line, ids] of this.props.watchIdsByLine) {
            const { element } = this.props.markersByLine.get(line);
            const id = ids[ids.length - 1];
            const { value } = this.props.watchDataById.get(id);
            ReactDOM.render(this.renderMarker(value), element);
        }
    }

    renderMarker(value) {
        if (value !== null && typeof value === 'object') {
            return (
                <div className="watch-mark-overlay">
                    <ValueMirrorInspector mirror={value} />
                </div>
            );
        }
        return <div className="watch-mark-overlay">{value}</div>;
    }

    render() {
        return null;
    }
}
