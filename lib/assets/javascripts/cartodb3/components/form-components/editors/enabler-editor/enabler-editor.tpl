<div class="u-flex Editor-checkerInput CDB-Text CDB-Size-medium u-rSpace--xl">
  <input class="CDB-Checkbox js-check" type="checkbox" name="" value="" <% if (isChecked) { %>checked<% } %>>
  <span class="CDB-Checkbox-face u-rSpace--m"></span>
  <label class="CDB-Text CDB-Size-small u-ellipsis u-upperCase is-semibold u-flex u-alignCenter Editor-formLabel">
    <span class="u-ellipsis <% if (help) { %> js-help is-underlined<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>  title="<%- label %>"><%- label %></span>
  </label>
</div>
<div class="Editor-checkerComponent js-editor"></div>
