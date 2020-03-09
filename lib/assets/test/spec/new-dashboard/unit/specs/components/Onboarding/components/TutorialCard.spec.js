import { shallowMount } from '@vue/test-utils';
import TutorialCard from 'new-dashboard/components/Onboarding/components/TutorialCard';

describe('TutorialCard.vue', () => {
  it('should render properly', () => {
    const TutorialCardComponent = shallowMount(TutorialCard, {
      propsData: {
        content: {
          title: 'Fake tutorial title',
          subtitle: 'Fake tutorial subtitle',
          button: 'Fake tutorial button',
          link: 'www.fakelink.com'
        }
      }
    });

    expect(TutorialCardComponent).toMatchSnapshot();
  });

  it('should not render the button in the card if button text is missing', () => {
    const TutorialCardComponent = shallowMount(TutorialCard, {
      propsData: {
        content: {
          title: 'Fake tutorial title',
          subtitle: 'Fake tutorial subtitle',
          link: 'www.fakelink.com'
        }
      }
    });

    expect(TutorialCardComponent).toMatchSnapshot();
  });
});
