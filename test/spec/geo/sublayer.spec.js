describe('Sublayers', function() {
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

    layerDefinition = new LayerDefinition(layer_definition, {});

    sublayer = layerDefinition.getSubLayer(0);
  });

  describe('SubLayerFactory', function() {

    it('should return a CartoDBSublayer', function() {
      var sublayer = SubLayerFactory.createSublayer('', layerDefinition, 0);
      expect(sublayer instanceof CartoDBSubLayer).toBeTruthy();

      var sublayer = SubLayerFactory.createSublayer('mapnik', layerDefinition, 0);
      expect(sublayer instanceof CartoDBSubLayer).toBeTruthy();

      var sublayer = SubLayerFactory.createSublayer('cartodb', layerDefinition, 0);
      expect(sublayer instanceof CartoDBSubLayer).toBeTruthy();
    });

    it('should return an HttpSublayer', function() {
      var sublayer = SubLayerFactory.createSublayer('http', layerDefinition, 0);
      expect(sublayer instanceof HttpSubLayer).toBeTruthy();
    });

    it('should be case insensitive', function() {
      var sublayer = SubLayerFactory.createSublayer('cARToDB', layerDefinition, 0);
      expect(sublayer instanceof CartoDBSubLayer).toBeTruthy();
    });

    it('should throw an error if type is not supported', function() {
      expect(function() {
        SubLayerFactory.createSublayer('unsupported type');
      }).toThrow('Sublayer type not supported');
    })
  });

  describe('SublayerBase', function() {

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

    describe('.isVisible', function() {

      it('should return true if sublayer is visible', function() {
        sublayer.set({'hidden': undefined});

        expect(sublayer.isVisible()).toBeTruthy();

        sublayer.set({'hidden': false});

        expect(sublayer.isVisible()).toBeTruthy();
      });

      it('should return false if sublayer is hidden', function() {
        sublayer.set({'hidden': true});

        expect(sublayer.isVisible()).toBeFalsy();
      });
    })

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

  describe('CartoDBSubLayer', function() {

    describe('toJSON', function() {

      it('should serialize the sublayer', function() {
        expect(sublayer.toJSON()).toEqual({
          type: 'cartodb',
          options: {
            sql: 'select * from ne_10m_populated_places_simple',
            cartocss: '#layer { marker-fill: red; }',
            cartocss_version: '2.1.0',
            interactivity: ['test', 'cartodb_id']
          }
        });
      });

      it('should include the cartocss_version if present', function() {
        sublayer.set({
          cartocss_version: 'X.X.X',
        });

        expect(sublayer.toJSON().options.cartocss_version).toEqual('X.X.X');
      }),

      it('should set the default cartocss_version if not present', function() {
        expect(sublayer.toJSON().options.cartocss_version).toEqual('2.1.0');
      }),

      it('should include attributes option if interactivity is present', function() {
        sublayer.set({
          interactivity: [],
          attributes: ['column1', 'column2']
        });

        expect(sublayer.toJSON().options.attributes).toBeUndefined();

        sublayer.set({
          interactivity: ['column1'],
          attributes: ['column1', 'column2']
        });

        expect(sublayer.toJSON().options.attributes).toEqual({
          id: 'cartodb_id',
          columns: ['column1', 'column2']
        });
      });

      it('should include attributes option when there are attributes', function() {
        sublayer.set({
          interactivity: ['column1'],
          attributes: undefined
        });

        expect(sublayer.toJSON().options.attributes).toBeUndefined();
      })

      it('should include geometry options if raster option is true', function() {
        sublayer.set({raster: true});

        expect(sublayer.toJSON().options.geom_column).toEqual("the_raster_webmercator");
        expect(sublayer.toJSON().options.geom_type).toEqual("raster");
        expect(sublayer.toJSON().options.cartocss_version).toEqual('2.3.0');
        expect(sublayer.toJSON().options.raster_band).toEqual(0);
      });

      it('should include geometry options with a given cartocss_version if raster option is true', function() {
        sublayer.set({
          raster: true,
          raster_band: 2,
          cartocss_version: '2.4.0'
        });

        expect(sublayer.toJSON().options.geom_column).toEqual("the_raster_webmercator");
        expect(sublayer.toJSON().options.geom_type).toEqual("raster");
        expect(sublayer.toJSON().options.cartocss_version).toEqual('2.4.0');
        expect(sublayer.toJSON().options.raster_band).toEqual(2);
      });
    });

    describe('isValid', function() {

      it('should return true if the required options are present', function() {
        expect(sublayer.isValid()).toBeTruthy();
      });

      it('should return false if any of the required options are not present', function() {
        var cartocss = sublayer.get('cartocss');

        sublayer.set({ cartocss: undefined });
        expect(sublayer.isValid()).toBeFalsy();

        sublayer.set({
          sql: undefined,
          cartocss: cartocss,
        });

        expect(sublayer.isValid()).toBeFalsy();
      });
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

    describe('.infowindow', function() {

      it('should be a Backbone model with the infowindow', function() {
        var fields = [
          {
            position: 1,
            name: "city",
            title: true
          }
        ];
        layerDefinition.layers[0].infowindow = {
          fields: fields
        }

        // Force the initialization of the sublayer
        layerDefinition.layers[0].sub = undefined;

        var sublayer = layerDefinition.getSubLayer(0);

        expect(sublayer.infowindow instanceof Backbone.Model).toBeTruthy();
        expect(sublayer.infowindow.get('fields')).toEqual(fields);
      });

      it('should update the infowindow in the layer definition if the infowindow changes', function() {
        sublayer.infowindow.set({fields: 'wadus'});

        expect(sublayer._parent.getLayer(sublayer._position).infowindow).toEqual({
          fields: 'wadus'
        });
      });
    });

    describe('.setSQL', function() {

      it('should set the SQL attribute', function() {
        sublayer.setSQL('wadus');

        expect(sublayer.get('sql')).toEqual('wadus');
        expect(sublayer.getSQL()).toEqual('wadus');
      });
    });

    describe('.setCartoCSS', function() {

      it('should set the cartocss attribute', function() {
        sublayer.setCartoCSS('wadus');

        expect(sublayer.get('cartocss')).toEqual('wadus');
        expect(sublayer.getCartoCSS()).toEqual('wadus');
      });
    });

    describe('.setInteractivity', function() {

      it('should set the interactivity attribute', function() {
        sublayer.setInteractivity('wadus');

        expect(sublayer.get('interactivity')).toEqual('wadus');
      })
    });

    describe('.getInteractivity', function() {

      it('should return undefined when no interactivity is present', function() {
        sublayer.setInteractivity(undefined);

        expect(sublayer.getInteractivity()).toBeUndefined();
      });

      it('should convert string with fields to array', function() {
        sublayer.setInteractivity('field1, field2');

        expect(sublayer.getInteractivity()).toEqual(['field1', 'field2']);
      });

      it('should remove whitespaces from field names', function() {
        sublayer.setInteractivity(['     field1     ', '             field2']);

        expect(sublayer.getInteractivity()).toEqual(['field1', 'field2']);
      });
    });

    describe('.getAttributes', function() {

      it('should return the attributes from the definition if present and remove whitespaces from columns', function() {
        sublayer.set({
          attributes: [' field1     ', 'field2']
        });

        expect(sublayer.getAttributes()).toEqual(['field1', 'field2']);
      });

      it('should return the attributes from the infowindow fields', function() {
        sublayer.infowindow.set('fields', [ { name: 'field1        '}, { name: '    field2 '}]);

        expect(sublayer.getAttributes()).toEqual(['field1', 'field2']);
      });
    });

    describe('.setInteraction', function() {

      it('should set the interactivity attribute', function() {
        sublayer.setInteractivity('wadus');

        expect(sublayer.get('interactivity')).toEqual('wadus');
      })
    });
  });

  describe('HttpSubLayer', function() {

    beforeEach(function() {
      var layer_definition = {
        version: '1.0.0',
        stat_tag: 'vis_id',
        layers: [
          {
            type: 'http',
            options: {
              urlTemplate: "http://{s}.example.com/{z}/{x}/{y}.png",
              subdomains: ['a', 'b', 'c'],
              tms: false
            },
          }
        ]
      };

      layerDefinition = new LayerDefinition(layer_definition, {});

      sublayer = layerDefinition.getSubLayer(0);
    });

    describe('toJSON', function() {

      it('should serialize the sublayer', function() {
        expect(sublayer.toJSON()).toEqual({
          type: 'http',
          options: {
            urlTemplate: "http://{s}.example.com/{z}/{x}/{y}.png",
            subdomains: ['a', 'b', 'c'],
            tms: false
          }
        })
      })

      it('should not include optional params if not present', function() {
        sublayer.set({
          subdomains: undefined,
          tms: undefined
        });

        expect(sublayer.toJSON()).toEqual({
          type: 'http',
          options: {
            urlTemplate: "http://{s}.example.com/{z}/{x}/{y}.png"
          }
        })
      });
    });

    describe('isValid', function() {

      it('should return true if the required options are present', function() {
        expect(sublayer.isValid()).toBeTruthy();
      });

      it('should return false if any of the required options are not present', function() {
        sublayer.set({ urlTemplate: undefined });
        expect(sublayer.isValid()).toBeFalsy();
      });
    });

    describe('event binding', function() {

      it("should NOT respond to events on the layer", function() {
        var callback = jasmine.createSpy('callback');

        sublayer.on('featureOver', function(){
          callback();
        });

        layerDefinition.trigger('featureOver', 0);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('.setURLTemplate', function(){

      it('should set the urlTemplate attribute', function() {
        sublayer.setURLTemplate('template');

        expect(sublayer.get('urlTemplate')).toEqual('template');
        expect(sublayer.getURLTemplate()).toEqual('template');
      });
    });

    describe('.setSubdomains', function() {

      it('should set the subdomains attribute', function() {
        sublayer.setSubdomains('subdomains');

        expect(sublayer.get('subdomains')).toEqual('subdomains');
        expect(sublayer.getSubdomains()).toEqual('subdomains');
      });
    });

    describe('.setTms', function() {

      it('should set the tmps attribute', function() {
        sublayer.setTms('tms');

        expect(sublayer.get('tms')).toEqual('tms');
        expect(sublayer.getTms()).toEqual('tms');
      });
    });
  });
});
