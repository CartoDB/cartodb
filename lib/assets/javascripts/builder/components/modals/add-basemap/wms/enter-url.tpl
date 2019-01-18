<div class="u-flex u-alignCenter Modal-basemapContainer">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor Modal-titleBasemap"><%- _t('components.modals.add-basemap.wms.insert') %></h3>
  <div class="CDB-Text u-flex u-alignCenter">
    <label class="Metadata-label Metadata-label--auto  CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"><%- _t('components.modals.add-basemap.xyz.enter') %></label>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="has-icon CDB-InputText CDB-Text js-url" value="" placeholder="<%- _t('components.modals.add-basemap.xyz.eg') %> http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml">
      <i class="CDB-IconFont CDB-IconFont-dribbble Form-inputIcon js-idle"></i>
      <i class="Spinner XYZPanel-inputIcon XYZPanel-inputIcon--loader Spinner--formIcon Form-inputIcon js-validating" style="display: none;"></i>
      <div class="XYZPanel-error CDB-InfoTooltip CDB-InfoTooltip--left is-error CDB-Text CDB-Size-medium CDB-InfoTooltip-text js-error <%- (layersFetched && layers.length === 0) ? 'is-visible' : '' %>">
        <% if (layersFetched && layers.length === 0) { %>
          <%- _t('components.modals.add-basemap.wms.invalid') %>
        <% } %>
      </div>
    </div>
  </div>
</div>
