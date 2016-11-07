<% if (hasSlider) { %>
  <li class="CDB-OptionInput-item CDB-OptionInput-item--noSeparator">
    <div class="UISlider js-slider"></div>
  </li>
<% } %>
<li class="CDB-OptionInput-item">
  <input type="text" class="CDB-InputText <% if (isNumber) { %>is-number<% } %> <% if (isDisabled) { %>is-disabled<% } %> js-input" <% if (isDisabled) { %>readonly<% } %> value="<%- value %>" placeholder="<%- placeholder %>" />
</li>
