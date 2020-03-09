import { shallowMount } from '@vue/test-utils';
import RecentSection from 'new-dashboard/pages/Home/RecentSection/RecentSection';
import visualizations from '../../fixtures/visualizations';
import datasets from '../../fixtures/datasets';

const recentContentList = [
  ...visualizations.visualizations[0],
  ...datasets.visualizations[0]
];

describe('RecentSection.vue', () => {
  let recentSectionComponent, pushSpy;

  beforeEach(() => {
    pushSpy = jest.fn();

    recentSectionComponent = shallowMount(RecentSection, {
      mocks: {
        $t: key => key,
        $store: {
          state: {
            recentContent: {
              list: recentContentList
            }
          }
        },
        $router: {
          push: pushSpy
        }
      }
    });
  });

  describe('Render', () => {
    it('should render properly', () => {
      expect(recentSectionComponent).toMatchSnapshot();
    });
  });

  describe('Methods', () => {
    it("goToTagsSection: should emit 'sectionChange' with value 'TagsSection'", () => {
      recentSectionComponent.vm.goToTagsSection();
      expect(recentSectionComponent.emitted('sectionChange')).toBeTruthy();
      expect(recentSectionComponent.emitted('sectionChange')[0][0]).toBe('TagsSection');
    });

    it('onContentChanged: should emit a contentChanged event when DatasetCard emits it', () => {
      recentSectionComponent.vm.onContentChanged();

      expect(recentSectionComponent.emitted('contentChanged')).toBeTruthy();
    });
  });
});
