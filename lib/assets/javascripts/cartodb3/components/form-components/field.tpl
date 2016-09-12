<div class="CDB-Text Editor-formInner">
  <% if (title) { %>
    <label class="CDB-Legend u-upperCase u-ellipsis CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="<%- editorId %>">
      <div class="u-flex u-alignCenter">
        <span class="<% if (help) { %> js-help is-underlined<% } %>" <% if (help) { %> data-tooltip="<%- help %>"<% } %> ><%- title %></span>
      </div>
    </label>
  <% } %>
  <div class="Editor-formInput u-flex u-alignCenter" data-editor></div>
</div>
