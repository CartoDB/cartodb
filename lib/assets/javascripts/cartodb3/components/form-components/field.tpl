<div class="CDB-Text Editor-formInner">
  <% if (title) { %>
    <label class="CDB-Legend u-upperCase u-ellipsis CDB-Text is-semibold CDB-Size-small u-rSpace--m" for="<%- editorId %>">
      <div class="u-flex u-alignCenter">
        <span class="u-ellipsis" title="<%- title %>"><%- title %></span>
        <% if (help) { %>
          <span class="js-help is-underlined u-lSpace" data-tooltip="<%- help %>">?</span>
        <% } %>
      </div>
    </label>
  <% } %>
  <div class="Editor-formInput u-flex u-alignCenter" data-editor></div>
</div>
