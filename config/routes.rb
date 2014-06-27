# encoding: utf-8

CartoDB::Application.routes.draw do
  root :to => 'admin/pages#public'

  get   '/datasets' => 'admin/pages#datasets'

  get   '/login' => 'sessions#new', as: :login
  get   '/logout' => 'sessions#destroy', as: :logout
  #TODO: Test this matches
  match '/sessions/create' => 'sessions#create', as: :create_session
  match '/limits' => 'home#limits', as: :limits
  match '/status' => 'home#app_status'

  get   '/test' => 'test#index', as: :test

  scope :module => :admin do

    # Organization dashboard page
    get    '(/u/:user_domain)/organization'                 => 'organizations#show', as: :organization
    # Organization users management
    get    '(/u/:user_domain)/organization/users/:id/edit'  => 'users#edit',    as: :edit_organization_user,   constraints: { id: /[0-z\.\-]+/ }
    put    '(/u/:user_domain)/organization/users/:id'       => 'users#update',  as: :update_organization_user, constraints: { id: /[0-z\.\-]+/ }
    post   '(/u/:user_domain)/organization/users'           => 'users#create',  as: :create_organization_user
    delete '(/u/:user_domain)/organization/users/:id'       => 'users#destroy', as: :delete_organization_user, constraints: { id: /[0-z\.\-]+/ }
    get    '(/u/:user_domain)/organization/users/new'       => 'users#new',     as: :new_organization_user

    # Tables
    get '(/u/:user_domain)/dashboard/tables'                        => 'visualizations#index', as: :tables_index
    get '(/u/:user_domain)/dashboard/tables/:page'                  => 'visualizations#index', as: :tables_page
    get '(/u/:user_domain)/dashboard/tables/tag/:tag'               => 'visualizations#index', as: :tables_tag
    get '(/u/:user_domain)/dashboard/tables/tag/:tag/:page'         => 'visualizations#index', as: :tables_tag_page
    get '(/u/:user_domain)/dashboard/tables/shared'                 => 'visualizations#index', as: :tables_shared
    get '(/u/:user_domain)/dashboard/tables/shared/:page'           => 'visualizations#index', as: :tables_shared_page
    get '(/u/:user_domain)/dashboard/tables/shared/tag/:tag'        => 'visualizations#index', as: :tables_shared_tag
    get '(/u/:user_domain)/dashboard/tables/shared/tag/:tag/:page'  => 'visualizations#index', as: :tables_shared_tag_page

    # Visualizations
    get '(/u/:user_domain)/dashboard/visualizations'                        => 'visualizations#index', as: :visualizations_index
    get '(/u/:user_domain)/dashboard/visualizations/:page'                  => 'visualizations#index', as: :visualizations_page
    get '(/u/:user_domain)/dashboard/visualizations/tag/:tag'               => 'visualizations#index', as: :visualizations_tag
    get '(/u/:user_domain)/dashboard/visualizations/tag/:tag/:page'         => 'visualizations#index', as: :visualizations_tag_page
    get '(/u/:user_domain)/dashboard/visualizations/shared'                 => 'visualizations#index', as: :visualizations_shared
    get '(/u/:user_domain)/dashboard/visualizations/shared/:page'           => 'visualizations#index', as: :visualizations_shared_page
    get '(/u/:user_domain)/dashboard/visualizations/shared/tag/:tag'        => 'visualizations#index', as: :visualizations_shared_tag
    get '(/u/:user_domain)/dashboard/visualizations/shared/tag/:tag/:page'  => 'visualizations#index', as: :visualizations_shared_tag_page

    # search
    get '(/u/:user_domain)/dashboard/search/:q'               => 'visualizations#index', as: :search
    get '(/u/:user_domain)/dashboard/search/:q/:page'         => 'visualizations#index', as: :search_page
    get '(/u/:user_domain)/dashboard/shared/search/:q'        => 'visualizations#index', as: :search_shared
    get '(/u/:user_domain)/dashboard/shared/search/:q/:page'  => 'visualizations#index', as: :search_shared_page

    # Visualizations search
    get '(/u/:user_domain)/dashboard/visualizations/search/:q'               => 'visualizations#index', as: :visualizations_search
    get '(/u/:user_domain)/dashboard/visualizations/search/:q/:page'         => 'visualizations#index', as: :visualizations_search_page
    get '(/u/:user_domain)/dashboard/visualizations/shared/search/:q'        => 'visualizations#index', as: :visualizations_shared_search
    get '(/u/:user_domain)/dashboard/visualizations/shared/search/:q/:page'  => 'visualizations#index', as: :visualizations_shared_search_page

    # Tables search
    get '(/u/:user_domain)/dashboard/tables/search/:q'              => 'visualizations#index', as: :tables_search
    get '(/u/:user_domain)/dashboard/tables/search/:q/:page'        => 'visualizations#index', as: :tables_search_page
    get '(/u/:user_domain)/dashboard/tables/shared/search/:q'       => 'visualizations#index', as: :tables_shared_search
    get '(/u/:user_domain)/dashboard/tables/shared/search/:q/:page' => 'visualizations#index', as: :tables_shared_search_page

    # Tags
    get '(/u/:user_domain)/dashboard/tag/:tag'  => 'visualizations#index', as: :tags

    # Private dashboard
    get '(/u/:user_domain)/dashboard/'            => 'visualizations#index', as: :dashboard
    get '(/u/:user_domain)/dashboard'             => 'visualizations#index', as: :dashboard_bis
    get '(/u/:user_domain)/dashboard/common_data' => 'pages#common_data',    as: :dashboard_common_data

    # Public dashboard
    # root goes to 'pages#public'
    get '(/u/:user_domain)/page/:page'               => 'pages#public', as: :public_page
    get '(/u/:user_domain)/tag/:tag'                 => 'pages#public', as: :public_tag
    get '(/u/:user_domain)/tag/:tag/:page'           => 'pages#public', as: :public_tag_page
    # Public dataset
    get '(/u/:user_domain)/datasets/page/:page'      => 'pages#datasets', as: :public_datasets_page
    get '(/u/:user_domain)/datasets/tag/:tag'        => 'pages#datasets', as: :public_dataset_tag
    get '(/u/:user_domain)/datasets/tag/:tag/:page'  => 'pages#datasets', as: :public_dataset_tag_page
    # Public tables
    get '(/u/:user_domain)/tables/track_embed'       => 'visualizations#track_embed',     as: :public_tables_track_embed
    get '(/u/:user_domain)/tables/embed_forbidden'   => 'visualizations#embed_forbidden', as: :public_tables_embed_forbidden
    get '(/u/:user_domain)/tables/embed_protected'   => 'visualizations#embed_protected', as: :public_tables_embed_protected
    get '(/u/:user_domain)/tables/:id/'              => 'visualizations#show',            as: :public_tables_show,      constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id'               => 'visualizations#show',            as: :public_tables_show_bis,  constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/map'           => 'visualizations#show',            as: :public_tables_show_map,  constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/table'         => 'visualizations#show',            as: :public_tables_table,     constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public'        => 'visualizations#public_table',    as: :public_table,            constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public/table'  => 'visualizations#public_table',    as: :public_table_table,      constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public/map'    => 'visualizations#public_table',    as: :public_table_map,        constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/embed_map'     => 'visualizations#embed_map',       as: :public_tables_embed_map, constraints: { id: /[^\/]+/ }
    # Public visualizations
    get '(/u/:user_domain)/viz'                      => 'visualizations#index',           as: :public_visualizations
    get '(/u/:user_domain)/viz/track_embed'          => 'visualizations#track_embed',     as: :public_visualizations_track_embed
    get '(/u/:user_domain)/viz/embed_forbidden'      => 'visualizations#embed_forbidden', as: :public_visualizations_embed_forbidden
    get '(/u/:user_domain)/viz/:id'                  => 'visualizations#show',            as: :public_visualizations_show,       constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/map'              => 'visualizations#show',            as: :public_visualizations_show_map,   constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/table'            => 'visualizations#show',            as: :public_visualizations_table,      constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/public'           => 'visualizations#public_table',    as: :public_visualization,             constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/embed_map'        => 'visualizations#embed_map',       as: :public_visualizations_embed_map,  constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/public_map'       => 'visualizations#public_map',      as: :public_visualizations_public_map, constraints: { id: /[^\/]+/ }
    # Public protected embed maps
    get '(/u/:user_domain)/viz/:id/protected_embed_map'  => 'visualizations#show_protected_embed_map', constraints: { id: /[^\/]+/ }
    post '(/u/:user_domain)/viz/:id/protected_embed_map' => 'visualizations#show_protected_embed_map', as: :protected_embed_map, constraints: { id: /[^\/]+/ }
    # Public protected maps
    get '(/u/:user_domain)/viz/:id/protected_public_map'  => 'visualizations#show_protected_public_map', constraints: { id: /[^\/]+/ }
    post '(/u/:user_domain)/viz/:id/protected_public_map' => 'visualizations#show_protected_public_map', as: :protected_public_map, constraints: { id: /[^\/]+/ }

    #TODO: Test this matches
    match '(/u/:user_domain)/your_apps'                    => 'client_applications#api_key',            as: :api_key_credentials
    post  '(/u/:user_domain)/your_apps/api_key/regenerate' => 'client_applications#regenerate_api_key', as: :regenerate_api_key
    delete  '(/u/:user_domain)/your_apps/oauth'            => 'client_applications#oauth',              as: :oauth_credentials

  end

  # TODO: Check this urls
  scope :module => :oauth do
    #TODO: Test this matches
    match '(/u/:user_domain)/oauth/authorize'      => 'oauth#authorize',     as: :authorize
    match '(/u/:user_domain)/oauth/request_token'  => 'oauth#request_token', as: :request_token
    match '(/u/:user_domain)/oauth/access_token'   => 'oauth#access_token',  as: :access_token
    get   '(/u/:user_domain)/oauth/identity'       => 'sessions#show',       as: :oauth_show_sessions
  end

  scope :module => 'api/json', :format => :json do

    #V1

    # Meta
    get '(/u/:user_domain)/api/v1/column_types' => 'meta#column_types', as: :api_v1_meta_column_types

    # Users
    get '(/u/:user_domain)/api/v1/get_authenticated_users' => 'users#get_authenticated_users', as: :api_v1_users_get_authenticated_user

    # Tables
    post '(/u/:user_domain)/api/v1/tables'     => 'tables#create', as: :api_v1_tables_create
    get '(/u/:user_domain)/api/v1/tables/:id'  => 'tables#show',   as: :api_v1_tables_create, constraints: { id: /[^\/]+/ }
    put '(/u/:user_domain)/api/v1/tables/:id'  => 'tables#update', as: :api_v1_tables_create, constraints: { id: /[^\/]+/ }

    # Table records
    get    '(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#index',   as: :api_v1_tables_records_index,  constraints: { table_id: /[^\/]+/ }
    post   '(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#create',  as: :api_v1_tables_records_create, constraints: { table_id: /[^\/]+/ }
    get    '(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#show',    as: :api_v1_tables_records_show,   constraints: { table_id: /[^\/]+/ }
    put    '(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#update',  as: :api_v1_tables_record_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#destroy', as: :api_v1_tables_record_destroy, constraints: { table_id: /[^\/]+/ }

    # Table columns
    get    '(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#index',   as: :api_v1_tables_columns_index,   constraints: { table_id: /[^\/]+/ }
    post   '(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#create',  as: :api_v1_tables_columns_create,  constraints: { table_id: /[^\/]+/ }
    get    '(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#show',    as: :api_v1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }
    put    '(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#update',  as: :api_v1_tables_columns_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#destroy', as: :api_v1_tables_columns_destroy, constraints: { table_id: /[^\/]+/ }

    # Uploads
    post '(/u/:user_domain)/api/v1/uploads' => 'uploads#create', as: :api_v1_uploads_create

    # Imports
    post   '(/u/:user_domain)/api/v1/imports'                          => 'imports#create',                      as: :api_v1_imports_create
    get    '(/u/:user_domain)/api/v1/imports/:id'                      => 'imports#show',                        as: :api_v1_imports_show
    get    '(/u/:user_domain)/api/v1/imports'                          => 'imports#index',                       as: :api_v1_imports_index

    # Import services
    get    '(/u/:user_domain)/api/v1/imports/service/:id/token_valid'         => 'imports#service_token_valid?',        as: :api_v1_imports_service_token_valid
    get    '(/u/:user_domain)/api/v1/imports/service/:id/list_files'          => 'imports#list_files_for_service',      as: :api_v1_imports_service_list_files
    get    '(/u/:user_domain)/api/v1/imports/service/:id/auth_url'            => 'imports#get_service_auth_url',        as: :api_v1_imports_service_auth_url
    get    '(/u/:user_domain)/api/v1/imports/service/:id/validate_code/:code' => 'imports#validate_service_oauth_code', as: :api_v1_imports_service_validate_code
    delete '(/u/:user_domain)/api/v1/imports/service/:id/invalidate_token'    => 'imports#invalidate_service_token',    as: :api_v1_imports_service_invalidate_token
    # Must be GET verb despite altering state
    get     '(/u/:user_domain)/api/v1/imports/service/:id/oauth_callback/'    => 'imports#service_oauth_callback',      as: :api_v1_imports_service_oauth_callback

    # Users
    get    '(/u/:user_domain)/api/v1/users/:id'                 => 'users#show',     as: :api_v1_users_show

    # User layers
    post   '(/u/:user_domain)/api/v1/users/:user_id/layers'     => 'layers#create',  as: :api_v1_users_layers_create
    get    '(/u/:user_domain)/api/v1/users/:user_id/layers'     => 'layers#index',   as: :api_v1_users_layers_index
    put    '(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#update',  as: :api_v1_users_layers_update
    delete '(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#destroy', as: :api_v1_users_layers_destroy

    # User assets
    post   '(/u/:user_domain)/api/v1/users/:user_id/assets'     => 'assets#create',  as: :api_v1_users_assets_create
    get    '(/u/:user_domain)/api/v1/users/:user_id/assets'     => 'assets#index',   as: :api_v1_users_assets_index
    delete '(/u/:user_domain)/api/v1/users/:user_id/assets/:id' => 'assets#destroy', as: :api_v1_users_assets_destroy


  end

  scope '/api' do
    namespace CartoDB::API::VERSION_1, :format => :json, :module => 'api/json' do

      # Maps
      resources :maps, :only                        => [:show, :create, :update, :destroy] do
        resources :layers, :only                    => [:show, :index, :create, :update, :destroy]
      end

      # Geocoder
      resources :geocodings, :only                  => [:create, :show, :index, :update] do
        get 'country_data_for/:country_code', to: 'geocodings#country_data_for', on: :collection, as: 'country_data'
        get 'estimation_for/:table_name',     to: 'geocodings#estimation_for',   on: :collection, as: 'estimation_for'
        get 'get_countries',                  to: 'geocodings#get_countries',    on: :collection, as: 'get_countries'
      end

      get     'viz/tags'                            => 'tags#index', as: 'list_tags'
      get     'viz'                                 => 'visualizations#index'
      post    'viz'                                 => 'visualizations#create'
      get     'viz/:id/stats'                       => 'visualizations#stats', constraints: { id: /[^\/]+/ }
      get     'viz/:id'                             => 'visualizations#show', constraints: { id: /[^\/]+/ }
      put     'viz/:id'                             => 'visualizations#update', constraints: { id: /[^\/]+/ }
      delete  'viz/:id'                             => 'visualizations#destroy', constraints: { id: /[^\/]+/ }
      get     'viz/:id/viz'                         => 'visualizations#vizjson1', as: :vizjson, constraints: { id: /[^\/]+/ }
      get     'viz/:visualization_id/overlays'      => 'overlays#index', constraints: { visualization_id: /[^\/]+/ }
      post    'viz/:visualization_id/overlays'      => 'overlays#create', constraints: { visualization_id: /[^\/]+/ }
      get     'viz/:visualization_id/overlays/:id'  => 'overlays#show', constraints: { visualization_id: /[^\/]+/ }
      put     'viz/:visualization_id/overlays/:id'  => 'overlays#update', constraints: { visualization_id: /[^\/]+/ }
      delete  'viz/:visualization_id/overlays/:id'  => 'overlays#destroy', constraints: { visualization_id: /[^\/]+/ }

      # Tags
      resources :tags, :only                                    => [:index]
      # Synchronizations
      get     'synchronizations'              => 'synchronizations#index'
      post    'synchronizations'              => 'synchronizations#create'
      get     'synchronizations/:id'          => 'synchronizations#show'
      put     'synchronizations/:id'          => 'synchronizations#update'
      delete  'synchronizations/:id'          => 'synchronizations#destroy'
      get     'synchronizations/:id/sync_now' => 'synchronizations#syncing?'
      put     'synchronizations/:id/sync_now' => 'synchronizations#sync_now'

      # Permissions
      get     'perm/:id' => 'permissions#show'
      put     'perm/:id' => 'permissions#update'

      # Organizations
      get     'org/'      => 'organizations#show'
      get     'org/users' => 'organizations#users'

    end

    get '/v2/viz/:id/viz'    => 'api/json/visualizations#vizjson2', as: :vizjson, constraints: { id: /[^\/]+/ }
    get '/v2/wms'            => 'api/json/wms#proxy'

  end

  namespace :superadmin do
    resources :users
    resources :organizations
    resources :synchronizations
  end

end

