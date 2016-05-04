<div class="Editor-HeaderInfo">
  <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>

  <div class="Editor-HeaderInfo-inner CDB-Text">
    <div class="Editor-HeaderInfo-title u-bSpace--m">
      <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.widgets.widgets-form.type.title-label') %></h2>
    </div>

    <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.widgets.widgets-form.type.description') %></p>

    <select class="CDB-SelectFake js-select u-tSpace--m">
      <% _.each(types, function(type) { %>
        <option value="<%- type.value %>" <% if (type.value === selectedType) { %>selected="selected"<% } %>>
          <%- type.label %>
        </option>
      <% }); %>
    </select>
  </div>
</div>

