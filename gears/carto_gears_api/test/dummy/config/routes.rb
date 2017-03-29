Rails.application.routes.draw do

  mount CartoGearsApi::Engine => "/carto_gears_api"
end
