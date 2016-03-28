'use babel';
/* @flow */

import { React, ReactDOM } from 'react-for-atom';
import JSONTree from 'react-json-tree';

export default class TreeView extends React.Component {
    render() {
        const b = {test: 1};
        const a = new Map();
        a.set(1, 5);
        const data = {
            a: 1,
            b: [1,2,3,4],
            c: {
                level: 2,
                items: [5,6,7]
            },
            d: a,
        };
        return <JSONTree data={this.props.data}/>
    }
}
