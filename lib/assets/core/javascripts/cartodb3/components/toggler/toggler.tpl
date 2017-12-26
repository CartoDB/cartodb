<div class="CDB-Text CDB-Size-small is-semibold u-rSpace--xl<% if (disabled) { %> is-disabled<% } %>">
  <label class="u-iBlock u-upperCase"><%- labels[0] %></label>
  <input class="CDB-Toggle u-iBlock js-input" type="checkbox"
    <% if (disabled) { %> disabled<% } %>
    <% if (checked) { %> checked <% } %> >
  <span class="u-iBlock CDB-ToggleFace"></span>
  <label class="u-iBlock u-upperCase"><%- labels[1] %></label>
</div>