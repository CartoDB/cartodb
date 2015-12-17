var moment = require('moment');
var cdb = require('cartodb.js');
var DashboardInfoView = require('app/dashboard-info-view');

describe('app/dashboard-info-view', function () {
  beforeEach(function () {
    var yesterday = moment().subtract(1, 'days').format(); // 2015-11-26T13:19:32+01:00
    var model = new cdb.Backbone.Model({
      title: 'Mapaza',
      description: 'Lorem ipsum...',
      updatedAt: yesterday
    });
    this.view = new DashboardInfoView({
      model: model
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.find('.CDB-Dashboard-infoTitle').text()).toEqual('Mapaza');
    expect(this.view.$el.find('.CDB-Dashboard-infoDescription').text()).toEqual('Lorem ipsum...');
    expect(this.view.$el.find('.CDB-Dashboard-infoUpdate').text()).toEqual('UPDATED a day ago');
  });

  it('should collapse the view', function () {
    expect(this.view.$el.hasClass('is-active')).toBeFalsy();

    this.view.$el.find('.js-toggle-view-link').first().click();

    expect(this.view.$el.hasClass('is-active')).toBeTruthy();

    this.view.$el.find('.js-toggle-view-link').first().click();

    expect(this.view.$el.hasClass('is-active')).toBeFalsy();
  });
});
