var StyleGenerator = require('../../../../../javascripts/cartodb3/editor/style/style-converter');

module.exports = [
  {
    style: {
      type: 'simple',
      properties: {
        fill: {
          'color': {
            fixed: '#000',
            opacity: 0.4
          },
          'image': null
        },
        blending: 'darken'
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-fill: #000;\nmarker-fill-opacity: 0.4;\nmarker-allow-overlap: true;\nmarker-comp-op: darken;\n}',
        type: 'CartoDB'
      },
      /*
       line: {
        cartocss: '#layer {\n}',
        type: 'CartoDB'
      },
      */
      polygon: {
        cartocss: '#layer {\npolygon-fill: #000;\npolygon-opacity: 0.4;\npolygon-comp-op: darken;\n}',
        type: 'CartoDB'
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        fill: {
          'color': {
            attribute: 'address',
            range: ['#B2DF8A', '#FF2900', '#FF0011', '#CCC'],
            domain: ['_', 'Albania', 'Andorr"a', 'Lu\nxemb\'urg'],
            opacity: 0.4
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-fill: ramp([address], (#B2DF8A, #FF2900, #FF0011, #CCC), ("_", "Albania", "Andorr\\"a", "Lu\\nxemb\'urg"));\nmarker-fill-opacity: 0.4;\nmarker-allow-overlap: true;\n}',
        type: 'CartoDB'
      },
      /* line: {
        cartocss: "#layer {\nline-color: ramp([address], ('#B2DF8A','#FF2900', '#FF0011', '#CCC'), ('_', 'Albania', 'Andorra', 'Luxemburg'));\nline-opacity: 0.4;\n}",
        type: 'CartoDB'
      }, */
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([address], (#B2DF8A, #FF2900, #FF0011, #CCC), ("_", "Albania", "Andorr\\"a", "Lu\\nxemb\'urg"));\npolygon-opacity: 0.4;\n}',
        type: 'CartoDB'
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        stroke: {
          'size': {
            fixed: 2
          },
          'color': {
            fixed: '#000',
            opacity: 0.4
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-line-width: 2;\nmarker-line-color: #000;\nmarker-line-opacity: 0.4;\n}',
        type: 'CartoDB'
      },
      line: {
        cartocss: '#layer {\nline-width: 2;\nline-color: #000;\nline-opacity: 0.4;\n}',
        type: 'CartoDB'
      },
      polygon: {
        cartocss: '#layer {\nline-width: 2;\nline-color: #000;\nline-opacity: 0.4;\n}',
        type: 'CartoDB'
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        fill: {
          'color': {
            fixed: '#000',
            opacity: 0.4
          },
          'size': {
            fixed: 10
          },
          'image': null
        },
        animated: {
          enabled: true,
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 2,
          trails: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "count(1)";\n-torque-resolution: 2;\n-torque-data-aggregation: linear;\n}#layer {\nmarker-width: 10;\nmarker-fill: #000;\nmarker-fill-opacity: 0.4;\nmarker-allow-overlap: true;\n}\n#layer[frame-offset=1] {\nmarker-width: 12;\nmarker-fill-opacity: 0.5;\n}\n#layer[frame-offset=2] {\nmarker-width: 14;\nmarker-fill-opacity: 0.25;\n}',
        type: 'torque'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: #000;\npolygon-opacity: 0.4;\n}'
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        labels: {
          enabled: true,
          attribute: null,
          font: 'DejaVu Sans Book',
          fill: {
            'size': {
              fixed: 10
            },
            'color': {
              fixed: '#000',
              opacity: 1
            }
          },
          halo: {
            'size': {
              fixed: 1
            },
            'color': {
              fixed: '#111',
              opacity: 1
            }
          },
          offset: -10,
          overlap: true,
          placement: 'point'
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\n}\n#layer::labels {\n}'
      },
      line: {
        cartocss: '#layer {\n}\n#layer::labels {\n}'
      },
      polygon: {
        cartocss: '#layer {\n}\n#layer::labels {\n}'
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        labels: {
          enabled: true,
          attribute: 'test',
          font: 'DejaVu Sans Book',
          fill: {
            'size': {
              fixed: 10
            },
            'color': {
              fixed: '#000',
              opacity: 1
            }
          },
          halo: {
            'size': {
              fixed: 1
            },
            'color': {
              fixed: '#111',
              opacity: 1
            }
          },
          offset: -10,
          overlap: true,
          placement: 'point'
        }
      }
    },
    result: {
      point: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: #000;\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: #111;\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: point;\ntext-placement-type: dummy;\n}"
      },
      line: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: #000;\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: #111;\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: point;\ntext-placement-type: dummy;\n}"
      },
      polygon: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: #000;\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: #111;\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: point;\ntext-placement-type: dummy;\n}"
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        fill: {
          size: {
            range: [1, 20],
            attribute: 'cartodb_id'
          },
          color: {
            range: 'colorbrewer(Greens)',
            attribute: 'test',
            bins: 6,
            operation: 'multiply',
            quantification: 'jenks',
            opacity: 0.5
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], 1, 20);\nmarker-fill: ramp([test], colorbrewer(Greens), 6, jenks);\nmarker-comp-op: multiply;\nmarker-fill-opacity: 0.5;\nmarker-allow-overlap: true;\n}'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([test], colorbrewer(Greens), 6, jenks);\npolygon-comp-op: multiply;\npolygon-opacity: 0.5;\n}'
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        fill: {
          size: {
            range: [1, 20],
            attribute: 'cartodb_id'
          },
          color: {
            range: ['#fabada', 'black', 'red', 'white'],
            attribute: 'test',
            bins: 6,
            operation: 'multiply',
            quantification: 'jenks',
            opacity: 0.5
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], 1, 20);\nmarker-fill: ramp([test], (#fabada, black, red, white), jenks);\nmarker-comp-op: multiply;\nmarker-fill-opacity: 0.5;\nmarker-allow-overlap: true;\n}'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([test], (#fabada, black, red, white), jenks);\npolygon-comp-op: multiply;\npolygon-opacity: 0.5;\n}'
      }
    }
  },
  {
    style: {
      type: 'simple',
      properties: {
        stroke: {
          size: {
            range: [1, 20],
            attribute: 'cartodb_id'
          },
          color: {
            range: 'colorbrewer(Greens)',
            attribute: 'test',
            bins: 6,
            operation: 'multiply',
            quantification: 'jenks',
            opacity: 0.5
          }
        }
      }
    },
    result: {
      // point: { cartocss: '#layer {\n}'},
      line: {
        cartocss: '#layer {\nline-width: ramp([cartodb_id], 1, 20);\nline-color: ramp([test], colorbrewer(Greens), 6, jenks);\nline-opacity: 0.5;\n}'
      }
      // polygon: {}
    }
  },
  {
    style: {
      type: 'hexabins',
      properties: {
        aggregation: {
          size: 100,
          value: {
            operator: 'count',
            attribute: 'test'
          }
        },
        fill: {
          'color': {
            fixed: '#000',
            opacity: 0.4
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\npolygon-fill: #000;\npolygon-opacity: 0.4;\n}',
        sql: 'WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(!bbox!, CDB_XYZ_Resolution(12) * 100), CDB_XYZ_Resolution(12) * 100) as cell) SELECT hgrid.cell as the_geom_webmercator, count(1) as agg_value, count(1)/power( 100 * CDB_XYZ_Resolution(12), 2 ) as agg_value_density, row_number() over () as cartodb_id FROM hgrid, (<%= sql %>) i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell'
      }
    }
  },
  {
    style: {
      type: 'regions',
      properties: {
        aggregation: {
          dataset: 'provinces',
          value: {
            operator: 'sum',
            attribute: 'testing'
          }
        },
        fill: {
          'color': {
            fixed: '#000',
            opacity: 0.4
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\npolygon-fill: #000;\npolygon-opacity: 0.4;\n}',
        sql: 'SELECT _poly.*, _merge.points_agg/GREATEST(0.0000026, ST_Area((ST_Transform(the_geom, 4326))::geography)) as agg_value_density, _merge.points_agg as agg_value FROM aggregation.agg_admin1 _poly, lateral (\nSELECT sum(testing) points_agg FROM (<%= sql %>) _point where ST_Contains(_poly.the_geom_webmercator, _point.the_geom_webmercator) ) _merge'
      }
    }
  },
  {
    style: {
      type: 'none'
    },
    result: {
      point: {
        cartocss: StyleGenerator.GENERIC_STYLE,
        type: 'CartoDB'
      },
      line: {
        cartocss: StyleGenerator.GENERIC_STYLE,
        type: 'CartoDB'
      },
      polygon: {
        cartocss: StyleGenerator.GENERIC_STYLE,
        type: 'CartoDB'
      }
    }
  },
  {
    style: {
      type: 'heatmap',
      properties: {
        aggregation: {
          size: 99,
          value: {
            operation: 'count',
            attribute: 'test'
          }
        },
        fill: {
          'color': {
            range: ['blue', 'cyan', 'lightgreen', 'yellow', 'orange', 'red'],
            opacity: 0.4
          },
          'image': null
        }
        /*
          animated: {
          enabled: true,
          attribute: 'test',
          overlap: 'linear',
          duration: 30,
          steps: 256,
          resolution: 2,
          trails: 2
        }
        */
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 1;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "count(1)";\n-torque-resolution: 99;\n-torque-data-aggregation: linear;\n}#layer {\nmarker-width: 35;\nmarker-fill: white;\nmarker-fill-opacity: 0.4;\nmarker-file: url(http://s3.amazonaws.com/com.cartodb.assets.static/alphamarker.png);\nmarker-allow-overlap: true;\nimage-filters: colorize-alpha(blue,cyan,lightgreen,yellow,orange,red);\n}',
        type: 'torque'
      }
    }
  }
/*
{
style: {
  type: 'squares',
  aggregation: {
    aggr_size: {
      size: {
        fixed: 100
      },
      distance_unit: {
        fixed: 'meters'
      }
    }
  },
  properties: {
    fill: {
      'color': {
        fixed: '#000',
        opacity: 0.4
      }
    }
  }
},
result: {
  point: {
    cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "count(1)";\n-torque-resolution: 2;\n-torque-data-aggregation: linear;\n}#layer {\nmarker-fill: #000;\nmarker-fill-opacity: 0.4;\n}'
  }
}
}
*/
];
