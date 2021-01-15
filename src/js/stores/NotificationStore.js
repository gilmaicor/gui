import alt from '../alt';
import notificationsActions from '../actions/NotificationActions';

class NotificationStore {
    constructor() {
        this.loading = true;
        this.error = null;
        this.notifications = [];

        this.bindListeners({
            handleFailure: notificationsActions.failed,
            handleLoad: notificationsActions.load,
            handleAppend: notificationsActions.append,
            handleUpdateList: notificationsActions.updateList,
        });
    }

    handleUpdateList(notifications) {
        this.notifications = [];
        notifications.reverse()
            .forEach((notification) => {
                this.addNotification(notification);
            });
    }

    handleAppend(data) {
        const dataObj = JSON.parse(data);
        this.addNotification(dataObj);
    }

    addNotification(notification) {
        const {
            timestamp, ts, message, metaAttrsFilter,
        } = notification;

        const metas = metaAttrsFilter || {};
        const isUTC = ts || timestamp;
        this.notifications = [{
            message,
            metas,
            datetime: ts || timestamp,
            isUTC,
        },
        ...this.notifications,
        ];
    }

    handleLoad() {
        this.loading = true;
    }

    handleFailure(error) {
        this.error = error;
        this.loading = false;
    }
}

export default alt.createStore(NotificationStore, 'NotificationStore');
