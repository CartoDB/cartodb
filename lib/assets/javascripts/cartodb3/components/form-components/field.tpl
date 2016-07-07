<div class="CDB-Text Editor-formInner">
  <% if (title || help) { %>
    <label class="CDB-Legend u-upperCase u-ellipsis CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="<%- editorId %>">
      <%- title %>
      <% if (help) { %>
        <span class="js-help is-underlined" data-tooltip="<%- help %>">?</span>
      <% } %>
    </label>
  <% } %>
  <div class="Editor-formInput" data-editor>
  </div>
</div>
