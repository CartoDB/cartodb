var moment = require('moment');
var Backbone = require('backbone');
var DashboardInfoView = require('cdb/geo/ui/dashboard-info-view');

describe('cdb/geo/ui/dashboard-info-view', function() {

  beforeEach(function() {
    var yesterday = moment().subtract(1, 'days').format(); // 2015-11-26T13:19:32+01:00
    var model = new Backbone.Model({
      title: 'Mapaza',
      description: 'Lorem ipsum...',
      updatedAt: yesterday
    });
    this.view = new DashboardInfoView({
      model: model
    });

    this.view.render();
  });

  it('should render properly', function() {
    expect(this.view.$el.find('.Dashboard-info-title').text()).toEqual('Mapaza');
    expect(this.view.$el.find('.Dashboard-info-description').text()).toEqual('Lorem ipsum...');
    expect(this.view.$el.find('.Dashboard-info-update').text()).toEqual('UPDATED a day ago');
  });

  it('should collapse the view', function() {
    expect(this.view.$el.hasClass('is-active')).toBeFalsy();

    this.view.$el.find('.js-toggle-view-link').click();

    expect(this.view.$el.hasClass('is-active')).toBeTruthy();

    this.view.$el.find('.js-toggle-view-link').click();

    expect(this.view.$el.hasClass('is-active')).toBeFalsy();
  });
});
