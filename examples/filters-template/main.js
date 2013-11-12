

  $(document).ready(function() {

    var Template = cdb.core.View.extend({

      initialize: function() {
        this._initElements();
      },

      _initElements: function() {
        this.filters = new Filters({ el: this.$('#filters') });
        this.map = new Map({ el: this.$('#map'), filters: this.filters });
      }
    });

    window.template = new Template({ el: document.body });
  })



  /**
   *  Map
   */

  var Map = cdb.core.View.extend({

    initialize: function() {
      _.bindAll(this, '_initMap');
      this.filters = this.options.filters;
      this._getVizJson();
      this._bindEvents();
    },

    _getVizJson: function() {
      $.ajax({
        url: 'data.json',
        success: this._initMap,
        error: function() {
          cdb.log.info('problems getting vizjson info, check tools.json url please')
        }
      })
    },

    _initMap: function(data) {
      var self = this;
      cartodb.createVis(this.$el, data.vizjson)
        .done(function(vis, layers) {
          self.layers = layers[1];
          self.map = vis.getNativeMap();
        });
    },

    _bindEvents: function() {
      this.filters.bind('change', this._changeLayerGroup, this);
    },

    _changeLayerGroup: function(layers) {
      var self = this;

      _.each(layers, function(opts, i) {
        var pos = i.split('-')[1];
        var sublayer = self.layers.getSubLayer(pos);

        if (sublayer) {
          sublayer.set(opts);
        }
      });
    }

  })


  /**
   *  Filters
   */

  var Filters = cdb.core.View.extend({

    initialize: function() {
      _.bindAll(this, 'render');
      this._getActions();
    },

    render: function(data) {
      this.clearSubViews();

      var self = this;

      if (!data.interactions) return false;
      var buttons = data.interactions;

      for (var i = 0, l = buttons.length; i < l; i++) {
        var a = new FiltersItem({ data: buttons[i] });
        a.bind('change', this._triggerChange, this)
        self.addView(a);
        self.$('ul').append(a.render().el);
      }

      return this;
    },

    _triggerChange: function(d) {
      this._setSelectedFilter(d);
      this.trigger('change', d.layers, this);
    },

    _setSelectedFilter: function(d) {
      this.$('ul li a').removeClass('selected');
      this.$('ul li a').each(function(i,a) {
        if ($(a).text() == d.text && $(a).attr('class') == d.className) {
          $(a).addClass('selected')
        }
      })
    },

    _getActions: function() {
      $.ajax({
        url: 'data.json',
        success: this.render,
        error: function() {
          cdb.log.info('oh no!, check your json location or if you are using a web server (Apache?)')
        }
      })
    }
  })




  var FiltersItem = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click': '_onClick'
    },

    initialize: function() {
      _.bindAll(this, '_onClick');
      this.data = this.options.data;
    },

    render: function() {
      var $a = $('<a>');
      $a
        .addClass(this.data.className)
        .text(this.data.text)
        .attr('href', '#/' + this.data.text.replace(/ /gi,'-'));

      this.$el.append($a);

      return this;
    },

    _onClick: function(e) {
      this.killEvent(e);
      this.trigger('change', this.data, this);
    }

  })