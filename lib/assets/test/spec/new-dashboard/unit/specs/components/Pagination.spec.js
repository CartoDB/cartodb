import { shallowMount } from '@vue/test-utils';
import Pagination from 'new-dashboard/components/Pagination';

// Vue imports
// import VueRouter from 'vue-router';
// import Vuex from 'vuex';

// const localVue = createLocalVue();
// localVue.use(Vuex);
// localVue.use(VueRouter);

describe('Pagination.vue', () => {
  it('should render pagination for 6 pages from page number 1 with 1 ellipsis', () => {
    const pageCase = {
      page: 1,
      numPages: 6
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });
  it('should render pagination for 2 pages from page number 2', () => {
    const pageCase = {
      page: 2,
      numPages: 2
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });
  it('should render pagination for 9 pages from page number 5 with 2 ellipsis', () => {
    const pageCase = {
      page: 5,
      numPages: 9
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });
  it('should render pagination for 8 pages from page number 5 with 1 ellipsis', () => {
    const pageCase = {
      page: 5,
      numPages: 8
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });
});
