<form class="Form js-form">
  <div class="Form-row">
    <div class="Form-rowLabel">
      <label class="CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.form-import.title') %></label>
    </div>
    <div class="Form-rowData Form-rowData--longer">
      <input type="text" class="CDB-Text CDB-Size-medium Form-input Form-input--longer has-submit js-textInput" value="" placeholder="<%= _t('components.modals.add-layer.imports.arcgis.input-placeholder', { brand: 'ArcGIS Server&trade;' }) %>" />
      <button type="submit" class="Button Button--secondary Form-inputSubmit">
        <span><%- _t('components.modals.add-layer.imports.form-import.submit') %></span>
      </button>
      <div class="Form-inputError"><%- _t('components.modals.add-layer.imports.form-import.error-desc') %></div>
    </div>
  </div>
  <div class="Form-row">
    <div class="Form-rowLabel"></div>
    <div class="Form-rowData Form-rowData--longer">
      <p class="CDB-Text CDB-Size-small Form-rowInfoText--centered Form-rowInfoText--block u-altTextColor">
        <%- _t('components.modals.add-layer.imports.form-import.format') %>: http://&#60;host&#62;/arcgis/rest/services/&#60;folder&#62;/&#60;serviceName&#62;/&#60;serviceType&#62;<br/>
        <%- _t('components.modals.add-layer.imports.arcgis.url-desc') %>
      </p>
    </div>
  </div>
</form>
