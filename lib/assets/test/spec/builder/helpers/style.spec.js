
var Backbone = require('backbone');
var StyleHelper = require('builder/helpers/style');

describe('helpers/style', function () {
  describe('heatmap', function () {
    var styleModel = new Backbone.Model({
      type: 'heatmap',
      fill: {
        color: {
          attribute: 'cartodb_id',
          bins: '5',
          opacity: 1,
          quantification: 'equal',
          range: ['#ecda9a', '#f1b973', '#f7945d', '#f86f56', '#ee4d5a']
        },
        size: {
          fixed: 7.5
        }
      }
    });

    it('can get color objects from colors range', function () {
      var colors = StyleHelper.getColorsFromRange(styleModel);
      expect(colors).toEqual([
        {color: '#ecda9a'}, {color: '#f1b973'}, {color: '#f7945d'}, {color: '#f86f56'}, {color: '#ee4d5a'}
      ]);
    });
  });
});
