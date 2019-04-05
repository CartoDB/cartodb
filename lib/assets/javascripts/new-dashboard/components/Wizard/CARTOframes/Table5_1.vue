<template functional>
  <table border="1" class="jupyter-table">
    <thead>
      <tr style="text-align: right;">
        <th></th>
        <th>commuters_16_over_2011_2015</th>
        <th>geoid</th>
        <th>pop_determined_poverty_status_2011_2015</th>
        <th>poverty_count</th>
        <th>poverty_per_pop</th>
        <th>the_geom</th>
        <th>total_pop_2011_2015</th>
        <th>total_population</th>
        <th>walked_to_work_2011_2015_per_pop</th>
      </tr>
      <tr>
        <th>cartodb_id</th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>2052</th>
        <td>NaN</td>
        <td>360479901000</td>
        <td>NaN</td>
        <td>NaN</td>
        <td>NaN</td>
        <td>None</td>
        <td>NaN</td>
        <td>0</td>
        <td>NaN</td>
      </tr>
      <tr>
        <th>1606</th>
        <td>0.0</td>
        <td>360470702031</td>
        <td>0.0</td>
        <td>NaN</td>
        <td>NaN</td>
        <td>0106000020E61000000800000001030000000100000013...</td>
        <td>0.0</td>
        <td>0</td>
        <td>NaN</td>
      </tr>
      <tr>
        <th>1572</th>
        <td>NaN</td>
        <td>360470666000</td>
        <td>NaN</td>
        <td>NaN</td>
        <td>NaN</td>
        <td>None</td>
        <td>NaN</td>
        <td>0</td>
        <td>NaN</td>
      </tr>
      <tr>
        <th>17</th>
        <td>5058.0</td>
        <td>360470534004</td>
        <td>23191.0</td>
        <td>377.0</td>
        <td>0.406394</td>
        <td>0106000020E6100000010000000103000000010000000B...</td>
        <td>21451.0</td>
        <td>928</td>
        <td>0.018761</td>
      </tr>
      <tr>
        <th>53</th>
        <td>4230.0</td>
        <td>360470593001</td>
        <td>10804.0</td>
        <td>117.0</td>
        <td>0.098598</td>
        <td>0106000020E6100000010000000103000000010000000E...</td>
        <td>8116.0</td>
        <td>1185</td>
        <td>0.031915</td>
      </tr>
    </tbody>
  </table>
</template>
<script>
export default {
  name: 'Table5_1'
}
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.jupyter-table {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 12px;
}

.jupyter-table tbody tr th:only-of-type {
  vertical-align: middle;
}

.jupyter-table tbody tr th {
  vertical-align: top;
}

.jupyter-table thead th {
  text-align: right;
}

tbody tr:nth-child(odd) {
  background: #f5f5f5;
}

thead {
  border-bottom: 1px solid #000;
  vertical-align: bottom;
}

td,
th,
tr {
  max-width: none;
  padding: .5em;
  border: none;
  line-height: normal;
  text-align: right;
  vertical-align: middle;
  white-space: normal;
}

th {
  font-weight: 700;
}
</style>
