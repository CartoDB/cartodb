# encoding: utf-8

require_relative '../../api/json/visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

def base_url
  '/api/v11/viz'
end

describe Carto::Api::VisualizationsController do
  it_behaves_like 'visualization controllers'

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
