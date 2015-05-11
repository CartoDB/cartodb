var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 *  Video steps view
 *
 *  It will show the video progress and the video
 *  steps included in the model
 *
 */

module.exports = cdb.core.View.extend({

  className: 'VideoSteps',
  
  initialize: function() {
    this.video = this.options.video;
    this.templateModel = this.options.templateModel;
    this.model = new cdb.core.Model({
      duration: 0,
      percent: 0,
      seconds: 0
    });
    this.template = cdb.templates.getTemplate('common/views/create/video_steps');
    this._initBinds();
    this._loadScript();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.template({
        duration: this.model.get('duration'),
        steps: this.templateModel.get('video').steps
      })
    );
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Create tooltips
    var self = this;
    var $progress = this.$('.VideoSteps-progress');
    _.each(this.templateModel.get('video').steps, function(step, i) {
      var $el = $progress.find('[data-title="' + step.msg + '"]');
      self.addView(
        new cdb.common.TipsyTooltip({
          el: $el,
          trigger: 'manual',
          title: function(e) { return $(this).attr('data-title') }
        })
      );
    });
  },

  _initBinds: function() {
    this.model.bind('change:duration', this.render, this);
    this.model.bind('change:percent', this._changeProgress, this);
    this.model.bind('change:seconds', this._checkTooltips, this);
  },

  _checkTooltips: function() {
    var current = this.model.get('seconds');
    var $progress = this.$('.VideoSteps-progress');
    _.each(this.templateModel.get('video').steps, function(step, i) {
      var $el = $progress.find('[data-title="' + step.msg + '"]');
      
      // Show tooltip
      if ((step.seconds < current) && !step.showing && !step.displayed) {
        step.showing = true;
        step.displayed = true;
        $el.tipsy('show');
        
        setTimeout(function() {
          $el.tipsy('hide');
          step.showing = false;
        }, 2000);
      } else if (step.seconds > current) {
        step.displayed = false;
      }
      
      // Make it highlighted or not
      $el[((step.seconds - 2) < current) ? 'addClass' : 'removeClass' ]('is-highlighted');
    });
  },

  _changeProgress: function() {
    this.$('.VideoSteps-progressBar').css('width', (this.model.get('percent') * 100) + "%");
  },

  _loadScript: function() {
    var self = this;
    $.getScript('//f.vimeocdn.com/js/froogaloop2.min.js', function() {
      self._initVideoBinds();
    });
  },

  _initVideoBinds: function() {
    var player = $f(this.video[0]);
    var self = this;

    player.addEvent('ready', function() {
      player.api('getDuration', function(dur) {
        self.model.set('duration', dur);
      });

      player.addEvent('playProgress', function(m) {
        self.model.set(m);
      });
    });
  },

  _removeVideoBinds: function() {
    var player = $f(this.video[0]);
    player.removeEvent('ready');
    player.removeEvent('playProgress');
  },

  clean: function() {
    this._removeVideoBinds();
    this.elder('clean');
  }

});