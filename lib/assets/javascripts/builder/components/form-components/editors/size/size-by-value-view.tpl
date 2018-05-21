<div class="CDB-InputText CDB-Text is-cursor js-button u-ellipsis <% if (!columnSelected) { %> u-altTextColor <% } %>" tabindex="0">
    <ul class="Form-StyleByValue--column CDB-OptionInput-container CDB-OptionInput-container--border">
        <li class="u-ellipsis"><%- label %></li>
        <% if (rangeSelected) { %>
            <li class="Form-StyleByValue--column-range"><%- range %></li>
        <% } %>
    </ul>
</div>


