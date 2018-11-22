/**
 * Factory function to create stores injecting external dependencies.
 * @param {CartoNode.AuthenticatedClient} client
 */
export function create (client) {
  return {
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
        state.isErrored = false;
        state.error = [];
      },

      setRequestError (state, error) {
        state.isFetching = false;
        state.isErrored = true;
        state.error = error;
        state.notifications = [];
      },

      setFetchingState (state) {
        state.isFetching = true;
        state.isErrored = false;
        state.error = [];
        state.notifications = [];
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
          const {
            userId,
            apiKey
          } = options;
          if (!notification.read_at) {
            const notificationCopy = Object.assign({}, notification);
            notificationCopy.read_at = now.toISOString();
            client.updateNotification(userId, apiKey, notificationCopy);
          }
        });
      }
    }
  };
}

export default { create };
