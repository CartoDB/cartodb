<template>
  <section class="section">
    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <SectionTitle title='Your Maps' description="This is a description test">
          <template slot="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path d="M0 0h24v24H0z" fill="transparent"/>
              <path d="M20.55 17.83A1 1 0 0 0 21 17V3a1 1 0 0 0-1.55-.83l-5.4 3.6-4.43-3.55c-.17-.13-.37-.2-.58-.21-.21 0-.42.05-.6.16l-6 4A1 1 0 0 0 2 7v14a1 1 0 0 0 1.56.83l5.39-3.6 4.43 3.55A1 1 0 0 0 14 22c.2 0 .4-.06.55-.18zM4 7.53l4-2.66v11.6l-4 2.66zm9 11.39l-3-2.4V5.08l3 2.4zm6-2.46l-4 2.67V7.53l4-2.66z" fill="#2E3C43"/>
            </svg>
          </template>
          <template slot="dropdownButton">
            <button class="button button--ghost">
              <span class="button-icon">
                <svg width="18" height="20" viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg">
                  <g fill="#036FE2" fill-rule="evenodd">
                    <path d="M8.3 6.7l1.4-1.4L5 .58.3 5.29l1.4 1.42L4 4.4v11.6h2V4.4zM16.3 13.3L14 15.58V4h-2V15.6l-2.3-2.3-1.4 1.42 4.7 4.7 4.7-4.7z"/>
                  </g>
                </svg>
              </span>
            </button>
            <div class="head-sectionDropdown">
              <div class="head-sectionDropdownCategory">
                <h6 class="text is-xsmall is-txtGreyLight u-tupper letter-spacing">Show Me</h6>
                <ul class="head-sectionDropdownList">
                  <li class="text is-caption is-txtGrey is-selected">All applications</li>
                  <li class="text is-caption is-txtGrey">Favorites only</li>
                  <li class="text is-caption is-txtGrey">Shared with you</li>
                </ul>
              </div>
              <div class="head-sectionDropdownCategory">
                <h6 class="text is-xsmall is-txtGreyLight u-tupper letter-spacing">Order</h6>
                <ul class="head-sectionDropdownList">
                  <li class="text is-caption is-txtGrey is-selected">Alphabetically</li>
                  <li class="text is-caption is-txtGrey">Newest first</li>
                  <li class="text is-caption is-txtGrey">Oldest first</li>
                  <li class="text is-caption is-txtGrey">Most views first</li>
                </ul>
              </div>
            </div>
          </template>
          <template slot="primaryButton">
            <button class="button">
              Test
            </button>
          </template>
        </SectionTitle>
      </div>
      <MapCard :map=test size=medium></MapCard>
      <MapCard :map=test2 size=medium></MapCard>
      <MapCard :map=test></MapCard>
      <MapCard :map=test2></MapCard>
      <MapCard :map=test></MapCard>
      <MapCard :map=test2></MapCard>
      <MapCard :map=test></MapCard>
      <MapCard :map=test2></MapCard>
    </div>
  </section>
</template>

<script>
import MapCard from '../components/MapCard';
import SectionTitle from '../components/SectionTitle';

export default {
  name: 'MapsPage',
  components: {
    MapCard,
    SectionTitle
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
