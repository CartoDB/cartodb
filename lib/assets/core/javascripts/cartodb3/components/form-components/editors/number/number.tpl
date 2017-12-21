<% if (hasSlider) { %>
  <li class="CDB-OptionInput-item CDB-OptionInput-item--noSeparator">
    <div class="UISlider js-slider"></div>
  </li>
<% } %>
<li class="CDB-OptionInput-item">
  <input type="text" class="CDB-InputText <% if (isFormatted) { %>is-number<% } %> <% if (isDisabled) { %>is-disabled<% } %> js-input <% if (help) { %> js-help<% } %>" <% if (isDisabled) { %>readonly<% } %> value="<%- value %>" placeholder="<%- placeholder %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %> />
</li>
