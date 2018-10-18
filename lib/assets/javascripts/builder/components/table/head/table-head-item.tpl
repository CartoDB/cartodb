<div class="
    Table-headItemWrapper
    <%- name === 'cartodb_id' || (type === 'geometry' && geometry !== 'point') ? 'Table-headItemWrapper--short' : '' %>
  ">
  <div class="u-flex u-justifySpace">
    <input class="Table-headItemName CDB-Text CDB-Size-medium is-semibold u-ellipsis js-attribute" value="<%- name %>" title="<%- name %>" readonly />

    <% if (isOrderBy) { %>
      <i class="CDB-Size CDB-Size-small CDB-IconFont CDB-IconFont-arrowNext
        Table-columnSorted
        Table-columnSorted--<% if (sortBy === 'asc') {%>asc<% } else {%>desc<% } %>
        u-rSpace u-altTextColor
      "></i>
    <% } %>

    <button class="CDB-Shape-threePoints is-blue is-small js-columnOptions">
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
    </button>
  </div>
  <p class="CDB-Size-small Table-headItemInfo u-altTextColor"><%- type %></p>
</div>
