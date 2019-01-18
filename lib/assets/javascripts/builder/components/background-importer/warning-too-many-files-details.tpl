<div class="Dialog-header ErrorDetails-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--alert">
    <i class="CDB-IconFont CDB-IconFont-cloud"></i>
  </div>
  <p class="Dialog-headerTitle--warning">
    <%- _t('components.background-importer.warnings-details.unable-to-import-datasets') %>
  </p>
  <p class="Dialog-headerText">
    <%- _t('components.background-importer.warnings-details.no-more-datasets', { maxTablesPerImport: maxTablesPerImport}) %><br />
    <%- _t('components.background-importer.warnings-details.find-connected-datasets') %>
  </p>
</div>
<div class="Dialog-footer ErrorDetails-footer">
  <button class="Button Button--secondary ErrorDetails-footerButton u-upperCase js-close">
    <span><%- _t('components.background-importer.warnings-details.continue-btn') %></span>
  </button>
</div>
