import { shallowMount } from '@vue/test-utils';
import Selector from 'new-dashboard/components/Onboarding/distributor/Selector';

const $t = key => key;

describe('Selector.vue', () => {
  it('should render properly', () => {
    const componentProps = {
      title: 'JavaScript Tutorial',
      text: 'This a fake description',
      tags: ['Fake tag', 'More fake tag']
    };

    const selectorComponent = shallowMount(Selector, {
      propsData: componentProps,
      mocks: { $t }
    });

    expect(selectorComponent).toMatchSnapshot();
  });

  it('should set icon modifier if present', () => {
    const componentProps = {
      iconModifier: 'fake'
    };

    const selectorComponent = shallowMount(Selector, {
      propsData: componentProps,
      mocks: { $t }
    });

    const iconNode = selectorComponent.find('.title');
    expect(iconNode.classes()).toContain('selector__title-icon', 'selector__title-icon--fake');
  });
});
