import { mount } from '@vue/test-utils';
import SharedBrief from 'new-dashboard/components/SharedBrief';

const $tc = key => key;
const $t = key => key;

describe('SharedBrief.vue', () => {
  it('should render the text for sharing with all organization members', () => {
    const colleaguesData = [
      { type: 'org',
        entity: {
          name: 'test-org'
        }
      },
      { type: 'user',
        entity: {
          username: 'user1'
        }
      }
    ];
    const sharedBrief = createSharedBriefComponent(colleaguesData);
    expect(sharedBrief).toMatchSnapshot();
  });
  it('should render the text for groups and users', () => {
    const colleaguesData = [
      { type: 'group',
        entity: {
          name: 'grupoprueba'
        }
      },
      { type: 'user',
        entity: {
          username: 'user1'
        }
      }
    ];
    const sharedBrief = createSharedBriefComponent(colleaguesData);
    expect(sharedBrief).toMatchSnapshot();
  });
  it('should render the text for groups', () => {
    const colleaguesData = [
      { type: 'group',
        entity: {
          name: 'grupoprueba'
        }
      }
    ];
    const sharedBrief = createSharedBriefComponent(colleaguesData);
    expect(sharedBrief).toMatchSnapshot();
  });
  it('should render the text for users', () => {
    const colleaguesData = [
      { type: 'user',
        entity: {
          username: 'user1'
        }
      },
      { type: 'user',
        entity: {
          username: 'user2'
        }
      }
    ];
    const sharedBrief = createSharedBriefComponent(colleaguesData);
    expect(sharedBrief).toMatchSnapshot();
  });
});

function createSharedBriefComponent (colleaguesData) {
  const sharedBriefComponent = mount(SharedBrief, {
    propsData: {
      colleagues: colleaguesData
    },
    mocks: {
      $tc, $t
    }
  });
  return sharedBriefComponent;
}
