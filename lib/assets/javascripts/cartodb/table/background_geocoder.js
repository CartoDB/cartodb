
  /**
   *  Background geocoder to show the geocoding progress
   *
   *  - It needs a geocoder model.
   *
   *  new cdb.admin.BackgroundGeocoder({ model: geocoder })
   *
   */

  cdb.admin.BackgroundGeocoder = cdb.core.View.extend({

    events: {
      'click a.cancel': '_onCancel'
    },

    className: "background_importer",

    initialize: function() {
      _.bindAll(this, "show", "hide", "_onCancel");

      // Dropdown template
      this.template_base = cdb.templates.getTemplate(this.options.template_base);
    },

    render: function() {
      if (!this.model.isNew()) {
        var content = this.template_base(this.model.toJSON());
        this.$el.html(content);
        
        this.$el.stop()
          .css({opacity: 1})
          .animate({
            bottom: "20px"
          }, 500);

        this.delegateEvents();
      }
      
      return this;
    },

    // when the importer is a geocoder bind its stats
    bindGeocoder: function() {
      var self = this;

      this.model.bind('geocodingStarted', this.changeState, this);
      this.model.bind('geocodingChange', this._setProgress, this);
      this.model.bind('geocodingReset geocodingComplete geocodingError', this.hide, this);
    },

    // Show progress but don't render again
    // the whole component
    _setProgress: function() {
      var attrs = this.model.toJSON();

      if (attrs.total_rows) {
        this.$('label.count').text(" " + attrs.processed_rows + "/" + attrs.total_rows);
      }
      
      if (attrs.state == "completed") {
        this.$('label.strong.light').html('FINISHING');
        this.$('label.count').remove();
      }

      if (!this.started) {
        this.changeState();
      }
    },

    changeState: function() {
      var self = this;

      this.started = true;

      this.$el.stop().animate({opacity: 0}, 150, function(){
        self.render();
      });
    },

    _onCancel: function(e) {
      e.preventDefault();
      this.model.cancelGeocoding(); // Cancel geocoding
      this.hide();
    },

    hide: function() {
      var self = this;
      this.started = false;
      this.$el.stop().animate({
        opacity: 0,
        bottom: "-35px"
      }, 500);
    }

  });
