'use babel';
/* @flow */

import { React, ReactDOM } from 'react-for-atom';
import ValueMirrorInspector from 'value-mirror-inspector/lib/index';

export class WatchView extends HTMLElement {

    value = null;

    initialise({value}) {
        this.value = value;
        this.component = ReactDOM.render(this.renderUI(), this);
        return this;
    }

    onRef(ref) {
        console.log('fudge', ref) || ref.focus();
    }

    renderUI() {
        if (this.value !== null && typeof this.value === 'object') {
            return (
                <div className="watch-mark-overlay">
                    <ValueMirrorInspector mirror={this.value} />
                </div>
            );
        }
        return <div className="watch-mark-overlay">{this.value}</div>;
    }

    setValue(value) {
        this.value = value;
        this.component = ReactDOM.render(this.renderUI(), this);
    }

    detachedCallback() {
        ReactDOM.unmountComponentAtNode(this);
    }
}

export default document.registerElement(
    'pocket-watch-watch-view',
    {
        prototype: WatchView.prototype,
        extends: 'div',
    }
);
