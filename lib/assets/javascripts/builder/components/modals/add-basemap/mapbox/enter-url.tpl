<div class="u-flex u-alignCenter Modal-basemapContainer">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor Modal-titleBasemap"><%- _t('components.modals.add-basemap.mapbox.insert') %></h3>
  <div class="CDB-Text u-flex u-alignCenter ">
    <label class="Metadata-label Metadata-label--big CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"><%- _t('components.modals.add-basemap.mapbox.enter') %></label>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="CDB-InputText CDB-Text js-url" value="<%- url %>" placeholder="<%- _t('components.modals.add-basemap.xyz.eg') %> https://api.mapbox.com/styles/v1/username/basemap/tiles/256/{z}/{x}/{y}@2x?access_token=access_token">
      <div class="XYZPanel-error CDB-InfoTooltip CDB-InfoTooltip--left is-error CDB-Text CDB-Size-medium CDB-InfoTooltip-text js-error <%- lastErrorMsg ? 'is-visible' : '' %>"><%- lastErrorMsg %></div>
    </div>
  </div>
  <div class="u-flex">
    <label class="Metadata-label Metadata-label--big CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"></label>
    <div class="Form-rowData Form-rowData--noMinHeight Form-rowData--longer">
      <p class="CDB-Text CDB-Size-small Form-rowInfoText--block u-altTextColor">
        Learn how to get your Mapbox Style URL <a href="https://www.mapbox.com/help/carto/" target="_blank">here</a>
      </p>
    </div>
  </div>
</div>
