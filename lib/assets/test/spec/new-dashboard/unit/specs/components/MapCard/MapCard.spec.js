import { shallowMount } from '@vue/test-utils';
import { forceChildToEmitEvent } from '../../../utils/forceChildToEmitEvent';
import MapCard from 'new-dashboard/components/MapCard/MapCard.vue';
import visualization from '../../fixtures/visualizations';

describe('MapCard.vue', () => {
  const map = visualization.visualizations[0];
  let mapCardWrapper;
  beforeEach(() => {
  });
  it('should render the simple version by default', () => {
    mapCardWrapper = shallowMount(MapCard, { propsData: { map } });
    expect(mapCardWrapper.find({name: 'SimpleMapCard'}).exists()).toBeTruthy();
    expect(mapCardWrapper.find({name: 'CondensedMapCard'}).exists()).toBeFalsy();
  });

  it('should render the condensed version when the condensed flag is true', () => {
    mapCardWrapper = shallowMount(MapCard, { propsData: { map, condensed: true } });
    expect(mapCardWrapper.find({name: 'SimpleMapCard'}).exists()).toBeFalsy();
    expect(mapCardWrapper.find({name: 'CondensedMapCard'}).exists()).toBeTruthy();
  });
  it('should emit the toggleSelection event', () => {
    mapCardWrapper = shallowMount(MapCard, { propsData: { map } });
    forceChildToEmitEvent(mapCardWrapper, 'toggleSelection', {map: 'dummy_map', selected: true});
    expect(mapCardWrapper.emitted().toggleSelection).toBeTruthy();
  });

  it('onContentChanged: should emit a contentChanged event when DatasetCard emits it', () => {
    const map = visualization.visualizations[0];
    mapCardWrapper = shallowMount(MapCard, { propsData: { map } });

    mapCardWrapper.vm.onContentChanged();

    expect(mapCardWrapper.emitted('contentChanged')).toBeTruthy();
  });
});
