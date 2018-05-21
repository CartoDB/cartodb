<button type="button" class="Editor-fillContainer u-altTextColor <% if (help) { %>js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <% if (value) { %>
  <ul class="ColorBarContainer">
    <li class="ColorBar" style="background-color: <%- value %>"></li>
  </ul>
  <% } else { %>
      <%- _t('form-components.editors.fill.input-color.select-color') %>
  <% }%>
</button>
