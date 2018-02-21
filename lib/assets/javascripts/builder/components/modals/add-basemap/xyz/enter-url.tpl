<div class="u-flex u-alignCenter Modal-basemapContainer">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor Modal-titleBasemap"><%- _t('components.modals.add-basemap.xyz.insert') %></h3>
  <div class="CDB-Text u-flex u-alignCenter">
    <label class="Metadata-label Metadata-label--auto  CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis"><%- _t('components.modals.add-basemap.xyz.enter') %></label>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="has-icon CDB-InputText CDB-Text js-url" value="" placeholder="E.g. https://{s}.carto.com/foobar/{z}/{x}/{y}.png">
      <i class="Spinner XYZPanel-inputIcon XYZPanel-inputIcon--loader Spinner--formIcon Form-inputIcon js-validating" style="display: none;"></i>
      <div class="Checkbox XYZPanel-inputCheckbox js-tms" data-title="Inverts Y axis numbering for tiles">
        <button class="Checkbox-input u-rSpace--m"></button>
        <label class="CDB-Text CDB-Size-small is-semibold u-upperCase"><%- _t('components.modals.add-basemap.xyz.tms') %></label>
      </div>
      <div class="XYZPanel-error CDB-InfoTooltip CDB-InfoTooltip--left is-error CDB-Text CDB-Size-medium CDB-InfoTooltip-text js-error"></div>
    </div>
  </div>
</div>
