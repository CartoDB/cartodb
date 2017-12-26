<div class="u-flex u-alignCenter Modal-basemapContainer">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor Modal-titleBasemap"><%- _t('components.modals.add-basemap.mapbox.insert') %></h3>
  <div class="CDB-Text u-flex u-alignCenter ">
    <label class="Metadata-label Metadata-label--big CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"><%- _t('components.modals.add-basemap.mapbox.enter') %></label>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="CDB-InputText CDB-Text js-url" value="<%- url %>" placeholder="<%- _t('components.modals.add-basemap.xyz.eg') %> username.ab12cd3">
    </div>
  </div>
  <div class="u-tSpace-xl CDB-Text u-flex u-alignCenter">
    <label class="Metadata-label Metadata-label--big CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"><%- _t('components.modals.add-basemap.mapbox.enter-token') %></label>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="CDB-InputText CDB-Text js-access-token" value="<%- accessToken %>" placeholder="<%- _t('components.modals.add-basemap.xyz.eg') %> pk.bfg32ewdsadeyJ1Ijoi…">
      <div class="XYZPanel-error CDB-InfoTooltip CDB-InfoTooltip--left is-error CDB-Text CDB-Size-medium CDB-InfoTooltip-text js-error <%- lastErrorMsg ? 'is-visible' : '' %>"><%- lastErrorMsg %></div>
    </div>
  </div>
</div>
