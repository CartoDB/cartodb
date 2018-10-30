import { shallowMount } from '@vue/test-utils';
import CreateButton from 'new-dashboard/components/CreateButton';

let createButton, showSpy;

describe('CreateButton.vue', () => {
  beforeEach(() => {
    showSpy = jest.fn();

    createButton = shallowMount(CreateButton, {
      slots: {
        default: 'New map'
      },
      mocks: {
        $modal: { show: showSpy }
      }
    });
  });

  it('should render correct contents', () => {
    expect(createButton).toMatchSnapshot();
  });

  it('should open CreateDialog when clicked', () => {
    createButton.vm.openCreateModal();
    expect(showSpy).toHaveBeenCalledWith({});
  });
});
