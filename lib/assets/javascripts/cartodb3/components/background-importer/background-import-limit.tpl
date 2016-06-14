<% if (isUpgradeable) { %>
<%- _t('components.background-importer.background-import-limit.hurry', { upgradeUrl: upgradeUrl }) %>
<% } else { %>
<%- _t('components.background-importer.background-import-limit.one-file', { importQuota: importQuota }) %>
<% } %>
