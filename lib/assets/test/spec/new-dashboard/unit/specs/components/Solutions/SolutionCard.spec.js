import { shallowMount } from '@vue/test-utils';
import SolutionCard from 'new-dashboard/components/Solutions/SolutionCard';

const $t = key => key;

describe('SolutionCard.vue', () => {
  it('should render correct contents', () => {
    const page = shallowMount(SolutionCard, {
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
