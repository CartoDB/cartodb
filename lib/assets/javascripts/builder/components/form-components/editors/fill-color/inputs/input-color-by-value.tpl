<button type="button" class="Editor-fillContainer Editor-fillContainer--ByValue <% if (help) { %>js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <% if (_.isArray(value)) { %>
    <span class="Editor-fillContainer--Column u-ellipsis">
      <%- attribute %>
    </span>
    <span class="Editor-fillContainer--ColorBarContainer ColorBarContainer">
      <span class="ColorBar ColorBar-gradient" style="<%- colorBar %>"></span>
    </span>
  <% } else { %>
    <span class="u-altTextColor"><%- _t('form-components.editors.style.select-by-column') %></span>
  <% } %>
</button>
