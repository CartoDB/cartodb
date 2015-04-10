# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

describe Carto::Api::VisualizationsController do
  it_behaves_like 'visualization controllers' do
  end

  before(:all) do
    # Set the feature flag (is this needed?). All new users will have it
    @ff = Carto::FeatureFlag.new
    @ff.id = 666666
    @ff.name = 'active_record_vis_endpoint'
    @ff.restricted = false
    @ff.save

    # Monkey-patch the routes so that it uses the new controller
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get     '(/u/:user_domain)/api/v1/viz'                                => 'visualizations#index',           as: :api_v11_visualizations_index
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/likes'                      => 'visualizations#likes_count',     as: :api_v1_visualizations_likes_count,     constraints: { id: /[^\/]+/ }
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/likes/detailed'             => 'visualizations#likes_list',      as: :api_v1_visualizations_likes_list,      constraints: { id: /[^\/]+/ }
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#is_liked',        as: :api_v1_visualizations_is_liked,        constraints: { id: /[^\/]+/ }
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                                => 'visualizations#index',           as: :api_v1_visualizations_index
        post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                                => 'visualizations#create',          as: :api_v1_visualizations_create
        put '(/user/:user_domain)(/u/:user_domain)/api/v1/perm/:id' => 'permissions#update', as: :api_v1_permissions_update
        post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#add_like',        as: :api_v1_visualizations_add_like,        constraints: { id: /[^\/]+/ }
        delete  '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#remove_like',     as: :api_v1_visualizations_remove_like,     constraints: { id: /[^\/]+/ }
      end
    end

  end

  after(:all) do
    @ff.destroy if @ff
    Rails.application.reload_routes!
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
