<input class="CDB-Radio js-format" type="radio" name="format" data-format="<%- format.format %>"
  <% if (isDisabled) { %>
    disabled
  <% } %>

  <% if (isChecked) { %>
    checked
  <% } %>
>
<span class="u-iBlock CDB-Radio-face"></span>
<label class="u-iBlock u-lSpace u-upperCase"><%- format.label || format.format %></label>