var StyleGenerator = require('builder/editor/style/style-converter');

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
      polygon: {
        cartocss: '#layer {\npolygon-fill: #000;\npolygon-opacity: 0.4;\npolygon-comp-op: darken;\n}',
        type: 'CartoDB'
      }
    }
  }, {
    style: {
      type: 'simple',
      properties: {
        fill: {
          'color': {
            fixed: '#000',
            opacity: 0.4,
            image: 'http://www.my-server.com/images/image.png'
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-fill: #000;\nmarker-fill-opacity: 0.4;\nmarker-file: url(\'http://www.my-server.com/images/image.png\');\nmarker-allow-overlap: true;\n}',
        type: 'CartoDB'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: #000;\npolygon-opacity: 0.4;\n}',
        type: 'CartoDB'
      }
    }
  }, {
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
      polygon: {
        cartocss: '#layer {\npolygon-fill: #000;\npolygon-opacity: 0.4;\npolygon-comp-op: darken;\n}',
        type: 'CartoDB'
      }
    }
  }, {
    style: {
      type: 'simple',
      properties: {
        fill: {
          'color': {
            attribute: 'address',
            range: ['#B2DF8A', '#FF2900', '#FF0011', '#CCC'],
            domain: ['"_"', '"Albania"', '"Andorra"', 'Luxemburg'],
            opacity: 0.4
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-fill: ramp([address], (#B2DF8A, #FF2900, #FF0011, #CCC), ("_", "Albania", "Andorra", Luxemburg), "=");\nmarker-fill-opacity: 0.4;\nmarker-allow-overlap: true;\n}',
        type: 'CartoDB'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([address], (#B2DF8A, #FF2900, #FF0011, #CCC), ("_", "Albania", "Andorra", Luxemburg), "=");\npolygon-opacity: 0.4;\n}',
        type: 'CartoDB'
      }
    }
  }, {
    style: {
      type: 'simple',
      properties: {
        fill: {
          'color': {
            attribute: 'address',
            range: ['#FFFFFF', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040', '#8E1966', '#6F3072', '#DC1721'],
            domain: ['"one"', '"two"', '"three"', '"four"', '"five"', '"six"', '"seven"', '"eight"', '"nine"', '"ten"'],
            opacity: 0.4
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-fill: ramp([address], (#FFFFFF, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040, #8E1966, #6F3072, #DC1721), ("one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"), "=");\nmarker-fill-opacity: 0.4;\nmarker-allow-overlap: true;\n}',
        type: 'CartoDB'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([address], (#FFFFFF, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040, #8E1966, #6F3072, #DC1721), ("one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"), "=");\npolygon-opacity: 0.4;\n}',
        type: 'CartoDB'
      }
    }
  }, {
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
        cartocss: '#layer {\n}\n#layer::outline {\nline-width: 2;\nline-color: #000;\nline-opacity: 0.4;\n}',
        type: 'CartoDB'
      }
    }
  },
  {
    style: {
      type: 'animation',
      properties: {
        style: 'simple',
        blending: 'lighter',
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
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "count(1)";\n-torque-resolution: 2;\n-torque-data-aggregation: linear;\n}\n#layer {\ncomp-op: lighter;\nmarker-width: 10;\nmarker-fill: #000;\nmarker-fill-opacity: 0.4;\n}',
        type: 'torque'
      }
    }
  },
  {
    style: {
      type: 'animation',
      properties: {
        style: 'heatmap',
        blending: 'lighter',
        fill: {
          'color': {
            attribute: 'cartodb_id',
            bins: 6,
            opacity: 0.4,
            range: ['#4b2991', '#872ca2', '#c0369d', '#ea4f88', '#fa7876', '#f6a97a', '#edd9a3']
          },
          'size': {
            fixed: 10
          },
          'image': null
        },
        stroke: {
          'color': {
            fixed: '#000',
            opacity: 0.4
          },
          'size': {
            fixed: 10
          }
        },
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "count(1)";\n-torque-resolution: 2;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 10;\nmarker-fill: white;\nmarker-fill-opacity: 0.4;\nmarker-file: url(http://localhost.lan/assets/unversioned/images/alphamarker.png);\nimage-filters: colorize-alpha(#4b2991,#872ca2,#c0369d,#ea4f88,#fa7876,#f6a97a,#edd9a3);\n}',
        type: 'torque'
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
              opacity: 0.5
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
          placement: 'vertex'
        }
      }
    },
    result: {
      point: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: rgba(0, 0, 0, 0.5);\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: #111;\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: vertex;\ntext-placement-type: dummy;\n}"
      },
      line: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: rgba(0, 0, 0, 0.5);\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: #111;\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: vertex;\ntext-placement-type: dummy;\n}"
      },
      polygon: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: rgba(0, 0, 0, 0.5);\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: #111;\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: vertex;\ntext-placement-type: dummy;\n}"
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
              fixed: '#FFF',
              opacity: 0
            }
          },
          offset: -10,
          overlap: true,
          placement: 'interior'
        }
      }
    },
    result: {
      point: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: #000;\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: rgba(255, 255, 255, 0);\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: interior;\ntext-placement-type: dummy;\n}"
      },
      line: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: #000;\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: rgba(255, 255, 255, 0);\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: interior;\ntext-placement-type: dummy;\n}"
      },
      polygon: {
        cartocss: "#layer {\n}\n#layer::labels {\ntext-name: [test];\ntext-face-name: 'DejaVu Sans Book';\ntext-size: 10;\ntext-fill: #000;\ntext-label-position-tolerance: 0;\ntext-halo-radius: 1;\ntext-halo-fill: rgba(255, 255, 255, 0);\ntext-dy: -10;\ntext-allow-overlap: true;\ntext-placement: interior;\ntext-placement-type: dummy;\n}"
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
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], range(1, 20));\nmarker-fill: ramp([test], colorbrewer(Greens), 6, jenks);\nmarker-comp-op: multiply;\nmarker-fill-opacity: 0.5;\nmarker-allow-overlap: true;\n}'
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
            attribute: 'cartodb_id',
            bins: 6,
            quantification: 'jenks'
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
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], range(1, 20), jenks(6));\nmarker-fill: ramp([test], (#fabada, black, red, white), jenks);\nmarker-comp-op: multiply;\nmarker-fill-opacity: 0.5;\nmarker-allow-overlap: true;\n}'
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
        fill: {
          size: {
            range: [1, 20],
            attribute: 'cartodb_id',
            bins: 6,
            quantification: 'jenks'
          },
          color: {
            domain: ['a', 'b', 'c'],
            range: ['#fabada', 'black', 'red', 'white'],
            attribute: 'name',
            quantification: 'category',
            opacity: 0.5,
            images: ['image1', 'image2', 'image3', 'otherimage']
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], range(1, 20), jenks(6));\nmarker-fill: ramp([name], (#fabada, black, red, white), (a, b, c), "=", category);\nmarker-fill-opacity: 0.5;\nmarker-file: ramp([name], (url(\'image1\'), url(\'image2\'), url(\'image3\'), url(\'otherimage\')), (a, b, c), "=");\nmarker-allow-overlap: true;\n}'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([name], (#fabada, black, red, white), (a, b, c), "=", category);\npolygon-opacity: 0.5;\n}'
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
            attribute: 'cartodb_id',
            bins: 6,
            quantification: 'category'
          },
          color: {
            domain: [0, 3, 5],
            range: ['#fabada', 'black', 'red', 'white'],
            attribute: 'name',
            quantification: 'category',
            opacity: 0.5,
            images: ['image1', 'image2', 'image3', 'otherimage']
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], range(1, 20), category(6));\nmarker-fill: ramp([name], (#fabada, black, red, white), (0, 3, 5), "=", category);\nmarker-fill-opacity: 0.5;\nmarker-file: ramp([name], (url(\'image1\'), url(\'image2\'), url(\'image3\'), url(\'otherimage\')), (0, 3, 5), "=");\nmarker-allow-overlap: true;\n}'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([name], (#fabada, black, red, white), (0, 3, 5), "=", category);\npolygon-opacity: 0.5;\n}'
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
            attribute: 'cartodb_id',
            bins: 6,
            quantification: 'category'
          },
          color: {
            domain: ['wutang clan', '', 'public enemy'],
            range: ['#fabada', 'black', 'red', 'white'],
            attribute: 'name',
            quantification: 'category',
            opacity: 0.5,
            images: ['image1', 'image2', 'image3', 'otherimage']
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], range(1, 20), category(6));\nmarker-fill: ramp([name], (#fabada, black, red, white), (wutang clan, ' + _t('form-components.editors.fill.input-qualitative-ramps.null') + ', public enemy), "=", category);\nmarker-fill-opacity: 0.5;\nmarker-file: ramp([name], (url(\'image1\'), url(\'image2\'), url(\'image3\'), url(\'otherimage\')), (wutang clan, \'\', public enemy), "=");\nmarker-allow-overlap: true;\n}'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([name], (#fabada, black, red, white), (wutang clan, ' + _t('form-components.editors.fill.input-qualitative-ramps.null') + ', public enemy), "=", category);\npolygon-opacity: 0.5;\n}'
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
            attribute: 'cartodb_id',
            bins: 6,
            quantification: 'jenks'
          },
          color: {
            domain: ['a', 'b', 'c'],
            range: ['#fabada', 'black', 'red', 'white'],
            attribute: 'name',
            quantification: 'category',
            opacity: 0.5,
            images: ['', '', '', '']
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], range(1, 20), jenks(6));\nmarker-fill: ramp([name], (#fabada, black, red, white), (a, b, c), "=", category);\nmarker-fill-opacity: 0.5;\nmarker-allow-overlap: true;\n}'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([name], (#fabada, black, red, white), (a, b, c), "=", category);\npolygon-opacity: 0.5;\n}'
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
            attribute: 'cartodb_id',
            bins: 6,
            quantification: 'jenks'
          },
          color: {
            domain: ['a', 'b', 'c'],
            range: ['#fabada', 'black', 'red', 'white'],
            attribute: 'name',
            quantification: 'category',
            opacity: 0.5,
            images: ['', 'foo', '', '']
          }
        }
      }
    },
    result: {
      point: {
        cartocss: '#layer {\nmarker-width: ramp([cartodb_id], range(1, 20), jenks(6));\nmarker-fill: ramp([name], (#fabada, black, red, white), (a, b, c), "=", category);\nmarker-fill-opacity: 0.5;\nmarker-file: ramp([name], (url(\'foo\')), (b), "=");\nmarker-allow-overlap: true;\n}'
      },
      line: {
        cartocss: '#layer {\n}'
      },
      polygon: {
        cartocss: '#layer {\npolygon-fill: ramp([name], (#fabada, black, red, white), (a, b, c), "=", category);\npolygon-opacity: 0.5;\n}'
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
        cartocss: '#layer {\nline-width: ramp([cartodb_id], range(1, 20));\nline-color: ramp([test], colorbrewer(Greens), 6, jenks);\nline-opacity: 0.5;\n}'
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
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 23,
          steps: 1,
          resolution: 4,
          trails: 0
        },
        fill: {
          'color': {
            range: ['blue', 'cyan', 'lightgreen', 'yellow', 'orange', 'red'],
            opacity: 0.4
          },
          'image': null
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 1;\n-torque-animation-duration: 23;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "count(1)";\n-torque-resolution: 4;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 35;\nmarker-fill: white;\nmarker-fill-opacity: 0.4;\nmarker-file: url(http://localhost.lan/assets/unversioned/images/alphamarker.png);\nmarker-allow-overlap: true;\nimage-filters: colorize-alpha(blue,cyan,lightgreen,yellow,orange,red);\n}',
        type: 'torque'
      }
    }
  },
  {
    // Animated with string columns for fill (no Others)
    style: {
      type: 'animation',
      properties: {
        style: 'simple',
        fill: {
          color: {
            attribute: 'columnA',
            attribute_type: 'string',
            range: ['#5B3F95', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040'],
            domain: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
            opacity: 1
          },
          size: {
            fixed: 7
          },
          image: null
        },
        stroke: {
          color: {
            fixed: '#FFF',
            opacity: 1
          },
          size: {
            fixed: 1
          }
        },
        blending: 'lighter',
        aggregation: {},
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 4,
          trails: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "CDB_Math_Mode(value)";\n-torque-resolution: 4;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 7;\nmarker-fill: ramp([value], (#5B3F95, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040), (1, 2, 3, 4, 5, 6, 7, 8), "=");\nmarker-fill-opacity: 1;\nmarker-line-width: 1;\nmarker-line-color: #FFF;\nmarker-line-opacity: 1;\ncomp-op: lighter;\n}\n#layer[frame-offset=1] {\nmarker-width: 9;\nmarker-fill-opacity: 0.5;\n}\n#layer[frame-offset=2] {\nmarker-width: 11;\nmarker-fill-opacity: 0.25;\n}',
        sql: 'select *, (CASE WHEN "columnA" = \'a\' THEN 1 WHEN "columnA" = \'b\' THEN 2 WHEN "columnA" = \'c\' THEN 3 WHEN "columnA" = \'d\' THEN 4 WHEN "columnA" = \'e\' THEN 5 WHEN "columnA" = \'f\' THEN 6 WHEN "columnA" = \'g\' THEN 7 WHEN "columnA" = \'h\' THEN 8  END) as value FROM (<%= sql %>) __wrapped',
        type: 'torque'
      }
    }
  },
  {
    // Animated with string columns for fill (double quoted, no Others)
    style: {
      type: 'animation',
      properties: {
        style: 'simple',
        fill: {
          color: {
            attribute: 'columnA',
            attribute_type: 'string',
            range: ['#5B3F95', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040'],
            domain: ['"a"', '"b"', '"c"', '"d"', '"e"', '"f"', '"g"', null],
            opacity: 1
          },
          size: {
            fixed: 7
          },
          image: null
        },
        stroke: {
          color: {
            fixed: '#FFF',
            opacity: 1
          },
          size: {
            fixed: 1
          }
        },
        blending: 'lighter',
        aggregation: {},
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 4,
          trails: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "CDB_Math_Mode(value)";\n-torque-resolution: 4;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 7;\nmarker-fill: ramp([value], (#5B3F95, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040), (1, 2, 3, 4, 5, 6, 7, 8), "=");\nmarker-fill-opacity: 1;\nmarker-line-width: 1;\nmarker-line-color: #FFF;\nmarker-line-opacity: 1;\ncomp-op: lighter;\n}\n#layer[frame-offset=1] {\nmarker-width: 9;\nmarker-fill-opacity: 0.5;\n}\n#layer[frame-offset=2] {\nmarker-width: 11;\nmarker-fill-opacity: 0.25;\n}',
        sql: 'select *, (CASE WHEN "columnA" = \'a\' THEN 1 WHEN "columnA" = \'b\' THEN 2 WHEN "columnA" = \'c\' THEN 3 WHEN "columnA" = \'d\' THEN 4 WHEN "columnA" = \'e\' THEN 5 WHEN "columnA" = \'f\' THEN 6 WHEN "columnA" = \'g\' THEN 7 WHEN "columnA" is NULL THEN 8  END) as value FROM (<%= sql %>) __wrapped',
        type: 'torque'
      }
    }
  },
  {
    // Animated with number columns for fill
    style: {
      type: 'animation',
      properties: {
        style: 'simple',
        fill: {
          color: {
            attribute: 'columnA',
            attribute_type: 'number',
            range: ['#5B3F95', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040'],
            domain: [0.1, 0.2, 0.3, 0.4, 0.1, 0.5, 0.8, 0.4],
            opacity: 1
          },
          size: {
            fixed: 7
          },
          image: null
        },
        stroke: {
          color: {
            fixed: '#FFF',
            opacity: 1
          },
          size: {
            fixed: 1
          }
        },
        blending: 'lighter',
        aggregation: {},
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 4,
          trails: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "CDB_Math_Mode(value)";\n-torque-resolution: 4;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 7;\nmarker-fill: ramp([value], (#5B3F95, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040), (1, 2, 3, 4, 5, 6, 7, 8), "=");\nmarker-fill-opacity: 1;\nmarker-line-width: 1;\nmarker-line-color: #FFF;\nmarker-line-opacity: 1;\ncomp-op: lighter;\n}\n#layer[frame-offset=1] {\nmarker-width: 9;\nmarker-fill-opacity: 0.5;\n}\n#layer[frame-offset=2] {\nmarker-width: 11;\nmarker-fill-opacity: 0.25;\n}',
        sql: 'select *, (CASE WHEN "columnA" = 0.1 THEN 1 WHEN "columnA" = 0.2 THEN 2 WHEN "columnA" = 0.3 THEN 3 WHEN "columnA" = 0.4 THEN 4 WHEN "columnA" = 0.1 THEN 5 WHEN "columnA" = 0.5 THEN 6 WHEN "columnA" = 0.8 THEN 7 WHEN "columnA" = 0.4 THEN 8  END) as value FROM (<%= sql %>) __wrapped',
        type: 'torque'
      }
    }
  },
  {
    // Animated with others, number columns for fill
    style: {
      type: 'animation',
      properties: {
        style: 'simple',
        fill: {
          color: {
            attribute: 'columnA',
            attribute_type: 'number',
            range: ['#555', '#5B3F95', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040', '#8E1966', '#6F3072'],
            domain: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            opacity: 1
          },
          size: {
            fixed: 7
          },
          image: null
        },
        stroke: {
          color: {
            fixed: '#FFF',
            opacity: 1
          },
          size: {
            fixed: 1
          }
        },
        blending: 'lighter',
        aggregation: {},
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 4,
          trails: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "CDB_Math_Mode(value)";\n-torque-resolution: 4;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 7;\nmarker-fill: ramp([value], (#555, #5B3F95, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040, #8E1966, #6F3072), (1, 2, 3, 4, 5, 6, 7, 8, 9, 10), "=");\nmarker-fill-opacity: 1;\nmarker-line-width: 1;\nmarker-line-color: #FFF;\nmarker-line-opacity: 1;\ncomp-op: lighter;\n}\n#layer[frame-offset=1] {\nmarker-width: 9;\nmarker-fill-opacity: 0.5;\n}\n#layer[frame-offset=2] {\nmarker-width: 11;\nmarker-fill-opacity: 0.25;\n}',
        sql: 'select *, (CASE WHEN "columnA" = 1 THEN 1 WHEN "columnA" = 2 THEN 2 WHEN "columnA" = 3 THEN 3 WHEN "columnA" = 4 THEN 4 WHEN "columnA" = 5 THEN 5 WHEN "columnA" = 6 THEN 6 WHEN "columnA" = 7 THEN 7 WHEN "columnA" = 8 THEN 8 WHEN "columnA" = 9 THEN 9 WHEN "columnA" = 10 THEN 10  ELSE 11  END) as value FROM (<%= sql %>) __wrapped',
        type: 'torque'
      }
    }
  },
  {
    // Animated with others, string columns for fill
    style: {
      type: 'animation',
      properties: {
        style: 'simple',
        fill: {
          color: {
            attribute: 'columnA',
            attribute_type: 'string',
            range: ['#555', '#5B3F95', '#1D6996', '#129C63', '#73AF48', '#EDAD08', '#E17C05', '#C94034', '#BA0040', '#8E1966', '#6F3072'],
            domain: ['"1"', '"2"', '"3"', '"4"', '"5"', '"6"', '"7"', '"8"', '"9"', '"10"'],
            opacity: 1
          },
          size: {
            fixed: 7
          },
          image: null
        },
        stroke: {
          color: {
            fixed: '#FFF',
            opacity: 1
          },
          size: {
            fixed: 1
          }
        },
        blending: 'lighter',
        aggregation: {},
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 4,
          trails: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 256;\n-torque-animation-duration: 30;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "CDB_Math_Mode(value)";\n-torque-resolution: 4;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 7;\nmarker-fill: ramp([value], (#555, #5B3F95, #1D6996, #129C63, #73AF48, #EDAD08, #E17C05, #C94034, #BA0040, #8E1966, #6F3072), (1, 2, 3, 4, 5, 6, 7, 8, 9, 10), "=");\nmarker-fill-opacity: 1;\nmarker-line-width: 1;\nmarker-line-color: #FFF;\nmarker-line-opacity: 1;\ncomp-op: lighter;\n}\n#layer[frame-offset=1] {\nmarker-width: 9;\nmarker-fill-opacity: 0.5;\n}\n#layer[frame-offset=2] {\nmarker-width: 11;\nmarker-fill-opacity: 0.25;\n}',
        sql: 'select *, (CASE WHEN "columnA" = \'1\' THEN 1 WHEN "columnA" = \'2\' THEN 2 WHEN "columnA" = \'3\' THEN 3 WHEN "columnA" = \'4\' THEN 4 WHEN "columnA" = \'5\' THEN 5 WHEN "columnA" = \'6\' THEN 6 WHEN "columnA" = \'7\' THEN 7 WHEN "columnA" = \'8\' THEN 8 WHEN "columnA" = \'9\' THEN 9 WHEN "columnA" = \'10\' THEN 10  ELSE 11  END) as value FROM (<%= sql %>) __wrapped',
        type: 'torque'
      }
    }
  },

  // Heatmap animated
  {
    style: {
      type: 'animation',
      properties: {
        style: 'heatmap',
        aggregation: {},
        fill: {
          color: {
            range: ['blue', 'cyan', 'lightgreen', 'yellow', 'orange', 'red'],
            opacity: 0.4
          },
          image: null
        },
        animated: {
          attribute: 'test',
          overlap: false,
          duration: 23,
          steps: 248,
          resolution: 2,
          trails: 2
        }
      }
    },
    result: {
      point: {
        cartocss: 'Map {\n-torque-frame-count: 248;\n-torque-animation-duration: 23;\n-torque-time-attribute: "test";\n-torque-aggregation-function: "count(1)";\n-torque-resolution: 2;\n-torque-data-aggregation: linear;\n}\n#layer {\nmarker-width: 35;\nmarker-fill: white;\nmarker-fill-opacity: 0.4;\nmarker-file: url(http://localhost.lan/assets/unversioned/images/alphamarker.png);\nimage-filters: colorize-alpha(blue,cyan,lightgreen,yellow,orange,red);\n}\n#layer[frame-offset=1] {\nmarker-width: 37;\nmarker-fill-opacity: 0.2;\n}\n#layer[frame-offset=2] {\nmarker-width: 39;\nmarker-fill-opacity: 0.1;\n}',
        type: 'torque'
      }
    }
  }
];
