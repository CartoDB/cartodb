# encoding: utf-8

require_relative '../../../spec_helper'
require_relative 'geocodings_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/geocodings_controller'

describe Api::Json::GeocodingsController do
  it_behaves_like 'geocoding controllers' do
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper
end

