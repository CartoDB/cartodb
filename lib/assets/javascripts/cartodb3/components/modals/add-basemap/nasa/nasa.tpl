<div class="u-flex u-alignCenter Modal-basemapContainer">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor Modal-titleBasemap"><%- _t('components.modals.add-basemap.nasa.select') %></h3>
  <div class="CDB-Text u-flex u-alignCenter">
    <div class="Form-rowData Form-rowData--short Form-rowData--alignLeft">
      <div class="Form-rowData Form-rowData--full">
        <div class="RadioButton js-day">
          <button type="button" class="RadioButton-input <% if (layerType === 'day') { %>is-checked<% } %>"></button>
          <label class="Metadata-label Metadata-label--auto CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis" for="nasa-type-day">Day</label>
        </div>
      </div>
      <div class="Form-rowData Form-rowData--full">
        <div class="RadioButton js-night">
          <button type="button" class="RadioButton-input <% if (layerType === 'night') { %>is-checked<% } %>"/></button>
          <label class="Metadata-label Metadata-label--auto CDB-Text CDB-Size-small is-semibold u-upperCase u-ellipsis" for="nasa-type-night">Night</label>
        </div>
      </div>
    </div>
    <div class="Form-rowData Form-rowData--short">
      <div class="js-datePicker" data-title="You can't select a date in night mode"></div>
    </div>
  </div>
</div>
