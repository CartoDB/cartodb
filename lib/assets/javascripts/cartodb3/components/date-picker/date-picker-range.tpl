<button class="DatePicker-dates js-dates has-icon">
  <%- _t('components.datepicker.from') %> <strong><%- fromDate %> <%- pad(fromHour,2) %>:<%- pad(fromMin,2) %></strong> <%- _t('components.datepicker.to') %> <strong><%- toDate %> <%- pad(toHour,2) %>:<%- pad(toMin,2) %></strong>
  <i class="CDB-IconFont CDB-IconFont-calendar DatePicker-datesIcon"></i>
</button>
<div class="DatePicker-dropdown">
  <div class="DatePicker-calendar"></div>
  <div class="DatePicker-timers js-timers"></div>
  <div class="DatePicker-shortcuts">
    <p class="DatePicker-shortcutsText">
      <%- _t('components.datepicker.get-last') %> <button type="button" class="Button--link js-fourHours"><%- _t('components.datepicker.hours-pluralize', { smart_count: 4 }) %></button>,
      <button type="button" class="Button--link js-oneDay"><%- _t('components.datepicker.days-pluralize', { smart_count: 1 }) %></button> <%- _t('components.datepicker.or') %>
      <button type="button" class="Button--link js-oneWeek"><%- _t('components.datepicker.weeks-pluralize', { smart_count: 1 }) %></button>
    </p>
    <p class="DatePicker-shortcutsText"><%- _t('components.datepicker.gmt-convertion') %></p>
  </div>
</div>
