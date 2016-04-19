<div class="ModalBlockList-itemInput">
  <input class="CDB-Radio" type="radio" value="true"
      <% if (selected) { %>checked="checked"<% } %>
      <% if (!enabled) { %>disabled="disabled"<% } %>
    >
  <span class="u-iBlock CDB-Radio-face"></span>
</div>
<div>
  <div class="ModalBlockList-item-header u-bSpace">
    <h2 class="ModalBlockList-item-headerTitle CDB-Text CDB-Size-large u-rSpace--m u-ellipsis"><%- title %></h2>
    <h3 class="ModalBlockList-item-headerSubTitle CDB-Text CDB-Size-small u-hintTextColor u-upperCase u-ellipsis"><%- sub_title %></h3>
  </div>
  <div class="ModalBlockList-item-body">
    <p class="CDB-Text CDB-Size-small u-altTextColor"><%- desc %></p>
  </div>

</div>
