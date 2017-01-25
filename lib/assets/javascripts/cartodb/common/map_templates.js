
/**
 *  Map templates
 *
 *  It will display all the possibilities to select
 *  any of your current datasets or connect a new dataset.
 *
 */

module.exports = [
  {
    name: 'Create animated maps',
    short_name: 'Create animated maps',
    description: 'Learn how to animate your data, by using historic United States tornado data.',
    short_description: 'Create maps for showing events over time',
    icon: 'snake',
    color: '#CB3F29',
    difficulty: 'easy',
    duration: '5:01',
    videoId: '122308083',
    map: {
      url: 'https://examples.carto.com/viz/960736aa-cd8c-11e4-a309-0e6e1df11cbf/embed_map',
      source: [
        'https://examples.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20tornado_centroids&filename=tornados&format=geojson'
      ]
    }
  },
  {
    name: 'Animate the life of a cat',
    short_name: 'Create GPS Data maps',
    description: 'Let\'s take a look at one week of movements for a cat named Spencer. Using GPS collected data, we can animate Spencer over time to see his patterns of exploration in his neighborhood.',
    short_description: 'Mapping your GPS data was never so easy!',
    icon: 'points',
    color: '#AC638B',
    difficulty: 'easy',
    duration: '1:53',
    videoId: '122308076',
    map: {
      url: 'https://examples.carto.com/viz/00c8701c-c121-11e4-b828-0e4fddd5de28/embed_map',
      source: [
        'https://examples.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20spencer_the_cat&filename=spencer_the_cat&format=geojson'
      ]
    }
  },
  {
    name: 'Create your own data using the CARTO Editor',
    short_name: 'Create your own datasets',
    description: 'Learn to create your own point, line, or polygon dataset directly in the CARTO editor.',
    short_description: ' Add and style features in a map using the CARTO UI',
    icon: 'notes',
    color: '#F2C000',
    difficulty: 'easy',
    duration: '5:39',
    videoId: '122308073',
    map: {
      url: 'https://examples.carto.com/viz/eaa226aa-cd8e-11e4-893e-0e0c41326911/embed_map'
    }
  },
  {
    name: 'Map your local world',
    short_name: 'Map your local world',
    description: "We will use a publically available set of buildings to map Nantucket Island. Then we will use CARTO's annotation tools to highlight our point of interest.",
    short_description: 'Learn to create and style a map of your city',
    icon: 'mountain',
    color: '#EA703D',
    difficulty: 'easy',
    duration: '2:57',
    videoId: '122308073',
    map: {
      url: 'https://examples.carto.com/viz/b8847e3e-c1f4-11e4-8c09-0e853d047bba/embed_map',
      source: [
        'https://examples.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20structures_poly_197&filename=buildings_nantucket&format=geojson'
      ]
    }
  },
  {
    name: 'Create your first choropleth map using Table Join',
    short_name: 'Join Datasets',
    description: 'Create your first choropleth map by joining historic tornado data with United States polygons',
    short_description: 'Build your first choropleth map by joining two datasets',
    icon: 'rectangles',
    color: '#86B765',
    difficulty: 'medium',
    duration: '5:17',
    videoId: '122308079',
    map: {
      url: 'https://examples.carto.com/viz/339c7670-cd90-11e4-ab8c-0e018d66dc29/embed_map',
      source: [
        'https://examples.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20tornado_centroids&filename=tornados&format=geojson',
        'https://examples.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20tornados_in_us&filename=tornados_us&format=geojson'
      ]
    }
  },
  {
    name: 'Map your MailChimp Campaigns',
    short_name: 'Map MailChimp Campaigns',
    description: 'Create a map of where your subscribers are and which of them have opened any of your campaigns. Also this is a great way to learn about conditional styling.',
    short_description: 'Map your engagement using the MailChimp Connector.',
    icon: 'email',
    color: '#AC638B',
    difficulty: 'easy',
    duration: '1:49',
    videoId: '125895396',
    map: {
      url: 'https://examples.carto.com/viz/560de38c-ea88-11e4-aac4-0e5e07bb5d8a/embed_map',
      source: []
    }
  }
]
