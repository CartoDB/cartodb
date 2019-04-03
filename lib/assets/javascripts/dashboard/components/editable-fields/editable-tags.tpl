<% if (tagsCount > 0) { %>
  <div>
    <% for (var i = 0, l = Math.min(3, tags.length); i<l; i++) { %>
      <a class="CDB-Tag CDB-Text CDB-Size-small is-semibold u-upperCase js-tag-link" href="<%- router.currentUrl({ search: ':'+ tags[i], page: 1 }) %>"><%- tags[i] %></a><% if (i != (l-1)) { %><% } %>
    <% } %>
    <% if (tagsCount > 3) { %>
      <span class="CDB-Text CDB-Size-small u-altTextColor u-lSpace"><%= _t('dashboard.components.editable_fields.editable_tags.and_3_more', {tagsCount: tagsCount - 3}) %></span>
    <% } %>
  </div>
<% } else { %>
  <% if (editable) { %>
    <button class="EditableField-button CDB-Text CDB-Size-medium u-actionTextColor js-add-btn"><%= _t('dashboard.components.editable_fields.editable_tags.add_tags') %></button>
    <input type="text" class="EditableField-input CDB-Text CDB-Size-medium u-altTextColor js-field-input"></input>
  <% } else { %>
    <div class="DefaultTags">
      <span class="NoResults CDB-Text CDB-Size-small u-altTextColor"><%= _t('dashboard.components.editable_fields.editable_tags.no_tags') %></span>
    </div>
  <% } %>
<% } %>
