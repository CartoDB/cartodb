# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

describe Carto::Api::VisualizationsController do
  it_behaves_like 'visualization controllers' do
    let(:base_url) { '/api/v11/viz' }
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
