<form>
  <fieldset>
    <% _.each(fields, function(field) { %>
      <div class="u-tSpace-xl CDB-Text CDB-Fieldset">
        <p class="CDB-Legend CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- field.get('name') %></p>
        <input type="text" name="text" placeholder="DejaVu Sans" class="CDB-InputText" value="<%- field.get('name') %>">
      </div>
    <% }); %>
  </fieldset>
</form>
