import { shallowMount } from '@vue/test-utils';
import QuotaContainer from 'new-dashboard/pages/Home/QuotaSection/QuotaContainer';

const $t = key => key;

describe('QuotaContainer.vue', () => {
  it('should render correct container with headers for quotas including total per month', () => {
    const quotaContainer = shallowMount(QuotaContainer, {
      propsData: { title: 'Test Title', perMonth: true },
      mocks: {
        $t
      }
    });

    expect(quotaContainer).toMatchSnapshot();
  });
});
