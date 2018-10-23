<template>
  <div class="container grid">
    <MapCard :map=test size=medium></MapCard>
    <MapCard :map=test2 size=medium></MapCard>
    <MapCard :map=test></MapCard>
  </div>
</template>

<script>
import MapCard from '../components/MapCard';

export default {
  name: 'MapsPage',
  components: {
    MapCard
  },
  computed: {
    test: () =>
      ({
        thumbnailUrl: 'https://carto.com/help/images/building-maps/add-columns-from-second-dataset/join-columns.png',
        name: 'NYC Stores Sales Dashboard',
        description: 'Real-time comparison of Nordstrom stores sales numbers and more stuff related with business insights. Real-time comparison of Nordstrom stores sales numbers and more stuff related with business insights',
        privacy: 'Locked',
        updatedAt: new Date(2018, 9, 23),
        favorite: true,
        tagList: ['test', 'this is my test', 'first map', 'CARTO', 'Another tag to make a bit of space'],
        views: 23
      }),
    test2: () =>
      ({
        thumbnailUrl: 'https://carto.com/help/images/building-maps/builder-viz-workshop/01-torque-04.png',
        name: 'Mi mapaza',
        description: 'This mapaza is just a test of a place holder 1, 2, 3 probando probando 1, 2',
        privacy: 'Locked',
        updatedAt: new Date(2018, 10, 23),
        favorite: true,
        tagList: [],
        views: 23
      })
  }
};
</script>
