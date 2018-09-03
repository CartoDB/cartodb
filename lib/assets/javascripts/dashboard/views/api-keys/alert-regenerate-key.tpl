<div class="CDB-Text Dialog-header u-inner">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-keys"></i>
  </div>
  <p class="Dialog-headerTitle u-ellipsLongText">
    <%= _t('dashboard.views.api_keys.alert_regen_key.about_regen') %>
  </p>
  <p class="Dialog-headerText">
    <%= _t('dashboard.views.api_keys.alert_regen_key.sure') %>
  </p>
</div>

<div class="Dialog-footer u-inner">
  <button type="button" class="CDB-Button CDB-Button--secondary js-cancel">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.api_keys.alert_regen_key.cancel') %></span>
  </button>
  <button type="button" class="CDB-Button CDB-Button--error js-submit">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%= _t('dashboard.views.api_keys.alert_regen_key.regen') %></span>
  </button>
</div>
