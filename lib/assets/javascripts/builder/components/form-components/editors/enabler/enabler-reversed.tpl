<label class="CDB-Legend u-upperCase CDB-Text is-semibold CDB-Size-small">
  <div class="u-flex u-alignCenter">
    <div class="u-iBlock u-rSpace--m">
      <input class="CDB-Checkbox js-input" type="checkbox" name="" value="" <% if (checked) { %>checked<% } %> <% if (disabled) { %>disabled<% } %>>
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </div>
    <span class="<% if (help) { %> js-help is-underlined<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %> ><%- label %></span>
  </div>
</label>
<div class="Editor-checkerComponent js-editor"></div>
