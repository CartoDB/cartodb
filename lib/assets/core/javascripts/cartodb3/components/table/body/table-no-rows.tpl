<div class="IntermediateInfo">
  <div class="LayoutIcon">
    <i class="CDB-IconFont CDB-IconFont-rows"></i>
  </div>
  <h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
    <% if (page !== 0) { %>
      <%- _t('components.table.rows.result.no-page-title', { page: page }) %>
    <% } else { %>
      <%- _t('components.table.rows.result.no-results-title') %>
    <% } %>
  </h3>
  <p class="CDB-Text CDB-Size-medium u-altTextColor">
    <% if (page !== 0) { %>
      <%- _t('components.table.rows.result.no-page-desc', { page: page }) %>
    <% } else { %>
      <%- _t('components.table.rows.result.no-results-desc', {
        addRow: _t('components.table.rows.result.no-results-button')
      }) %>
    <% } %>
  </p>
</div>
