describe("Sublayer", function() {
  var layerDefinition, sublayer;

  beforeEach(function() {
    var layer_definition = {
      version: '1.0.0',
      stat_tag: 'vis_id',
      layers: [
        {
          type: 'cartodb',
          options: {
            sql: 'select * from ne_10m_populated_places_simple',
            cartocss: '#layer { marker-fill: red; }',
            interactivity: ['test', 'cartodb_id']
          }
        },
        {
          type: 'cartodb',
          options: {
            sql: "select * from european_countries_export",
            cartocss: '#layer { polygon-fill: #000; polygon-opacity: 0.8;}',
            cartocss_version : '2.0.0',
            interactivity: ['       test2    ', 'cartodb_id2']
          }
        }
      ]
    };

    _.extend(LayerDefinition.prototype, Backbone.Events);

    layerDefinition = new LayerDefinition(layer_definition, {
      tiler_domain: "cartodb.com",
      tiler_port: "8081",
      tiler_protocol: "http",
      user_name: 'rambo',
      no_cdn: true,
      subdomains: [null]
    });

    sublayer = layerDefinition.getSubLayer(0);
  });

  describe('event binding', function() {

    var events = [
      ['featureOver'],
      ['featureOut'],
      ['featureClick'],
      ['layermouseover', 'mouseover'],
      ['layermouseout', 'mouseout']
    ];

    events.forEach(function(event) {
      var signal = event[0];
      var alias = event[1] || signal;

      it("should respond to " + signal + " events on the layer if the position matches", function(done) {
        sublayer.on(alias, function(index) {
          expect(index).toEqual(0);
          done();
        });

        layerDefinition.trigger(signal, 0);
      });

      it("should NOT respond to " + signal + " events on the layer if the position doesn't match", function() {
        var callback = jasmine.createSpy('callback');

        sublayer.on(alias, function(){
          callback();
        });

        layerDefinition.trigger(signal, 1);

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('.remove', function() {

    it('should throw and error if layer was already removed', function() {
      sublayer.remove()

      // Try to remove again
      expect(function() {
        sublayer.remove();
      }).toThrow('sublayer was removed');

    });

    it('should remove itself from the layer', function() {
      sublayer.remove()

      expect(layerDefinition.getSubLayerCount()).toEqual(1);
      expect(layerDefinition.getSubLayer(0)).not.toEqual(sublayer);
    });

    it('should unbind the interaction', function() {
      spyOn(sublayer, '_unbindInteraction');

      sublayer.remove();

      expect(sublayer._unbindInteraction).toHaveBeenCalled();
    });

    it('should trigger a "remove" event', function(done) {
      var callback = function(subl) {
        expect(subl).toEqual(sublayer);
        done();
      };
      
      sublayer.on('remove', callback);

      sublayer.remove();
    });
  });

  describe('.toggle', function() {

    it('should show or hide the sublayer', function() {
      sublayer.set('hidden', false);

      sublayer.toggle();

      expect(sublayer.get('hidden')).toEqual(true);

      sublayer.toggle();

      expect(sublayer.get('hidden')).toEqual(false);
    });
  });

  describe('.show', function() {

    it('should show the layer', function() {
      sublayer.set('hidden', true);

      sublayer.show();

      expect(sublayer.get('hidden')).toBeUndefined();
    })
  });

  describe('.hide', function() {

    it('should hide the layer', function() {
      sublayer.set('hidden', false);

      sublayer.hide();

      expect(sublayer.get('hidden')).toEqual(true);
    })
  });

  describe('.set', function() {

    it('should throw an error if the sublayer was removed', function() {
      sublayer.remove();

      expect(function() {
        sublayer.set({ wadus: true });
      }).toThrow('sublayer was removed');
    });

    it('should set the attribute', function() {
      sublayer.set({ wadus: true });

      expect(sublayer.get('wadus')).toEqual(true);
    });

    it('should trigger a "change:visibility" event if the visibility has changed', function(done) {
      var callback = function(subl, hidden) {
        expect(subl).toEqual(sublayer);
        expect(hidden).toEqual(true);
        done();
      }

      sublayer.on('change:visibility', callback);

      sublayer.set({ hidden: true });
    });
  });

  describe('.unset', function() {

    it('should delete an attribute', function() {
      sublayer.set({ wadus: true });
      expect(sublayer.get('wadus')).toEqual(true);

      sublayer.unset('wadus');

      expect(sublayer.get('wadus')).toBeUndefined();
    });
  });

  describe('.setSQL', function() {

    it('should set the SQL attribute', function() {
      sublayer.setSQL('wadus');

      expect(sublayer.get('sql')).toEqual('wadus');
    });
  });


  describe('.setCartoCSS', function() {

    it('should set the cartocss attribute', function() {
      sublayer.setCartoCSS('wadus');

      expect(sublayer.get('cartocss')).toEqual('wadus');
    });
  });

  describe('.setInteractivity', function() {

    it('should set the interactivity attribute', function() {
      sublayer.setInteractivity('wadus');

      expect(sublayer.get('interactivity')).toEqual('wadus');
    })
  });

  describe('.setInteraction', function() {

    it('should set the interactivity attribute', function() {
      sublayer.setInteractivity('wadus');

      expect(sublayer.get('interactivity')).toEqual('wadus');
    })
  });

  describe('.get', function() {

    it('should throw and error if layer was already removed', function() {
      sublayer.remove()

      // Try to remove again
      expect(function() {
        sublayer.get('wadus');
      }).toThrow('sublayer was removed');

    });
  });
});

