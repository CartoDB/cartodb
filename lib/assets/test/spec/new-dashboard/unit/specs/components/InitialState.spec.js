import { shallowMount } from '@vue/test-utils';
import InitialState from 'new-dashboard/components/States/InitialState';

describe('InitialState.vue', () => {
  it('should render correctly the initial state box', () => {
    const title = {
      title: 'My title'
    };
    const initialState = shallowMount(InitialState, {
      propsData: title,
      slots: {
        icon: '<img src="test.svg"/>',
        description: '<p>This is my description</p>',
        actionButton: '<button class="test">This is a button test</button>'
      }
    });

    expect(initialState).toMatchSnapshot();
  });
});
