<div class="u-tSpace--m CDB-Text Editor-FormInner <% if (hasNestedForm) { %>Editor-FormInner--nested<% } %>">
  <% if (!hasNestedForm) { %>
    <label class="CDB-Legend u-upperCase CDB- Text is-semibold CDB-Size-small u-rSpace--m" for="<%- editorId %>">
      <%- title %>
      <% if (help) { %>
        <span class="js-help" data-tooltip="<%- help %>">-?-</span>
      <% } %>
    </label>
  <% } %>
  <div class="CDB-Text CDB-Size-medium Editor-FormInput">
    <span data-editor></span>
  </div>
</div>
