import { shallowMount } from '@vue/test-utils';
import SearchSuggestionsItem from 'new-dashboard/components/Search/Suggestions/SearchSuggestionsItem';
import visualizationData from '../../../fixtures/visualizations';
import usersArray from '../../../fixtures/users';

import UserModel from 'dashboard/data/user-model';
import ConfigModel from 'dashboard/data/config-model';

describe('SearchSuggestionsItem.vue', () => {
  let $cartoModels, suggestionItem;

  beforeEach(() => {
    $cartoModels = configCartoModels({ user: usersArray[1] });

    suggestionItem = shallowMount(SearchSuggestionsItem, {
      propsData: { item: visualizationData.visualizations[0] },
      mocks: { $cartoModels }
    });
  });

  it('should render correctly', () => {
    expect(suggestionItem).toMatchSnapshot();
  });

  it('should emit itemClick event when suggestion is clicked', () => {
    suggestionItem.find('.suggestions__item').trigger('click');

    expect(suggestionItem.emitted('itemClick')).toBeTruthy();
  });
});

function configCartoModels (attributes = {}) {
  const user = new UserModel(attributes.user || usersArray[0]);
  const config = new ConfigModel(attributes.config || { maps_api_template: 'http://{user}.example.com' });
  return { user, config };
}
