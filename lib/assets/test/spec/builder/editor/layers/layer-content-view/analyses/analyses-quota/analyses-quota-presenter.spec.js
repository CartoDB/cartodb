var Backbone = require('backbone');
var AnalysesQuotaPresenter = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-presenter');

describe('editor/layers/layer-content-view/analyses/analyses-quota/analyses-quota-presenter', function () {
  var configModel = new Backbone.Model({
    cartodb_com_hosted: false
  });

  var userModel = {
    isInsideOrg: function () {
      return false;
    },
    isOrgOwner: function () {
      return false;
    }
  };

  it('Hard limit, enough quota', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: true,
        hardLimit: true,
        totalQuota: 2000,
        usedQuota: 1800
      },
      creditsLeft: 200
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.enough-quota');
    expect(message.type).toBe('success');
  });

  it('Hard limit, not enough quota', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: false,
        hardLimit: true,
        totalQuota: 2000,
        usedQuota: 1800
      },
      creditsLeft: 100
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.hard-limit-not-enough-quota');
    expect(message.type).toBe('alert');
  });

  it('Hard limit, not quota', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: true,
        hardLimit: true,
        totalQuota: 2000,
        usedQuota: 2000
      },
      creditsLeft: 0
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.no-credits-body');
    expect(message.type).toBe('alert');
  });

  it('Hard limit, not quota assigned', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: false,
        hardLimit: true,
        totalQuota: 0,
        usedQuota: 0
      },
      creditsLeft: 0
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.no-quota-assigned-body');
    expect(message.type).toBe('alert');
  });

  it('Soft limit, enough quota', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: true,
        hardLimit: false,
        totalQuota: 2000,
        usedQuota: 1800
      },
      creditsLeft: 200
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.enough-quota');
    expect(message.type).toBe('success');
  });

  it('Soft limit, not enough quota', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: false,
        hardLimit: false,
        totalQuota: 2000,
        usedQuota: 1900
      },
      creditsLeft: 100
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.soft-limit-enough-quota');
    expect(message.type).toBe('alert');
  });

  it('Soft limit, not quota', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: false,
        hardLimit: false,
        totalQuota: 2000,
        usedQuota: 2000
      },
      creditsLeft: 0
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.soft-limit-enough-quota');
    expect(message.type).toBe('alert');
  });

  it('Soft limit, not quota assigned', function () {
    var payload = {
      estimation: 127,
      quotaInfo: {
        blockPrice: 0,
        blockSize: 1000,
        enoughQuota: false,
        hardLimit: false,
        totalQuota: 0,
        usedQuota: 0
      },
      creditsLeft: 0
    };

    var message = AnalysesQuotaPresenter.make(payload, configModel, userModel);
    expect(message.body).toBe('editor.layers.analysis-form.quota.no-quota-assigned-body');
    expect(message.type).toBe('alert');
  });
});
