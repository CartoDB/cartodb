<td>
  <div class="
    Table-cell
    CDB-Text CDB-Size-medium
    u-ellipsis
    <%- type === 'number' && columnName !== 'cartodb_id' ? 'is-number' : '' %>
    <%- value === null ? 'is-null' : '' %>
    <%- columnName === 'cartodb_id' ? 'is-disabled' : '' %>
  " title="<%- value %>">
    <% if (type === 'geometry') { %>
      <%- value ? geometry : 'null' %>
    <% } else { %>
      <%- value === null ? 'null' : value %>
    <% } %>
  </div>
</td>
