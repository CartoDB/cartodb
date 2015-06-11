# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

def factory(user, attributes={})
  visualization_template(user, attributes)
end

describe Carto::Api::VisualizationsController do
  it_behaves_like 'visualization controllers' do
  end

  before(:all) do
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

  describe 'index' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    before(:each) do
      login(@user1)
      @headers = {'CONTENT_TYPE'  => 'application/json'}
    end

    it 'orders remotes by size with external sources size' do
      post api_v1_visualizations_create_url(api_key: @user1.api_key), factory(@user1, locked: true, type: 'remote').to_json, @headers
      vis_1_id = JSON.parse(last_response.body).fetch('id')
      external_source_2 = Carto::ExternalSource.new({visualization_id: vis_1_id, import_url: 'http://www.fake.com', rows_counted: 1, size: 100 }).save

      post api_v1_visualizations_create_url(api_key: @user1.api_key), factory(@user1, locked: true, type: 'remote').to_json, @headers
      vis_2_id = JSON.parse(last_response.body).fetch('id')
      external_source_2 = Carto::ExternalSource.new({visualization_id: vis_2_id, import_url: 'http://www.fake.com', rows_counted: 1, size: 200 }).save

      post api_v1_visualizations_create_url(api_key: @user1.api_key), factory(@user1, locked: true, type: 'remote').to_json, @headers
      vis_3_id = JSON.parse(last_response.body).fetch('id')
      external_source_3 = Carto::ExternalSource.new({visualization_id: vis_3_id, import_url: 'http://www.fake.com', rows_counted: 1, size: 10 }).save

      get api_v1_visualizations_index_url(api_key: @user1.api_key, types: 'remote', order: 'size'), {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should eq 3
      collection[0]['id'].should == vis_2_id
      collection[1]['id'].should == vis_1_id
      collection[2]['id'].should == vis_3_id
    end

  end

  describe 'index shared_only' do
    include_context 'organization with users helper'
    include_context 'visualization creation helpers'

    it 'should not display nor count the shared visualizations you own' do
      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table#{rand(9999)}_1", user_id: @org_user_1.id)
      u1_t_1_id = table.table_visualization.id
      u1_t_1_perm_id = table.table_visualization.permission.id

      share_table_with_organization(table, @org_user_1, @organization)

      get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_ONLY), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 0
      body['visualizations'].count.should eq 0
    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
