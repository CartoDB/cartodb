<div class="u-rSpace--xl">
  <input class="CDB-Radio" type="radio" name="gender" value="01" checked>
  <span class="u-iBlock CDB-Radio-face"></span>
</div>
<div>
  <div class="ModalBlockList-item-header u-bSpace--m">
    <h2 class="ModalBlockList-item-headerTitle CDB-Text CDB-Size-large u-rSpace--m u-ellipsis"><%- title %></h2>
    <h3 class="ModalBlockList-item-headerSubTitle CDB-Text CDB-Size-small u-hintTextColor u-upperCase u-ellipsis"><%- sub_title %></h3>
  </div>
  <p class="CDB-Text CDB-Size-small u-altTextColor"><%- desc %></p>

  <% if (selected) { %>
    &lt;-- SELECTED
  <% } %>
</div>
