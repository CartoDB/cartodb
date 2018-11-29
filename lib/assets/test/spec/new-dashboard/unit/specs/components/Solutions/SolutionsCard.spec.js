import { shallowMount } from '@vue/test-utils';
import SolutionsCard from 'new-dashboard/components/Solutions/SolutionsCard';

const $t = key => key;

describe('SolutionsCard.vue', () => {
  it('should render correct contents', () => {
    const page = shallowMount(SolutionsCard, {
      propsData: {
        title: 'Test title 123',
        description: 'My description test',
        demoUrl: 'https://carto.com/demo',
        infoUrl: 'https://carto.com/info'
      },
      mocks: {
        $t
      }
    });

    expect(page).toMatchSnapshot();
  });
});
