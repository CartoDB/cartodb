<div class="u-tSpace--m CDB-Text Editor-formInner">
  <label class="CDB-Legend u-upperCase CDB-Text is-semibold CDB-Size-small u-rSpace--m">
    <div class="u-iBlock u-rSpace">
      <input class="CDB-Checkbox js-input" type="checkbox" name="" value="" <% if (checked) { %>checked<% } %> <% if (disabled) { %>disabled<% } %>>
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </div>
    <%- title %>
    <% if (help) { %>
      <span class="js-help" data-tooltip="<%- help %>">-?-</span>
    <% } %>
  </label>
  <div class="CDB-Text CDB-Size-medium Editor-formInput js-editor"></div>
</div>
