<button type="button" class="Editor-fillContainer u-altTextColor <% if (help) { %>js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <% if (_.isArray(value)) { %>
    <ul class="ColorBarContainer">
      <li class="ColorBar ColorBar-gradient" style="background: linear-gradient(90deg,<%- value.join(',') %>)"></li>
    </ul>
  <% } else { %>
    <%- _t('form-components.editors.style.select-by-column') %>
  <% } %>
</button>