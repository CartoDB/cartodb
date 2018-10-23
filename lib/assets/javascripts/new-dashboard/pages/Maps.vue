<template>
  <div class="container grid">
    <MapCard :map=test size=medium></MapCard>
    <MapCard :map=test2 size=medium></MapCard>
    <MapCard :map=test></MapCard>
    <MapCard :map=test2></MapCard>
    <MapCard :map=test></MapCard>
    <MapCard :map=test2></MapCard>
    <MapCard :map=test></MapCard>
    <MapCard :map=test2></MapCard>
  </div>
</template>

<script>
import MapCard from '../components/MapCard';

export default {
  name: 'MapsPage',
  components: {
    MapCard
  },
  computed: {
    test: () =>
      ({
        thumbnailUrl: 'https://carto.com/help/images/building-maps/add-columns-from-second-dataset/join-columns.png',
        name: 'NYC Stores Sales Dashboard',
        description: 'Real-time comparison of Nordstrom stores sales numbers and more stuff related with business insights. Real-time comparison of Nordstrom stores sales numbers and more stuff related with business insights',
        favorite: true,
        tagList: ['test', 'this is my test', 'first map', 'CARTO', 'Another tag to make a bit of space'],
        views: 23,
        id: '9c16cddc-12a1-4060-a4d4-3ec096a04c9a',
        display_name: null,
        map_id: '41f2bc03-530a-440e-94c3-b97a424f85df',
        active_layer_id: null,
        type: 'derived',
        tags: [],
        privacy: 'LINK',
        created_at: '2018-10-16T10:22:09.453Z',
        updated_at: '2018-10-16T10:22:09.453Z',
        locked: false,
        source: null,
        title: null,
        license: null,
        attributions: null,
        kind: 'geom',
        external_source: {},
        url: 'http://jesusorg.localhost.lan:3000/u/jesusowner/viz/9c16cddc-12a1-4060-a4d4-3ec096a04c9a/map',
        version: 3,
        prev_id: null,
        next_id: null,
        parent_id: null,
        transition_options: {},
        active_child: null,
        children: [],
        likes: 0,
        synchronization: null,
        uses_builder_features: true,
        liked: false,
        permission: {
          id: 'edc4d325-2ef9-42a0-8f47-48a0eeffff67',
          owner: {
            id: '30f8755a-ec51-4231-80b4-92f2d21eb347',
            name: 'Jesús7',
            last_name: 'Botella8',
            username: 'jesusowner',
            email: 'jesusowner@jesusowner.com',
            avatar_url: '/assets/unversioned/images/avatars/avatar_marker_green.png',
            website: 'https://jesusbotella.es6',
            description: 'Test description3',
            location: 'Madrid, Spain',
            twitter_username: 'sn00b4',
            disqus_shortname: '5',
            available_for_hire: true,
            base_url: 'http://jesusorg.localhost.lan:3000/u/jesusowner',
            google_maps_query_string: null,
            quota_in_bytes: 1073741824,
            table_count: 148,
            viewer: false,
            org_admin: true,
            public_visualization_count: 9,
            all_visualization_count: 81,
            org_user: true,
            remove_logo: false,
            db_size_in_bytes: 134336512
          },
          entity: {
            id: '9c16cddc-12a1-4060-a4d4-3ec096a04c9a',
            type: 'vis'
          },
          acl: [],
          created_at: '2018-10-16T10:22:09.455Z',
          updated_at: '2018-10-16T10:22:09.455Z'
        }
      }),
    test2: () =>
      ({
        thumbnailUrl: 'https://carto.com/help/images/building-maps/builder-viz-workshop/01-torque-04.png',
        name: 'Mi mapaza',
        description: 'This mapaza is just a test of a place holder 1, 2, 3 probando probando 1, 2',
        favorite: true,
        tagList: [],
        views: 23,
        id: '9c16cddc-12a1-4060-a4d4-3ec096a04c9a',
        display_name: null,
        map_id: '41f2bc03-530a-440e-94c3-b97a424f85df',
        active_layer_id: null,
        type: 'derived',
        tags: [],
        privacy: 'PASSWORD',
        created_at: '2018-10-16T10:22:09.453Z',
        updated_at: '2018-10-16T10:22:09.453Z',
        locked: false,
        source: null,
        title: null,
        license: null,
        attributions: null,
        kind: 'geom',
        external_source: {},
        url: 'http://jesusorg.localhost.lan:3000/u/jesusowner/viz/9c16cddc-12a1-4060-a4d4-3ec096a04c9a/map',
        version: 3,
        prev_id: null,
        next_id: null,
        parent_id: null,
        transition_options: {},
        active_child: null,
        children: [],
        likes: 0,
        synchronization: null,
        uses_builder_features: true,
        liked: false,
        permission: {
          id: 'edc4d325-2ef9-42a0-8f47-48a0eeffff67',
          owner: {
            id: '30f8755a-ec51-4231-80b4-92f2d21eb347',
            name: 'Jesús7',
            last_name: 'Botella8',
            username: 'jesusowner',
            email: 'jesusowner@jesusowner.com',
            avatar_url: '/assets/unversioned/images/avatars/avatar_marker_green.png',
            website: 'https://jesusbotella.es6',
            description: 'Test description3',
            location: 'Madrid, Spain',
            twitter_username: 'sn00b4',
            disqus_shortname: '5',
            available_for_hire: true,
            base_url: 'http://jesusorg.localhost.lan:3000/u/jesusowner',
            google_maps_query_string: null,
            quota_in_bytes: 1073741824,
            table_count: 148,
            viewer: false,
            org_admin: true,
            public_visualization_count: 9,
            all_visualization_count: 81,
            org_user: true,
            remove_logo: false,
            db_size_in_bytes: 134336512
          },
          entity: {
            id: '9c16cddc-12a1-4060-a4d4-3ec096a04c9a',
            type: 'vis'
          },
          acl: [],
          created_at: '2018-10-16T10:22:09.455Z',
          updated_at: '2018-10-16T10:22:09.455Z'
        }
      })
  }
};
</script>
