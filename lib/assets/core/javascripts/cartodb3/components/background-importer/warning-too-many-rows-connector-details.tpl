<div class="Dialog-header ErrorDetails-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--alert">
    <i class="CDB-IconFont CDB-IconFont-cloud"></i>
  </div>
  <p class="Dialog-headerTitle--warning">
    <%- _t('components.background-importer.connector-warning-details.too-many-rows') %>
  </p>
  <p class="Dialog-headerText">
    <%- _t('components.background-importer.connector-warning-details.unable-to-import-all-rows', { maxRowsPerConnectorImport: maxRowsPerConnectorImport}) %><br />
  </p>
</div>
<div class="Dialog-footer ErrorDetails-footer">
  <button class="Button Button--secondary ErrorDetails-footerButton u-upperCase js-close">
    <span><%- _t('components.background-importer.connector-warning-details.continue-btn') %></span>
  </button>
</div>
