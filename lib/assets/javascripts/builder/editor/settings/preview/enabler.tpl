<div class="Editor-formInner CDB-Text CDB-Size-small u-upperCase <% if (disabled) { %>u-altTextColor<% } %> u-upperCase">
  <div class="u-flex u-alignCenter">
    <div class="u-iBlock u-rSpace--m">
      <input id="<%- id %>" class="CDB-Checkbox js-input" type="checkbox" name="" value="" <% if (checked) { %>checked<% } %> <% if (disabled) { %>disabled<% } %>>
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </div>
    <label for="<%- id %>" class="<% if (help) { %> js-help is-underlined<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %> ><%- title %></label>
  </div>
</div>
