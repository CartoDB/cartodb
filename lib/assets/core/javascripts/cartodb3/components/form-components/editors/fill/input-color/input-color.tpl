<% if (showCategories) { %>
  <ul class="ColorsBar">
    <% _.each(value, function (color) { %>
      <li class="ColorBar <%- categoryImagesPresent ? 'ColorBar--spaceSmall' : 'ColorBar--spaceMedium' %>" style="background-color: <%- color %>"></li>
    <% }); %>
  </ul>
<% } else { %>
  <button type="button" class="Editor-fillContainer">
    <ul class="ColorBarContainer">
      <% if (_.isArray(value)) { %>
        <li class="ColorBar ColorBar-gradient" style="background: linear-gradient(90deg,<%- value.join(',') %>)"></li>
      <% } else { %>
        <li class="ColorBar" style="background-color: <%- value %>"></li>
      <% } %>
    </ul>
  </button>
<% } %>

<% if (imageURL) { %>
<button type="button" class="Editor-fillImage">
  <div class="js-image-container"></div>
</button>
<% } %>

<% if (!imageURL && categoryImagesPresent) { %>
<button type="button" class="Editor-fillImage">
  <div class='Editor-categoryImagesTag CDB-Text CDB-FontSize-small u-altTextColor is-semibold u-upperCase'><%= _t('form-components.editors.fill.input-color.img') %></div>
</button>
<% } %>
