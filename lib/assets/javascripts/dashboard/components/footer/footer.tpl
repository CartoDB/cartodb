<div class="u-inner Footer-inner">
  <ul class="Footer-list Footer-list--primary">
      <% if (!isHosted) { %>
        <li class="Footer-listItem CDB-Text CDB-Size-medium"><%= _t('dashboard.components.footer.footer.guides') %></li>
        <li class="Footer-listItem CDB-Text CDB-Size-medium"><%= _t('dashboard.components.footer.footer.developers') %></li>
      <% } %>
      <% if (onpremiseVersion && onpremiseVersion !== "") { %>
        <li class="Footer-listItem CDB-Text CDB-Size-medium"><%= _t('dashboard.components.footer.footer.version', {onpremiseVersion: onpremiseVersion}) %></li>
      <% } %>
  </ul>

  <ul class="Footer-list Footer-list--secondary">
    <% if (onpremiseVersion && onpremiseVersion !== "") { %>
      <li class="Footer-listItem CDB-Text CDB-Size-medium"><%= _t('dashboard.components.footer.footer.onpremise') %></li>
    <% } else { %>
      <li class="Footer-listItem CDB-Text CDB-Size-medium"><%= _t('dashboard.components.footer.footer.support') %></li>
    <% } %>
    <li class="Footer-listItem CDB-Text CDB-Size-medium"><%= _t('dashboard.components.footer.footer.contact') %></li>
  </ul>
</div>
