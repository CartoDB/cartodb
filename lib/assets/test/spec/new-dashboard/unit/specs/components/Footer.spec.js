import { shallowMount } from '@vue/test-utils';
import Footer from 'new-dashboard/components/Footer';

const $t = key => key;

describe('Footer.vue', () => {
  it('should render items for free users', () => {
    const user = {
      account_type: 'free',
      organization: null,
      org_admin: false
    };
    let footerWrapper = shallowMount(Footer, {
      propsData: {
        user
      },
      mocks: { $t }
    });
    expect(footerWrapper).toMatchSnapshot();
  });

  it('should render items for pro users', () => {
    const user = {
      account_type: 'test-pro-account',
      organization: null,
      org_admin: false
    };
    let footerWrapper = shallowMount(Footer, {
      propsData: {
        user
      },
      mocks: { $t }
    });
    expect(footerWrapper).toMatchSnapshot();
  });

  it('should render items for organization users (no owner)', () => {
    const user = {
      account_type: 'test-organization',
      organization: { admin_email: 'test@organization.com' },
      org_admin: false
    };
    let footerWrapper = shallowMount(Footer, {
      propsData: {
        user
      },
      mocks: { $t }
    });
    expect(footerWrapper).toMatchSnapshot();
  });

  it('should render items for organization users (owner)', () => {
    const user = {
      account_type: 'test-organization',
      organization: { admin_email: 'test@organization.com' },
      org_admin: true
    };
    let footerWrapper = shallowMount(Footer, {
      propsData: {
        user
      },
      mocks: { $t }
    });
    expect(footerWrapper).toMatchSnapshot();
  });
});
