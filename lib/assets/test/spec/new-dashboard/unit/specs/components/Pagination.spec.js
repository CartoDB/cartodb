import { shallowMount } from '@vue/test-utils';
import Pagination from 'new-dashboard/components/Pagination';

describe('Pagination.vue', () => {
  it('should render all items in pagination for less than 7 pages', () => {
    const pageCase = {
      page: 1,
      numPages: 6
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });

  it('should render pagination for 12 pages from page number 5 with 2 ellipsis', () => {
    const pageCase = {
      page: 5,
      numPages: 12
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });

  it('should render pagination for 12 pages from page number 1 with 1 right ellipsis', () => {
    const pageCase = {
      page: 1,
      numPages: 12
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });

  it('should render pagination for 12 pages from page number 12 with 1 left ellipsis', () => {
    const pageCase = {
      page: 12,
      numPages: 12
    };
    const pagination = shallowMount(Pagination, {
      propsData: pageCase
    });

    expect(pagination).toMatchSnapshot();
  });
});
