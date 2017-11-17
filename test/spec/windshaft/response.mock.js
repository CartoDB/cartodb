module.exports = {
  'layergroupid': '2edba0a73a790c4afb83222183782123:1508164637676',
  'metadata': {
    'layers': [
      {
        'type': 'mapnik',
        'id': '6d21d64e-8216-4645-9301-d57f991c02a3',
        'meta': {
          'cartocss': '#layer {\nmarker-color: red;\n}',
          'stats': {
            'estimatedFeatureCount': 10031
          },
          'cartocss_meta': {
            'rules': []
          }
        }
      }
    ],
    'dataviews': {},
    'analyses': [
      {
        'nodes': {
          'a1': {
            'status': 'ready',
            'url': {
              'http': 'http://3.ashbu.cartocdn.com/iago-carto/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/analysis/node/dc2b9be10f88baa5b0156f2530f9b978b47a2a23',
              'https': 'https://cartocdn-ashbu_d.global.ssl.fastly.net/iago-carto/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/analysis/node/dc2b9be10f88baa5b0156f2530f9b978b47a2a23'
            },
            'query': 'SELECT * FROM table'
          }
        }
      }
    ]
  },
  'cdn_url': {
    'templates': {
      'http': {
        'url': 'http://{s}.ashbu.cartocdn.com',
        'subdomains': [
          '0',
          '1',
          '2',
          '3'
        ]
      },
      'https': {
        'url': 'https://cartocdn-ashbu_{s}.global.ssl.fastly.net',
        'subdomains': [
          'a',
          'b',
          'c',
          'd'
        ]
      }
    },
    'http': 'ashbu.cartocdn.com',
    'https': 'cartocdn-ashbu.global.ssl.fastly.net'
  },
  'last_updated': '2017-10-16T14:37:17.676Z'
};
