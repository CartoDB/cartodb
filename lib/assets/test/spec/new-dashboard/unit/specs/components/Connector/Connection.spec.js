import Vuex from 'vuex';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import ConnectionComponent from 'new-dashboard/components/Connector/Connection';

const localVue = createLocalVue();
localVue.use(Vuex);

const BQ_CONNECTION = {
  id: 'ID',
  type: 'mysql',
  connectionType: 'database',
  connectionName: 'CONN_NAME',
  connectionParams: { param1: 'param1', param2: 'param2' },
  label: 'CONN_LABEL',
  beta: false,
  disabled: false
};

describe('Connection.vue', () => {
  beforeEach(() => {
  });

  describe('Render', () => {
    it('should render properly', () => {
      const connectionComponent = createConnections(BQ_CONNECTION);

      expect(connectionComponent).toMatchSnapshot();
    });

    it('should render beta tag', () => {
      const props = { ...BQ_CONNECTION, beta: true };
      const connectionComponent = createConnections(props);

      expect(connectionComponent).toMatchSnapshot();
    });

    it('should be editable if connType is "database"', () => {
      const connectionComponent = createConnections(BQ_CONNECTION);
      expect(connectionComponent.find('.connector.editable').element).toBeTruthy();
    });
  });
});

function createConnections (propsData) {
  return shallowMount(ConnectionComponent, {
    mocks: {
      $t: key => key,
      $router: {
        push: jest.fn()
      }
    },
    localVue,
    propsData
  });
}
