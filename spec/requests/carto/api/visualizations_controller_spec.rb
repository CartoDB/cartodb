# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

describe Carto::Api::VisualizationsController do
  it_behaves_like 'visualization controllers' do
  end

  before(:all) do
    # INFO: this is not needed now for this test
    # Set the feature flag (is this needed?). All new users will have it
    @ff = Carto::FeatureFlag.new
    @ff.id = 666666
    @ff.name = 'active_record_vis_endpoint'
    @ff.restricted = false
    @ff.save

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                                => 'visualizations#index',           as: :api_v1_visualizations_index
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#show',            as: :api_v1_visualizations_show,            constraints: { id: /[^\/]+/ }
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/likes'                      => 'visualizations#likes_count',     as: :api_v1_visualizations_likes_count,     constraints: { id: /[^\/]+/ }
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/likes/detailed'             => 'visualizations#likes_list',      as: :api_v1_visualizations_likes_list,      constraints: { id: /[^\/]+/ }
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#is_liked',        as: :api_v1_visualizations_is_liked,        constraints: { id: /[^\/]+/ }

        get     '(/user/:user_domain)(/u/:user_domain)/api/v2/viz/:id/viz'                        => 'visualizations#vizjson2', as: :api_v2_visualizations_vizjson, constraints: { id: /[^\/]+/ }

        # overlays (also needed in some tests)
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays'     => 'overlays#index',    as: :api_v1_visualizations_overlays_index,  constraints: { visualization_id: /[^\/]+/ }

        # watching
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/watching'                   => 'visualizations#list_watching',   as: :api_v1_visualizations_notify_watching, constraints: { id: /[^\/]+/ }
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                                => 'visualizations#create',          as: :api_v1_visualizations_create
        put     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#update',          as: :api_v1_visualizations_update,          constraints: { id: /[^\/]+/ }
        put '(/user/:user_domain)(/u/:user_domain)/api/v1/perm/:id' => 'permissions#update', as: :api_v1_permissions_update
        post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#add_like',        as: :api_v1_visualizations_add_like,        constraints: { id: /[^\/]+/ }
        delete  '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#remove_like',     as: :api_v1_visualizations_remove_like,     constraints: { id: /[^\/]+/ }
        delete  '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#destroy',         as: :api_v1_visualizations_destroy,         constraints: { id: /[^\/]+/ }

        post '(/user/:user_domain)(/u/:user_domain)/api/v1/tables'     => 'tables#create', as: :api_v1_tables_create
        put '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id'  => 'tables#update', as: :api_v1_tables_update, constraints: { id: /[^\/]+/ }
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
