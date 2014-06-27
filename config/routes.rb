# encoding: utf-8

CartoDB::Application.routes.draw do
  root :to => 'admin/pages#public'

  get   '/datasets' => 'admin/pages#datasets'

  get   '/login' => 'sessions#new', as: :login
  get   '/logout' => 'sessions#destroy', as: :logout
  match '/sessions/create' => 'sessions#create', as: :create_session
  match '/limits' => 'home#limits', as: :limits
  match '/status' => 'home#app_status'

  get   '/test' => 'test#index', as: :test

  scope :module => 'admin' do

    get '(/u/:user_domain)/dashboard/'  => 'visualizations#index', as: :dashboard

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

    # Search
    get '(/u/:user_domain)/dashboard/search/:q'               => 'visualizations#index', as: :search
    get '(/u/:user_domain)/dashboard/search/:q/:page'         => 'visualizations#index', as: :search_page
    get '(/u/:user_domain)/dashboard/shared/search/:q'        => 'visualizations#index', as: :search_shared
    get '(/u/:user_domain)/dashboard/shared/search/:q/:page'  => 'visualizations#index', as: :search_shared_page

    get '(/u/:user_domain)/dashboard/visualizations/search/:q'               => 'visualizations#index'
    get '(/u/:user_domain)/dashboard/visualizations/search/:q/:page'         => 'visualizations#index'
    get '(/u/:user_domain)/dashboard/visualizations/shared/search/:q'        => 'visualizations#index'
    get '(/u/:user_domain)/dashboard/visualizations/shared/search/:q/:page'  => 'visualizations#index'

    get '(/u/:user_domain)/dashboard/tables/search/:q'                       => 'visualizations#index'
    get '(/u/:user_domain)/dashboard/tables/search/:q/:page'                 => 'visualizations#index'
    get '(/u/:user_domain)/dashboard/tables/shared/search/:q'                => 'visualizations#index'
    get '(/u/:user_domain)/dashboard/tables/shared/search/:q/:page'          => 'visualizations#index'

    # Tags
    get '(/u/:user_domain)/dashboard/tag/:tag'                       => 'visualizations#index'

    # Private dashboard
    get '(/u/:user_domain)/dashboard'                => 'visualizations#index'
    get '(/u/:user_domain)/dashboard/common_data'    => 'pages#common_data', as: :dashboard_common_data

    # Public dashboard
    # root goes to 'pages#public'
    get '(/u/:user_domain)/page/:page'               => 'pages#public'
    get '(/u/:user_domain)/tag/:tag'                 => 'pages#public', as: :public_tag
    get '(/u/:user_domain)/tag/:tag/:page'           => 'pages#public'

    get '(/u/:user_domain)/datasets/page/:page'      => 'pages#datasets'
    get '(/u/:user_domain)/datasets/tag/:tag'        => 'pages#datasets', as: :dataset_public_tag
    get '(/u/:user_domain)/datasets/tag/:tag/:page'  => 'pages#datasets'

    get '(/u/:user_domain)/tables/track_embed'       => 'visualizations#track_embed'
    get '(/u/:user_domain)/tables/embed_forbidden'   => 'visualizations#embed_forbidden'
    get '(/u/:user_domain)/tables/embed_protected'   => 'visualizations#embed_protected'
    get '(/u/:user_domain)/tables/:id/'              => 'visualizations#show', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id'               => 'visualizations#show', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/map'           => 'visualizations#show', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/table'         => 'visualizations#show', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public'        => 'visualizations#public_table', as: :public_table, constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public/table'  => 'visualizations#public_table', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public/map'    => 'visualizations#public_table', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/embed_map'     => 'visualizations#embed_map', constraints: { id: /[^\/]+/ }

    get '(/u/:user_domain)/viz'                      => 'visualizations#index'
    get '(/u/:user_domain)/viz/track_embed'          => 'visualizations#track_embed'
    get '(/u/:user_domain)/viz/embed_forbidden'      => 'visualizations#embed_forbidden'
    get '(/u/:user_domain)/viz/:id'                  => 'visualizations#show', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/map'              => 'visualizations#show', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/table'            => 'visualizations#show', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/public'           => 'visualizations#public_table', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/embed_map'        => 'visualizations#embed_map', constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/public_map'       => 'visualizations#public_map', constraints: { id: /[^\/]+/ }

    get '(/u/:user_domain)/viz/:id/protected_embed_map'  => 'visualizations#show_protected_embed_map', constraints: { id: /[^\/]+/ }
    post '(/u/:user_domain)/viz/:id/protected_embed_map' => 'visualizations#show_protected_embed_map', as: :protected_embed_map, constraints: { id: /[^\/]+/ }

    get '(/u/:user_domain)/viz/:id/protected_public_map'  => 'visualizations#show_protected_public_map', constraints: { id: /[^\/]+/ }
    post '(/u/:user_domain)/viz/:id/protected_public_map' => 'visualizations#show_protected_public_map', as: :protected_public_map, constraints: { id: /[^\/]+/ }

    match '(/u/:user_domain)/your_apps' => 'client_applications#api_key', as: :api_key_credentials
    post  '(/u/:user_domain)/your_apps/api_key/regenerate' => 'client_applications#regenerate_api_key', as: :regenerate_api_key
    delete  '(/u/:user_domain)/your_apps/oauth'   => 'client_applications#oauth',   as: :oauth_credentials

  end


  namespace :superadmin do
    resources :users
    resources :organizations
    resources :synchronizations
  end

  scope :oauth, :path => :oauth do
    match '(/u/:user_domain)/authorize'      => 'oauth#authorize',     as: :authorize
    match '(/u/:user_domain)/request_token'  => 'oauth#request_token', as: :request_token
    match '(/u/:user_domain)/access_token'   => 'oauth#access_token',  as: :access_token
    get   '(/u/:user_domain)/identity'       => 'sessions#show'
  end

  scope '/api' do
    namespace CartoDB::API::VERSION_1, :format => :json, :module => 'api/json' do
      get    '/column_types'                                    => 'meta#column_types'

      get '/get_authenticated_users'                         => 'users#get_authenticated_users'

      resources :tables, :only => [:create, :show, :update], constraints: { id: /[^\/]+/ } do
        collection do
          get '/tags/:tag_name' => 'tables#index', as: 'show_tag'
        end

        resources :records, :only => [:index, :create, :show, :update, :destroy]
        resources :columns, :only => [:index, :create, :show, :update, :destroy]
      end

      # imports
      resources :uploads, :only                           => :create
      resources :imports, :only                           => [:create, :show, :index]
      get     '/imports/service/:id/token_valid'          => 'imports#service_token_valid?'
      get     '/imports/service/:id/list_files'           => 'imports#list_files_for_service'
      get     '/imports/service/:id/auth_url'             => 'imports#get_service_auth_url'
      get     '/imports/service/:id/validate_code/:code'  => 'imports#validate_service_oauth_code'
      delete  '/imports/service/:id/invalidate_token'     => 'imports#invalidate_service_token'
      # Must be GET verb
      get     '/imports/service/:id/oauth_callback/'  => 'imports#service_oauth_callback'

      # Dashboard
      resources :users, :only                       => [:show] do
        resources :layers, :only                    => [:create, :index, :update, :destroy]
        resources :assets, :only                    => [:create, :index, :destroy]
      end

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

      get     'viz/tags' => 'tags#index', as: 'list_tags'
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
end

