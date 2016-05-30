<!--<% _.each(categories, function (category) { %>
<div class="CDB-ColorBar CDB-ColorBar--spaceMedium js-input" style="background-color: <%- category.color %>">
</div>
<% }); %>-->



<% _.each(ramp, function (color, i) { %>
<div class="CDB-ColorBar CDB-ColorBar--spaceMedium js-input" style="background-color: <%- color %>">
</div>
<% }); %>