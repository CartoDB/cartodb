<td>
  <div class="
    Table-cell
    <%- type === 'number' ? 'is-number' : '' %>
    <%- value === null ? 'is-null' : '' %>
  ">
    <% if (type === 'geometry') { %>
      <%- value ? geometry : 'null' %>
    <% } else { %>
      <%- value === null ? 'null' : value %>
    <% } %>
  </div>
</td>
