<button type="button" class="Editor-fillContainer <% if (help) { %> js-help<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %>>
  <% if (_.isArray(value)) { %>
    <ul class="ColorBarContainer">
      <li class="ColorBar ColorBar-gradient" style="background: linear-gradient(90deg,<%- value.join(',') %>)"></li>
    </ul>
  <% } else { %>
    <%- _t('form-components.editors.fill.input-color.select-by-column') %>
  <% } %>
</button>

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
