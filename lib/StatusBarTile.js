/* @flow */

import { React } from 'react-for-atom';
import Icon from 'react-icons/lib/fa/binoculars';
import cx from 'classnames';

export default class StatusBarTile extends React.Component {

    render() {
        const { connectionStatus } = this.props;
        return (
            <div className="inline-block">
                <Icon className={cx('voyeur-tile-icon', {
                    'voyeur-tile-icon-connected': connectionStatus.connected,
                })}
                />
            </div>
        );
    }

}
