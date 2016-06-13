<td class="Table-cellItem">
  <div class="
      Table-cell u-flex u-justifySpace
      <%- columnName === 'cartodb_id' || type === 'geometry' ? 'Table-cell--short' : '' %>
    " title="<%- value %>">
    <p class="
      CDB-Text CDB-Size-medium
      u-ellipsis u-rSpace--xl
      <%- type === 'number' && columnName !== 'cartodb_id' ? 'is-number' : '' %>
      <%- value === null ? 'is-null' : '' %>
      <%- columnName === 'cartodb_id' ? 'is-cartodbId' : '' %>
    ">
      <% if (type === 'geometry') { %>
        <%- value ? geometry : 'null' %>
      <% } else { %>
        <%- value === null ? 'null' : value %>
      <% } %>
    </p>

    <% if (columnName !== 'cartodb_id') { %>
      <button class="CDB-Shape-threePoints is-blue is-small js-options">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </button>
    <% } %>
  </div>
</td>
