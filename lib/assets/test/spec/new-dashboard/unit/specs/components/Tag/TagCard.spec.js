import { shallowMount } from '@vue/test-utils';
import TagCard from 'new-dashboard/components/Tag/TagCard';

const $tc = key => key;

describe('TagCard', () => {
  it('should render properly', () => {
    const tagCardElement = shallowMount(TagCard, {
      propsData: {
        tag: {
          tag: 'Test Tag',
          maps: 1,
          datasets: 3
        }
      },
      mocks: {
        $tc
      }
    });

    expect(tagCardElement).toMatchSnapshot();
  });
});
