<tfoot class='page_loader <%- direction %>'>
  <tr>
    <th colspan='1'>
      <div class='fake'></div>
      <div class='float_info'>
        <% if (direction == "up") { %>
          <h5><%= _t('dashboard.views.public_dataset.table_view.scroll_down') %></h5>
        <% } else { %>
          <h5><%= _t('dashboard.views.public_dataset.table_view.scroll_up') %></h5>
        <% } %>
        <p><%= _t('dashboard.views.public_dataset.table_view.pagination') %></p>
      </div>
      <div class='float_action'>
        <h5><%= _t('dashboard.views.public_dataset.table_view.loading_rows') %></h5>
        <p><%= _t('dashboard.views.public_dataset.table_view.moment') %></p>
      </div>
    </th>
  </tr>
</tfoot>
