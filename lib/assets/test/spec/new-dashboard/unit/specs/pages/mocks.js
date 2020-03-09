export const fakeStore = {
  dispatch: jest.fn(),
  state: {
    user: {
      base_url: 'fake_base_url',
      id: 'fake_id',
      apiKey: 'fake_api_key'
    },
    notifications: {
      notifications: ['fake_notifications']
    }
  },
  getters: {
    'user/isNotificationVisible': false
  }
};
