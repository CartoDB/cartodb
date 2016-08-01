<div class="u-flex Editor-checkerInput CDB-Text CDB-Size-medium u-rSpace--xl">
  <input class="CDB-Checkbox js-check" type="checkbox" name="" value="" <% if (isChecked) { %>checked<% } %>>
  <span class="u-iBlock CDB-Checkbox-face"></span>
  <label class="u-iBlock CDB-Text CDB-Size-small u-ellipsis u-upperCase is-semibold Editor-checkerLabel">
    <div class="u-flex u-alignCenter">
      <span class="u-ellipsis" title="<%- label %>"><%- label %></span>
      <% if (help) { %>
        <span class="js-help is-underlined u-lSpace" data-tooltip="<%- help %>">?</span>
      <% } %>
    </div>
  </label>
</div>
<div class="Editor-checkerComponent js-editor"></div>
