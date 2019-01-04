import { shallowMount } from '@vue/test-utils';
import SolutionsPage from 'new-dashboard/pages/Solutions';

const $t = key => key;

describe('Solutions.vue', () => {
  it('should render correct contents', () => {
    const page = shallowMount(SolutionsPage, {
      mocks: {
        $t
      }
    });

    expect(page).toMatchSnapshot();
  });
});
