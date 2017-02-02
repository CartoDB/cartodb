<div class="ImportPanel-header">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    <%- _t('components.modals.add-layer.imports.header-import.upload-file-url', { smart_count: 1 }) %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <% fileEnabledText = _t('components.modals.add-layer.imports.header-import.select-a-file') +
    ' <a href="https://carto.com/docs/carto-engine/import-api/importing-geospatial-data/#supported-geospatial-data-formats">' +
      _t('components.modals.add-layer.imports.header-import.see-all-formats') +
      '</a>'
    %>
    <%= _t('components.modals.add-layer.imports.header-import.paste-url', { fileEnabled: fileEnabledText  }) %>
  </p>
</div>
<div class="Form-row Form-row--centered">
  <div class="Form-rowData Form-rowData--med Form-rowData--noMargin js-dropzone">
    <div class="Form-upload">
      <label class="Form-fileLabel js-fileLabel CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.form-import.drag-and-drop') %></label>
      <label class="Form-fileLabel Form-fileLabel--error CDB-Text CDB-Size-small js-fileError"></label>
      <div class="Form-file">
        <input type="file" class="js-fileInput" />
        <span class="CDB-Button CDB-Button--primary Form-fileButton CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase js-fileButton">
          <%- _t('components.modals.add-layer.imports.form-import.browse') %>
        </span>
      </div>
    </div>
  </div>
  <span class="u-lSpace--xl u-rSpace--xl u-flex u-alignCenter CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.add-layer.imports.form-import.or') %></span>
  <div class="Form-rowData Form-rowData--noMargin Form-rowData--med">
    <input type="text" class="Form-input Form-input--med has-submit js-url CDB-Text CDB-Size-medium" value="" placeholder="https://carto.com/data-library" />
    <button type="submit" class="CDB-Text CDB-Size-small Form-inputSubmit u-upperCase u-actionTextColor Form-inputSubmit js-submit">
      <span><%- _t('components.modals.add-layer.imports.form-import.submit') %></span>
    </button>
    <div class="Form-inputError CDB-Text"><%- _t('components.modals.add-layer.imports.form-import.error-desc') %></div>
  </div>
</div>
