import { shallowMount } from '@vue/test-utils';
import TagsSection from 'new-dashboard/pages/Home/TagsSection/TagsSection';

const tags = [
  { tag: 'Fake tag', maps: 1, datasets: 0 }
];

describe('TagsSection.vue', () => {
  let tagsSectionComponent, pushSpy;

  beforeEach(() => {
    pushSpy = jest.fn();
    tagsSectionComponent = createTagsSectionComponent({
      mocks: {
        $router: {
          push: pushSpy
        }
      }
    });
  });

  describe('Mounted', () => {
    it('should call goToPage with page number coming from URL if any', () => {
      const URLPage = 3;
      const mockComponent = createTagsSectionComponent({
        mocks: {
          $route: {
            query: { sectionPage: URLPage }
          },
          $router: {
            push: pushSpy
          }
        }
      });

      expect(mockComponent.vm.currentPage).toBe(URLPage);
    });
  });

  describe('Render', () => {
    it('should render properly', () => {
      tagsSectionComponent.setData({
        tags,
        isFetching: false,
        totalTags: 20
      });

      tagsSectionComponent.vm.$forceUpdate();

      expect(tagsSectionComponent).toMatchSnapshot();
    });

    it('should render empty state', () => {
      tagsSectionComponent.setData({
        tags: [],
        isFetching: false,
        totalTags: 0
      });

      tagsSectionComponent.vm.$forceUpdate();

      expect(tagsSectionComponent).toMatchSnapshot();
    });

    it('should render loading state', () => {
      tagsSectionComponent.setData({
        isFetching: true
      });

      tagsSectionComponent.vm.$forceUpdate();

      expect(tagsSectionComponent).toMatchSnapshot();
    });
  });

  describe('Computed', () => {
    it('numPages: should return the number of pages based on the number of tags per page', () => {
      tagsSectionComponent.setData({
        totalTags: 12
      });

      expect(tagsSectionComponent.vm.numPages).toBe(2);
    });

    it('shouldShowPagination: should return true if numPages is greater than 1', () => {
      tagsSectionComponent.setData({
        totalTags: 12
      });

      expect(tagsSectionComponent.vm.shouldShowPagination).toBe(true);
    });
  });

  describe('Methods', () => {
    it("goToRecentSection: should emit 'sectionChange' with value 'RecentSection' and change URL parameters", () => {
      const setURLParams = jest.fn();
      tagsSectionComponent.setMethods({ setURLParams });

      tagsSectionComponent.vm.goToRecentSection();

      expect(setURLParams).toHaveBeenCalledWith({ section: 'RecentSection', sectionPage: 1 });
      expect(tagsSectionComponent.emitted('sectionChange')).toBeTruthy();
      expect(tagsSectionComponent.emitted('sectionChange')[0][0]).toBe('RecentSection');
    });

    it('getTags: should call getTags and setURLParams', () => {
      const page = 1;
      tagsSectionComponent.vm.getTags({ page });

      expect(tagsSectionComponent.vm.tags).toBe(tags);
      expect(tagsSectionComponent.vm.totalTags).toBe(1);
      expect(tagsSectionComponent.vm.currentPage).toBe(1);
    });

    it('goToPage: should call getTags and setURLParams', () => {
      const page = 2;
      const setURLParams = jest.fn();
      const getTags = jest.fn();
      tagsSectionComponent.setMethods({ setURLParams, getTags });

      tagsSectionComponent.vm.goToPage(page);

      expect(setURLParams).toHaveBeenCalledWith({ sectionPage: page });
      expect(getTags).toHaveBeenCalledWith({ page });
    });

    it('setURLParams: should call router.push with new query parameters', () => {
      const section = 'TagsSection';
      const sectionPage = 2;

      tagsSectionComponent.vm.goToPage(sectionPage);

      expect(pushSpy).toHaveBeenCalledWith({ query: { section, sectionPage } });
    });
  });
});

function createTagsSectionComponent (options = {}) {
  return shallowMount(TagsSection, {
    mocks: {
      $t: key => key,
      $tc: key => key,
      $route: {
        query: { sectionPage: 1 }
      },
      $store: {
        state: {
          client: {
            getTags: (_, callback) => callback(null, null, { result: tags, total: 1 })
          }
        }
      },
      ...options.mocks
    }
  });
}
