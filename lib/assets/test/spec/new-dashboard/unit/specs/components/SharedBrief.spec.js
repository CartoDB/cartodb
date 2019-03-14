import { shallowMount } from '@vue/test-utils';
import SharedBrief from 'new-dashboard/components/SharedBrief';

const $tc = key => key;
const $t = key => key;

describe('SharedBrief.vue', () => {
  it('should render correct contents', () => {
    const colleaguesData = [
      { type: 'group',
        entity: {
          id: 'xxxx-yyy',
          name: 'grupoprueba'
        },
        access: 'r' },
      { type: 'user',
        entity: {
          id: 'zzzz-www',
          username: 'user1'
        },
        access: 'w'
      }
    ];
    const sharedBrief = shallowMount(SharedBrief, {
      propsData: {
        colleagues: colleaguesData
      },
      mocks: {
        $tc, $t
      }
    });

    expect(sharedBrief).toMatchSnapshot();
  });
});
