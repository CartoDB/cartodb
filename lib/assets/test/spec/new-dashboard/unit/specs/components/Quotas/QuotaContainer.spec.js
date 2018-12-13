import { shallowMount } from '@vue/test-utils';
import QuotaContainer from 'new-dashboard/components/Quotas/QuotaContainer';

describe('QuotaContainer.vue', () => {
  it('should render correct contents', () => {
    const quotaContainer = shallowMount(QuotaContainer);

    expect(quotaContainer).toMatchSnapshot();
  });
});
