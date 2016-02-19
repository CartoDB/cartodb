<div class="CDB-HeaderInfo">
  <div class="CDB-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>

  <div class="CDB-HeaderInfo-Inner CDB-Text">
    <div class="CDB-HeaderInfo-Title u-bSpace--m">
      <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- title %></h2>
    </div>

    <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- description %></p>

    <select>
      <% _.each(types, function(type) { %>
      <option value="<%- type.value %>"><%- type.label %></option>
      <% }); %>
    </select>
  </div>
</div>
