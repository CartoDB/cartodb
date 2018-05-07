<% if (showCategories) { %>
  <ul class="ColorsBar <% if (help) { %> js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
    <% _.each(value, function (color) { %>
      <li class="ColorBar <%- categoryImagesPresent ? 'ColorBar--spaceSmall' : 'ColorBar--spaceMedium' %>" style="background-color: <%- color %>"></li>
    <% }); %>
  </ul>
<% } else { %>
  <button type="button" class="Editor-fillContainer <% if (help) { %> js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
    <ul class="ColorBarContainer">
      <% if (_.isArray(value)) { %>
        <li class="ColorBar ColorBar-gradient" style="background: linear-gradient(90deg,<%- value.join(',') %>)"></li>
      <% } else { %>
        <li class="ColorBar" style="background-color: <%- value %>"></li>
      <% } %>
    </ul>
  </button>
<% } %>

<% if (imageURL && kind !== 'custom-marker') { %>
<button type="button" class="Editor-fillImage <% if (help) { %> js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <div class="js-image-container"></div>
</button>
<% } %>

<% if ((!imageURL && categoryImagesPresent) || (imageURL && kind === 'custom-marker')) { %>
<button type="button" class="Editor-fillImage <% if (help) { %> js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <div class='Editor-categoryImagesTag CDB-Text CDB-FontSize-small u-altTextColor is-semibold u-upperCase'><%= _t('form-components.editors.fill.input-color.img') %></div>
</button>
<% } %>
