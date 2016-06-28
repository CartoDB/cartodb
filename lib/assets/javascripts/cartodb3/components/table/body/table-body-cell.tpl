<td class="Table-cellItem" data-attribute="<%- columnName %>" title="<%- value %>" data-clipboard-text='<%- value %>'>
  <div class="
      Table-cell u-flex u-justifySpace
      <%- columnName === 'cartodb_id' || (type === 'geometry' && geometry !== 'point') ? 'Table-cell--short' : '' %>
    ">
    <p class="
      CDB-Text CDB-Size-medium
      u-ellipsis u-rSpace--xl
      <%- type === 'number' && columnName !== 'cartodb_id' ? 'is-number' : '' %>
      <%- value === null ? 'is-null' : '' %>
      <%- columnName === 'cartodb_id' ? 'is-cartodbId' : '' %>
      js-value
    ">
      <%- value === null ? 'null' : formattedValue %>
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
