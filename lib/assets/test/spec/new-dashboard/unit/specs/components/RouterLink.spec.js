import { shallowMount } from '@vue/test-utils';
import RouterLink from 'new-dashboard/bundles/header/components/RouterLink';

jest.mock('new-dashboard/store/utils/getCARTOData', () => function () {
  return {
    user_data: {
      base_url: 'example-baseurl.com'
    }
  };
});

describe('RouterLink.js', () => {
  it('should a link element with the given static route as url', () => {
    const routerLinkElement = shallowMount(RouterLink, {
      propsData: {
        staticRoute: '/test-path'
      },
      slots: { default: 'Test Router Link' }
    });
    expect(routerLinkElement).toMatchSnapshot();
  });
});
