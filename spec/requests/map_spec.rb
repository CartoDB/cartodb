# encoding: utf-8
require_relative '../acceptance_helper'

feature 'Map' do
  scenario 'allows users to create a line'

  scenario 'allows users to create a polygon'

  scenario 'allows users to delete a point'

  scenario 'allows users to delete a line'

  scenario 'allows users to delete a polygon'

  scenario 'allows users to edit a point'

  scenario 'allows users to edit a line'

  scenario 'allows users to edit a polygon'

  scenario 'allows users to change styles using the Carto window (check updates both in map panel and in unauthenticated maps (share this map))'

  scenario 'shows users an error message when inserting incorrect styles in the Carto window'

  scenario 'allows users to change styles using the wizard (check updates both in map panel and in unauthenticated maps (share this map))'

  scenario 'allows users to create a choropleth map'

  scenario 'allows users to create a bubble map'

  scenario 'allows users to create a density map'

  scenario 'allows users to embed their map'

  scenario 'allows users to change base layer style'

  scenario 'allows users to perform a query'

  scenario 'allows users to perform a query against a private table from an unauthenticated window'

  scenario 'allows users to pan & zoom'

  scenario 'allows users to customize infowindows (play with order, visibility, change template)'

  scenario 'allows users to open your public URL in a different window'

  scenario '¿¿¿¿¿¿¿¿¿ allows users to use a map with custom STYLE in an external application and verify that the style is not changed after changing the target table style from the UI ?????????'

  scenario 'allows users to add their own basemap from mapbox or another cartodb table'
end
