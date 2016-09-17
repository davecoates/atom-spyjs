/* @flow */

import { React, ReactDOM } from 'react-for-atom';
import ValueMirrorInspector, { getStylingFromBase16 } from 'value-mirror-inspector';

function getStyling(colors) {
    const styles = getStylingFromBase16(colors);
    return {
        ...styles,
        root: () => ({
            className: 'spyjs-inspector-root',
            style: styles.root,
        }),
        rootWithTimeTravel: () => ({
            className: 'spyjs-inspector-root-with-time-travel',
        }),
    };
}

export default class TextEditorMarkersView extends React.Component {

    domById = {};

    componentWillReceiveProps() {
        for (const [line, ids] of this.props.watchIdsByLine) {
            const { element } = this.props.markersByLine.get(line);
            let id = this.props.activeIdByLine.get(line);
            if (id == null) id = ids[ids.length - 1];
            const { value } = this.props.watchDataById.get(id);
            this.domById[id] = ReactDOM.render(this.renderMarker(id, value), element);
            this.domById[id].onwheel = this.onWheel.bind(this, id);
        }
    }

    onClick = e => {
        // This is a hack to make sure when you expand an inspector it
        // appears on top of any other spyjs inspectors
        // Reset other overlays
        [].forEach.call(document.querySelectorAll('.spyjs-ui'), el => el.style.zIndex = 4)
        // Make this overlay appear on top
        e.target.closest('.spyjs-ui').style.zIndex = 5;
    }

    onWheel = (id, e) => {
        // Removed for now
        return;
        e.stopPropagation();
        // TODO: Super fragile hack... please find add better way
        this.domById[id].firstChild.firstChild.scrollTop += e.deltaY;
    }

    renderMarker(id, value) {
        return (
            <div className="spyjs-overlay" onClick={this.onClick}>
                <ValueMirrorInspector
                    key={id}
                    getStylingFromBase16={getStyling}
                    mirror={value}
                    themeName="isotope"
                />
            </div>
        );
    }

    render() {
        return null;
    }
}
