<div class="
    Table-headItemWrapper
    <%- name === 'cartodb_id' || type === 'geometry' ? 'Table-headItemWrapper--short' : '' %>
  ">
  <div class="u-flex u-justifySpace">
    <p class="CDB-Text CDB-Size-medium is-semibold u-ellipsis"><%- name %></p>
    <% if (name !== 'cartodb_id') { %>
      <button class="CDB-Shape-threePoints is-blue is-small js-options">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </button>
    <% } %>
  </div>
  <p class="CDB-Size-small Table-headItemInfo u-altTextColor"><%- type %></p>
</div>
