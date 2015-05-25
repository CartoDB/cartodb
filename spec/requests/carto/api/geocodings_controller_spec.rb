# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/geocodings_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/geocodings_controller'

describe Carto::Api::GeocodingsController do
  it_behaves_like 'geocoding controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/available_geometries'           => 'geocodings#available_geometries', as: :api_v1_geocodings_available_geometries
        get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/country_data_for/:country_code' => 'geocodings#country_data_for',     as: :api_v1_geocodings_country_data
      end

    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
