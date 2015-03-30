# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

describe Carto::Api::VisualizationsController do
  it_behaves_like 'visualization controllers' do
  end

  before(:all) do
    @ff = Carto::FeatureFlag.new
    @ff.id = 666666
    @ff.name = 'active_record_vis_endpoint'
    @ff.restricted = false
    @ff.save
  end

  after(:all) do
    @ff.destroy if @ff
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
