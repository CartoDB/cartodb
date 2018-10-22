<template>
  <div class="container grid">
    <MapCard :map=test></MapCard>
    <MapCard :map=test2></MapCard>
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
        thumbnailUrl: "https://carto.com/help/images/building-maps/add-columns-from-second-dataset/join-columns.png",
        name: "NYC Stores Sales Dashboard",
        description: "Real-time comparison of Nordstrom stores sales numbers and more stuff related with business insights. Real-time comparison of Nordstrom stores sales numbers and more stuff related with business insights",
        privacy: "Locked",
        updatedAt: "Updated yesterday",
        favorite: true,
        tagList: ["test", "this is my test", "first map", "CARTO", "Another tag to make a bit of space"],
        views: 23
      }),
    test2: () => 
      ({
        thumbnailUrl: "https://carto.com/help/images/building-maps/builder-viz-workshop/01-torque-04.png",
        name: "Mi mapaza",
        description: "This mapaza is just a test of a place holder 1, 2, 3 probando probando 1, 2",
        privacy: "Locked",
        updatedAt: "Updated yesterday",
        favorite: true,
        tagList: [],
        views: 23
      })
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
