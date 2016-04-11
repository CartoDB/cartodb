<div class="Dialog-header ErrorDetails-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--alert">
    <i class="CDB-IconFont CDB-IconFont-cloud"></i>
  </div>
  <p class="Dialog-headerTitle--warning">
    <%- _t('components.background-importer.errors.unable-to-import-datasets') %>
  </p>
  <p class="Dialog-headerText">
    <%- _t('components.background-importer.errors.no-more-datasets', { maxTablesPerImport: warnings.max_tables_per_import}) %><br />
    <%- _t('components.background-importer.find-connected-datasets') %>
  </p>
</div>
<div class="Dialog-footer ErrorDetails-footer">
  <button class="Button Button--secondary ErrorDetails-footerButton u-upperCase cancel">
    <span><%- _t('components.background-importer.continue-btn') %></span>
  </button>
</div>
