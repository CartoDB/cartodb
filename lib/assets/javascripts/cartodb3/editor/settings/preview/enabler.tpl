<div class="u-bSpace--m CDB-Text">
  <label class="u-flex u-alignCenter CDB-Legend u-upperCase CDB-Text CDB-Size-small u-rSpace--m
    <% if (disabled) { %>u-altTextColor<% } %>">
    <div class="u-iBlock u-rSpace">
      <input class="CDB-Checkbox js-input" type="checkbox" name="" value="" <% if (checked) { %>checked<% } %> <% if (disabled) { %>disabled<% } %>>
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </div>
    <%- title %>
    <% if (help) { %>
      <span class="js-help is-underlined u-lSpace" data-tooltip="<%- help %>">?</span>
    <% } %>
  </label>
  <div class="CDB-Text CDB-Size-medium Editor-formInput js-editor"></div>
</div>
