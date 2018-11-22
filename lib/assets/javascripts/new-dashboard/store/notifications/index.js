import CartoNode from 'carto-node';

const client = new CartoNode.AuthenticatedClient();

const notifications = {
  namespaced: true,

  state: {
    isFetching: false,
    isErrored: false,
    error: [],
    notifications: []

  },
  computed: {},
  getters: {},
  mutations: {
    setNotifications (state, notifications) {
      state.notifications = notifications;
      state.isFetching = false;
    },

    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = [];
    }
  },
  actions: {
    fetchNotifications (context, options) {
      context.commit('setFetchingState');
      client.getConfig(function (err, _, data) {
        if (err) {
          context.commit('setRequestError', err);
          return;
        }

        context.commit('setNotifications', data.organization_notifications);
        context.dispatch('markNotificationsAsRead', options);
      });
    },
    markNotificationsAsRead (context, options) {
      const now = new Date();
      context.state.notifications.forEach(notification => {
        const {userId, apiKey} = options;
        if (!notification.read_at) {
          const notificationCopy = Object.assign({}, notification);
          notificationCopy.read_at = now.toISOString();
          client.updateNotification(userId, apiKey, notificationCopy);
          // markAsRead(baseUrl, userId, apiKey, notificationCopy);
        }
      });
    }
  }
};



export default notifications;
