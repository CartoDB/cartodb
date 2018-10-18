<div class="ImportPanel-header">
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
    <%- _t('components.modals.assets-picker.upload-file-url') %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <%- _t('components.modals.assets-picker.upload-desc') %>
  </p>
</div>
<div class="Form-row Form-row--centered">
  <div class="Form-rowData Form-rowData--med Form-rowData--noMargin js-dropzone">
    <div class="Form-upload">
      <label class="Form-fileLabel js-fileLabel CDB-Text CDB-Size-medium"><%- _t('components.modals.assets-picker.drag-and-drop') %></label>
      <label class="Form-fileLabel Form-fileLabel--error CDB-Text CDB-Size-small js-fileError"></label>
      <div class="Form-file">
        <span class="CDB-Button CDB-Button--primary Form-fileButton CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase js-upload">
          <%- _t('components.modals.assets-picker.browse') %>
        </span>
      </div>
    </div>
  </div>
  <span class="u-lSpace--xl u-rSpace--xl u-flex u-alignCenter CDB-Text CDB-Size-medium u-altTextColor"><%- _t('components.modals.assets-picker.or') %></span>
  <div class="Form-rowData Form-rowData--noMargin Form-rowData--med">
    <input type="text" class="Form-input Form-input--med has-submit js-url CDB-Text CDB-Size-medium" value="" placeholder="https://carto.com/markers/pin.png" />
    <button type="submit" class="CDB-Text CDB-Size-small Form-inputSubmit u-upperCase u-actionTextColor Form-inputSubmit js-submit">
      <span><%- _t('components.modals.assets-picker.submit') %></span>
    </button>
    <div class="Form-inputError CDB-Text js-url-error"><%- _t('components.modals.assets-picker.incorrect-url') %></div>
  </div>
</div>
