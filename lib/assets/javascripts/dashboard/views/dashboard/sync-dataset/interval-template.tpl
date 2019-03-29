<div class="u-iBlock CDB-Text CDB-Size-medium RadioButton js-interval">
  <input
    id="<%- id %>"
    type="radio"
    class="CDB-Radio js-input"
    <% if (disabled) { %> disabled <% } %>
    <% if (checked) { %> checked <% } %>
  />
  <span class="u-iBlock CDB-Radio-face"></span>
  <label for="<%- id %>" class="Modal-intervalLabel u-iBlock u-lSpace u-upperCase"><%- name %></label>
</div>
