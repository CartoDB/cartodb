<template functional>
  <table border="1" class="jupyter-table">
    <thead>
      <tr style="text-align: right;">
        <th></th>
        <th>anch_depth</th>
        <th>carbchmoor</th>
        <th>cargmdmoor</th>
        <th>cargo_anch</th>
        <th>cargodepth</th>
        <th>cargowharf</th>
        <th>caricemoor</th>
        <th>chan_depth</th>
        <th>chart</th>
        <th>comm_air</th>
        <th>...</th>
        <th>serv_steam</th>
        <th>shelter</th>
        <th>sscc_cert</th>
        <th>the_geom</th>
        <th>tide_range</th>
        <th>tug_assist</th>
        <th>tugsalvage</th>
        <th>turn_basin</th>
        <th>us_rep</th>
        <th>water</th>
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
        <th></th>
        <th></th>
        <th></th>
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
        <th>31</th>
        <td>G</td>
        <td>None</td>
        <td>None</td>
        <td>Y</td>
        <td>J</td>
        <td>Y</td>
        <td>None</td>
        <td>J</td>
        <td>97157</td>
        <td>None</td>
        <td>...</td>
        <td>None</td>
        <td>G</td>
        <td>None</td>
        <td>0101000020E610000077777777777F61405555555555D5...</td>
        <td>9</td>
        <td>Y</td>
        <td>None</td>
        <td>None</td>
        <td>N</td>
        <td>Y</td>
      </tr>
      <tr>
        <th>183</th>
        <td>M</td>
        <td>None</td>
        <td>None</td>
        <td>Y</td>
        <td>J</td>
        <td>None</td>
        <td>None</td>
        <td>L</td>
        <td>95103</td>
        <td>Y</td>
        <td>...</td>
        <td>None</td>
        <td>G</td>
        <td>None</td>
        <td>0101000020E61000002222222222A25F402222222222C2...</td>
        <td>2</td>
        <td>Y</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>Y</td>
      </tr>
      <tr>
        <th>222</th>
        <td>H</td>
        <td>None</td>
        <td>Y</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>A</td>
        <td>57080</td>
        <td>None</td>
        <td>...</td>
        <td>None</td>
        <td>P</td>
        <td>None</td>
        <td>0101000020E6100000CDCCCCCCCCCCF0BFCDCCCCCCCCCC...</td>
        <td>0</td>
        <td>Y</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
      </tr>
      <tr>
        <th>410</th>
        <td>A</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>N</td>
        <td>None</td>
        <td>None</td>
        <td>N</td>
        <td>19402</td>
        <td>None</td>
        <td>...</td>
        <td>None</td>
        <td>P</td>
        <td>None</td>
        <td>0101000020E61000001111111111C964C0DEDDDDDDDDDD...</td>
        <td>1</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>Y</td>
      </tr>
      <tr>
        <th>715</th>
        <td>G</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>L</td>
        <td>Y</td>
        <td>None</td>
        <td>N</td>
        <td>54041</td>
        <td>Y</td>
        <td>...</td>
        <td>None</td>
        <td>G</td>
        <td>None</td>
        <td>0101000020E61000002222222222223140ABAAAAAAAA8A...</td>
        <td>1</td>
        <td>Y</td>
        <td>None</td>
        <td>None</td>
        <td>None</td>
        <td>Y</td>
      </tr>
    </tbody>
  </table>
</template>
<script>
export default {
  name: 'Table5_1'
};
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
