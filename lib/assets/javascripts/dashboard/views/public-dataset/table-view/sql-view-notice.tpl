<div class="sqlview">
  <p class="displaced <% if(warnMsg) print("warn") %>">
    <% if (!empty) { %>
      <% if (warnMsg) { %>
        <%- warnMsg %> ·
      <% } %>
      <%= _t('dashboard.views.public_dataset.table_view.dataset_from') %>
    <% } else { %>
      <%= _t('dashboard.views.public_dataset.table_view.clear') %>
    <% } %>
  </p>
</div>
