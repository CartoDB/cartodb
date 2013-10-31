
  /**
   *  Background geocoder now extends from
   *  background importer
   */

  cdb.admin.BackgroundGeocoder = cdb.core.View.extend({

    events: {
      'click a.cancel': '_showCancel'
    },

    className: "background_importer",

    initialize: function() {
      _.bindAll(this, "show", "hide", "changeState");

      // Dropdown template
      this.template_base = cdb.templates.getTemplate(this.options.template_base);
    },

    render: function() {
      var content = this.template_base(this.model.toJSON());
      this.$el.html(content);

      //HACK: change this or test it
      if (content.length > 50) {
        this.$el.stop()
          .css({opacity: 1})
          .animate({
            bottom: "0px"
          }, 500);

        this.delegateEvents();
      }
      
      return this;
    },

    // when the importer is a geocoder bind its stats
    bindGeocoder: function() {
      var self = this;

      this.model.bind('geocodingStarted', function() {
        self.changeState();
        self._showProgress();
      }, this);

      this.model.bind('geocodingChange', function() {
        self._setProgress();
      }, this);

      this.model.bind('geocodingReset geocodingComplete geocodingFailed', function() {
        self.hide();
      }, this);

      this.bind('canceled', function() {
        self.model.trigger('geocodingCanceled');
      });
    },

    // Show progress but don't render again
    // the whole component
    _setProgress: function() {
      var attrs = this.model.toJSON();
      this.$('label.count').text(attrs.processed_rows + "/" + attrs.total_rows);
    },

    // Show progress bar
    _showProgress: function() {
      this.$el
        .css({opacity: 1})
        .animate({
          bottom: "0px"
        }, 500);
    },

    changeState: function() {
      var _self = this;

      this.$el.stop().animate({opacity: 0}, 150, function(){
        _self.render();
      });
    },

    _showCancel: function(ev) {
      ev.preventDefault();
      this.trigger('canceled');
      this.hide();
    },

    hide: function() {
      var self = this;
      this.$el.stop().animate({
        opacity: 0,
        bottom: "-35px"
      }, 500);
    }

  });
