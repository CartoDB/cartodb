<form class="Form js-form">
  <div class="Form-row Form-row--centered">
    <% if (fileEnabled) { %>
      <div class="Form-rowData Form-rowData--med Form-rowData--noMargin js-dropzone">
        <div class="Form-upload">
          <label class="Form-fileLabel js-fileLabel CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.imports.form-import.drag-and-drop') %></label>
          <label class="Form-fileLabel Form-fileLabel--error js-fileError"></label>
          <div class="Form-file">
            <input type="file" class="js-fileInput" />
            <span class="CDB-Button CDB-Button--primary Form-fileButton CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase js-fileButton">
              <%- _t('components.modals.add-layer.imports.form-import.browse') %>
            </span>
          </div>
        </div>
      </div>
      <span class="Form-separator Form-separator--or"><%- _t('components.modals.add-layer.imports.form-import.or') %></span>
    <% } %>
    <div class="Form-rowData Form-rowData--noMargin Form-rowData--med">
      <input type="text" class="Form-input Form-input--med has-submit js-textInput CDB-Text CDB-Size-medium" value="" placeholder="http://www.cartodb.com/library" />
      <button type="submit" class="CDB-Text CDB-Size-small Form-inputSubmit u-upperCase u-actionTextColor Form-inputSubmit">
        <span><%- _t('components.modals.add-layer.imports.form-import.submit') %></span>
      </button>
      <div class="Form-inputError"><%- _t('components.modals.add-layer.imports.form-import.error-desc') %></div>
    </div>
  </div>
</form>
