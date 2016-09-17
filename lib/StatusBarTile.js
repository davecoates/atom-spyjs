/* @flow */

import { React } from 'react-for-atom';
import Icon from 'react-icons/lib/fa/binoculars';
import cx from 'classnames';

export default class StatusBarTile extends React.Component {

    render() {
        const { connectionStatus, onConnect } = this.props;
        return (
            <div className="inline-block" onClick={onConnect}>
                <Icon className={cx('spyjs-tile-icon', {
                    'spyjs-tile-icon-connected': connectionStatus.connected,
                })}
                />
            </div>
        );
    }

}
