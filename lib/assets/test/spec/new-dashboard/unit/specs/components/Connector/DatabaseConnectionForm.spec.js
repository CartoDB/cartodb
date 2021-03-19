import Vuex from 'vuex';
import { createLocalVue, mount } from '@vue/test-utils';
import DatabaseConnectionForm from 'new-dashboard/components/Connector/DatabaseConnectionForm';

const localVue = createLocalVue();
localVue.use(Vuex);

const MYSQL = {
  id: 'ID',
  connector: 'mysql',
  name: 'MySQL',
  type: 'db-connector',
  connectionParams: {
    server: 'server',
    port: 5432,
    database: 'database',
    username: 'username',
    password: 'password'
  }
};

describe('DatabaseConnections.vue', () => {
  beforeEach(() => {
  });

  describe('Render', () => {
    it('should render properly', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [ MYSQL ]
        }
      });
      const connectionsList = createDatabaseConnectionForm(store, {
        connection: null,
        connector: {
          name: 'mysql',
          options: {
            service: 'mysql',
            params: [
              { key: 'param1', type: 'text' },
              { key: 'param2', type: 'number' },
              { key: 'param3', type: 'password' }
            ],
            placeholder_query: 'PLACEHOLDER'
          },
          title: 'MySQL',
          type: 'database'
        }
      });

      expect(connectionsList).toMatchSnapshot();
    });
  });

  describe('Edit', () => {
    it('should render properly', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [ MYSQL ]
        }
      });
      const connectionsList = createDatabaseConnectionForm(store, {
        connection: MYSQL,
        connector: {
          name: 'mysql',
          options: {
            service: 'mysql',
            params: [
              { key: 'param1', type: 'text' },
              { key: 'param2', type: 'number' },
              { key: 'param3', type: 'password' }
            ],
            placeholder_query: 'PLACEHOLDER'
          },
          title: 'MySQL',
          type: 'database'
        }
      });

      expect(connectionsList).toMatchSnapshot();
    });
  });

  describe('Form', () => {
    it('should build form properly', () => {
      const store = createStore({
        connectors: {
          loadingConnections: false,
          connections: [ MYSQL ]
        }
      });
      const connectionsList = createDatabaseConnectionForm(store, {
        connection: null,
        connector: {
          name: 'mysql',
          options: {
            service: 'mysql',
            params: [
              { key: 'param1', type: 'text' },
              { key: 'param2', type: 'number' },
              { key: 'param3', type: 'password' }
            ],
            placeholder_query: 'PLACEHOLDER'
          },
          title: 'MySQL',
          type: 'database'
        }
      });

      expect(connectionsList.findAll('input[type]').length).toEqual(4);
      expect(connectionsList.findAll('input[type]').at(1).element.getAttribute('placeholder')).toEqual('DataPage.imports.database.placeholder-param1');
      expect(connectionsList.findAll('input[type]').at(2).element.getAttribute('placeholder')).toEqual('DataPage.imports.database.placeholder-param2');
      expect(connectionsList.findAll('input[type]').at(3).element.getAttribute('placeholder')).toEqual('DataPage.imports.database.placeholder-param3');
      expect(connectionsList.findAll('input[type]').at(1).element.getAttribute('type')).toEqual('text');
      expect(connectionsList.findAll('input[type]').at(2).element.getAttribute('type')).toEqual('number');
      expect(connectionsList.findAll('input[type]').at(3).element.getAttribute('type')).toEqual('password');
    });
  });
});

function createStore (customStoreData) {
  const storeData = {
    connectors: {
      connections: null,
      projects: null,
      bqDatasets: null,
      loadingConnections: false,
      loadingProjects: true
    },
    config: {
      isFirstTimeViewingDashboard: false
    },
    user: {
      account_type: 'account_type'
    }
  };

  const storeInstance = new Vuex.Store({
    state: customStoreData || storeData
  });

  return storeInstance;
}

function createDatabaseConnectionForm (store, propsData) {
  return mount(DatabaseConnectionForm, {
    mocks: {
      $t: key => key,
      backboneViews: {},
      $router: {
        push: jest.fn()
      }
    },
    store,
    localVue,
    propsData
  });
}
