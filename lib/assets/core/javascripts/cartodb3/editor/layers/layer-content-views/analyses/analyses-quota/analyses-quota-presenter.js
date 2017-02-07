var _ = require('underscore');
var AnalysesQuotaOptions = require('./analyses-quota-options');
var CONTACT_LINK_TEMPLATE = _.template("<a href='mailto:<%- mail %>'><%- contact %></a>");

var getNoCreditMessage = function (quota, type) {
  var link;
  var message;
  if (quota.totalQuota === 0) {
    link = CONTACT_LINK_TEMPLATE({
      mail: _t('editor.layers.analysis-form.quota.no-credits-mail'),
      contact: _t('editor.layers.analysis-form.quota.no-quota-assigned-contact')
    });
    message = _t('editor.layers.analysis-form.quota.no-quota-assigned-body', {
      analysis: AnalysesQuotaOptions.getAnalysisName(type),
      contact: link
    });
  } else {
    link = CONTACT_LINK_TEMPLATE({
      mail: _t('editor.layers.analysis-form.quota.no-credits-mail'),
      contact: _t('editor.layers.analysis-form.quota.no-credits-contact')
    });
    message = _t('editor.layers.analysis-form.quota.no-credits-body', {
      contact: link
    });
  }

  return message;
};

module.exports = {
  make: function (data) {
    var blockPrice = (data.quotaInfo.blockPrice / 100);
    var estimation = data.estimation;
    var blockSize = data.quotaInfo.blockSize;
    var body = '';
    var type = '';
    var link;

    if (data.quotaInfo.hardLimit) {
      if (data.creditsLeft > 0) {
        if (data.quotaInfo.enoughQuota) {
          // You need to use approximately xxx of your credits.
          body = _t('editor.layers.analysis-form.quota.enough-quota', {
            credits: estimation
          });
          type = 'success';
        } else {
          // We're sorry the current quota is insufficient to enrich your data. Rows will be set to null and analysis may not complete. Please contact us to extend your quota for this function.
          link = CONTACT_LINK_TEMPLATE({
            mail: _t('editor.layers.analysis-form.quota.no-credits-mail'),
            contact: _t('editor.layers.analysis-form.quota.no-credits-contact')
          });

          body = _t('editor.layers.analysis-form.quota.hard-limit-not-enough-quota', {
            contact: link
          });
          type = 'alert';
        }
      } else {
        // To get access to the [service] you will need more credits. Your current quota is not enough. Contact us.
        body = getNoCreditMessage(data.quotaInfo, data.type);
        type = 'alert';
      }
    } else {
      if (data.creditsLeft > 0) {
        if (data.quotaInfo.enoughQuota) {
          // You need to use some of your credits for this (data.estimation)
          body = _t('editor.layers.analysis-form.quota.enough-quota', {
            credits: estimation
          });
          type = 'success';
        } else {
          // Using this analysis component may incur extra fees depending on your account quota. Please review your current quota and/or request a larger allocation.
          body = _t('editor.layers.analysis-form.quota.soft-limit-enough-quota', {
            credits: estimation - data.creditsLeft,
            blockSize: blockSize,
            blockPrice: blockPrice
          });
          type = 'alert';
        }
      } else {
        if (data.quotaInfo.totalQuota === 0) {
          body = getNoCreditMessage(data.quotaInfo, data.type);
        } else {
          // Using this analysis component may incur extra fees depending on your account quota. Please review your current quota and/or request a larger allocation.
          body = _t('editor.layers.analysis-form.quota.soft-limit-enough-quota', {
            credits: estimation - data.creditsLeft,
            blockSize: blockSize,
            blockPrice: blockPrice
          });
        }
        type = 'alert';
      }
    }

    return {
      type: type,
      body: body
    };
  }
};

