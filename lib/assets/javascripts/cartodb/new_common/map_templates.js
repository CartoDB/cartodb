
/**
 *  Map templates
 *
 *  It will display all the possibilities to select
 *  any of your current datasets or connect a new dataset.
 *
 */

module.exports = [
  {
    name: 'Animate Your Data',
    short_name: 'Animate Your Data',
    description: 'Learn to animate your data by date using historic United States tornado data.',
    short_description: '',
    icon: 'Snake',
    color: '#CB3F29',
    video: {
      id: '122308083',
      steps: []
    },
    map: {
      url: 'http://team.cartodb.com/u/santiagoa/viz/48f5ec04-c1ec-11e4-8acb-0e9d821ea90d/public_map',
      source: 'https://team.cartodb.com/u/santiagoa/tables/tornado_centroids/public'
    }
  },
  {
    name: 'Animate the life of a cat',
    short_name: 'Animate point',
    description: 'Let\'s take a look at one week of movement data for a cat named Spencer. Using GPS collected data, we can animate Spencer over time to see his patterns of exploration in his neighborhood.',
    short_description: 'Animate point',
    icon: 'Points',
    color: '#AC638B',
    video: {
      id: '122308076',
      steps: []
    },
    map: {
      url: 'http://examples.cartodb.com/viz/00c8701c-c121-11e4-b828-0e4fddd5de28/embed_map',
      source: 'https://examples.cartodb.com/tables/spencer_the_cat/public'
    }
  },
  {
    name: 'Create your own data in the CartoDB editor',
    short_name: 'Create your own data',
    description: 'Learn to create your own point, line, and polygon data directly in the CartoDB editor',
    short_description: '',
    icon: 'Notes',
    color: '#F2C000',
    video: {
      id: '122308073',
      steps: []
    },
    map: {
      url: 'http://team.cartodb.com/u/santiagoa/viz/c7c65efe-c360-11e4-b724-0e0c41326911/public_map'
    }
  },
  {
    name: 'Map your local world',
    short_name: 'Map your local world',
    description: "We will use a publically available set of buildings to map Nantucket Island. Then we will use CartoDB's annotation tools to highlight our point of interest.",
    short_description: '',
    icon: 'Mountain',
    color: '#EA703D',
    video: {
      id: '122308081',
      steps: []
    },
    map: {
      url: 'http://examples.cartodb.com/viz/b8847e3e-c1f4-11e4-8c09-0e853d047bba/embed_map',
      source: 'http://examples.cartodb.com/tables/structures_poly_197/public'
    }
  },
  {
    name: 'Create your first choropleth using Table Join',
    short_name: 'Create your first choropleth',
    description: 'Create your first choropleth map by joining historic tornado data with United States polygons',
    short_description: '',
    short_description: 'Choropleth',
    icon: 'Rectangles',
    color: '#86B765',
    video: {
      id: '122308079',
      steps: []
    },
    map: {
      url: 'http://team.cartodb.com/u/santiagoa/viz/796425b2-c355-11e4-91a6-0e0c41326911/public_map',
      source: 'https://team.cartodb.com/u/santiagoa/tables/tornado_centroids/public',
      source2: 'http://team.cartodb.com/u/santiagoa/tables/tornados_in_us/public'
    }
  }
]