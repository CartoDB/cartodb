<div class="CDB-HeaderInfo">
  <div class="CDB-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>

  <div class="CDB-HeaderInfo-Inner CDB-Text">
    <div class="CDB-HeaderInfo-Title u-bSpace--m">
      <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- _t('editor.widgets.widgets-form.type.title') %></h2>
    </div>

    <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.widgets.widgets-form.type.description') %></p>

    <select class="CDB-SelectFake js-select">
      <% _.each(types, function(type) { %>
        <option value="<%- type.value %>" <% if (type.value === selectedType) { %>selected="selected"<% } %>>
          <%- type.label %>
        </option>
      <% }); %>
    </select>
  </div>
</div>
