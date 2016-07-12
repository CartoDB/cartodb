<div class="CDB-Text Editor-formInner">
  <% if (title || help) { %>
    <label class="CDB-Legend u-upperCase u-ellipsis CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="<%- editorId %>">
      <div class="u-flex u-alignCenter">
        <%- title %>
        <% if (help) { %>
          <span class="js-help is-underlined u-lSpace" data-tooltip="<%- help %>">?</span>
        <% } %>
      </div>
    </label>
  <% } %>
  <div class="Editor-formInput" data-editor>
  </div>
</div>
