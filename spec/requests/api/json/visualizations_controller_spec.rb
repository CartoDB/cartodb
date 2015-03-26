# encoding: utf-8

require_relative '../../../spec_helper'
require_relative 'visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/visualizations_controller'

def base_url
  '/api/v1/viz'
end

describe Api::Json::VisualizationsController do
  it_behaves_like 'visualization controllers'

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
