<form class="Form js-form">
  <div class="Form-row u-flex__align--start">
    <div class="Form-rowLabel ImportOptions__label">
      <label class="Form-label CDB-Text CDB-Size-medium u-mainTextColor"><%- _t('components.modals.add-layer.imports.database.field-sql-query') %></label>
    </div>
    <div>
      <div class="ImportOptions__CodeMirror">
        <textarea rows="4" cols="50" class="ImportOptions__input--long Form-input Form-textarea CDB-Text CDB-Size-medium js-textarea"></textarea>
        <% if (errorMessages) { %>
          <div class="ImportOptions__input-error CDB-Text">
            <% errorMessages.forEach(function (errorMessage) { %>
              <p><%- errorMessage %></p>
            <% }); %>
          </div>
        <% } %>
      </div>
      <div class="ImportOptions__hint CDB-Text CDB-Size-medium u-altTextColor u-mt--8"><%- sqlHint %></div>
    </div>
  </div>
  <div class="Form-row u-flex__align--start">
    <div class="Form-rowLabel ImportOptions__label">
      <label class="Form-label CDB-Text CDB-Size-medium u-mainTextColor"><%- _t('components.modals.add-layer.imports.database.import-as-field') %></label>
    </div>
    <div>
      <input type="text" class="ImportOptions__input--long Form-input CDB-Text CDB-Size-medium js-textInput" value="" />
      <div class="ImportOptions__hint CDB-Text CDB-Size-medium u-altTextColor u-mt--8"><%= _t('components.modals.add-layer.imports.database.import-as-hint') %></div>
    </div>
  </div>
  <div class="Form-row">
    <div class="Form-rowLabel ImportOptions__label"></div>
    <div class="Form-row ImportOptions__input--long u-flex__justify--end">
      <button type="submit" class="CDB-Button CDB-Button--primary is-disabled js-submit" disabled>
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('components.modals.add-layer.imports.database.run') %></span>
      </button>
    </div>
  </div>
  <div class="ImportOptions__feedback">
    <p class="CDB-Text CDB-Size-medium">
      <span class="u-altTextColor"><%- _t('components.modals.add-layer.imports.feedback-text', { brand: title }) %> <a href="https://docs.google.com/forms/d/e/1FAIpQLSf9U6Yca37TlpguW_mC6nr9YdyBJzipCjf_QSHNkqlmkQ8dgQ/viewform" target="_blank" rel="noopener noreferrer"><%- _t('components.modals.add-layer.imports.feedback-link') %></a></span>
    </p>
  </div>
</form>
