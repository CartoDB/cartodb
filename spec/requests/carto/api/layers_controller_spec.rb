# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/layers_controller'
require_relative '../../../../spec/requests/api/json/layers_controller_shared_examples'


describe Carto::Api::LayersController do
  include Rack::Test::Methods
  include Warden::Test::Helpers

  it_behaves_like 'layers controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/users/:user_id/layers'     => 'layers#index',   as: :api_v1_users_layers_index
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/maps/:map_id/layers'     => 'layers#index',   as: :api_v1_maps_layers_index
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/maps/:map_id/layers/:id' => 'layers#show',    as: :api_v1_maps_layers_show
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        put '(/user/:user_domain)(/u/:user_domain)/api/v1/perm/:id' => 'permissions#update', as: :api_v1_permissions_update
      end

    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

end
