<div class="
    Table-headItemWrapper
    <%- name === 'cartodb_id' || type === 'geometry' ? 'Table-headItemWrapper--short' : '' %>
  ">
  <div class="u-flex u-justifySpace">
    <span class="CDB-Text CDB-Size-medium is-semibold u-ellipsis"><%- name %></span>
    <% if (name !== 'cartodb_id') { %>
      <button class="CDB-Shape-threePoints is-blue is-small js-options">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </button>
    <% } %>
  </div>
  <div class="u-flex u-justifySpace">
    <p class="CDB-Text CDB-Size-medium"><%- type %></p>
  </div>
</div>
