<button class="CDB-Widget-controlButton <% if (disabled) { %>is-disabled <% } %>" <% if (disabled) { %> disabled <% } %>>
    <div class="CDB-Widget-controlButtonContent">

    <% if (running) { %>
        <svg width="6px" height="10px" viewBox="0 0 6 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Time-series" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Time-Series" transform="translate(-201.000000, -543.000000)" fill="#FFFFFF">
                <g id="TS---01" transform="translate(168.000000, 432.000000)">
                    <g id="Torque-bar" transform="translate(24.000000, 100.000000)">
                        <g id="Button-Pause" transform="translate(0.000000, 4.000000)">
                            <path d="M9,7 L10,7 L10,17 L9,17 L9,7 Z M14,7 L15,7 L15,17 L14,17 L14,7 Z" id="Combined-Shape"></path>
                        </g>
                    </g>
                </g>
            </g>
        </g>
        </svg>
    <%} else { %>
        <svg width="9px" height="11px" viewBox="0 0 9 11" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Time-series" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Time-Series" transform="translate(-200.000000, -279.000000)" fill-rule="nonzero" fill="#FFFFFF">
                <g id="TS---01" transform="translate(168.000000, 168.000000)">
                    <g id="Torque-bar" transform="translate(24.000000, 72.000000)">
                        <g id="Button-Play" transform="translate(0.000000, 32.000000)">
                            <path d="M15.766443,12.044867 L9.20456553,8.10774058 C8.92171794,7.93803203 9,7.89347968 9,8.22734108 L9,16.2102807 C9,16.5418859 8.92367044,16.4984182 9.20456553,16.3298812 L15.766443,12.3927547 C16.0692969,12.2110424 16.0693051,12.2265843 15.766443,12.044867 Z M16.2809387,11.1873741 C17.23035,11.7570209 17.2319213,12.6796581 16.2809387,13.2502477 L9.71906129,17.1873741 C8.76964995,17.7570209 8,17.3168605 8,16.2102807 L8,8.22734108 C8,7.11806049 8.76807871,6.67965811 9.71906129,7.25024766 L16.2809387,11.1873741 Z" id="Triangle"></path>
                        </g>
                    </g>
                </g>
            </g>
        </g>
        </svg>
    <% } %>
    </div>
</button>
