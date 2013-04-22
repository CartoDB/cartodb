# encoding: utf-8

CartoDB::Application.routes.draw do
  root :to => redirect("/login")

  get   '/login' => 'sessions#new', :as => :login
  get   '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session
  match '/limits' => 'home#limits', :as => :limits
  match '/status' => 'home#app_status'

  get   '/test' => 'test#index', :as => :test

  scope :module => "admin" do
    match '/dashboard/'               => 'tables#index', :as => :dashboard
    match '/dashboard/common_data'  => 'pages#common_data'

    resources :tables, :only => [:show] do
      get 'embed_map', :on => :member
      get 'track_embed', :on => :collection
      get 'embed_forbidden', :on => :collection
      get 'public' => 'tables#show_public', :on => :member
    end

    resources :visualizations, :only => [:index, :show] do
      get 'embed_map',    :on => :member
      get 'track_embed',  :on => :collection
      get 'public' => 'visualizations#public', :on => :member
    end

    match '/your_apps/oauth'   => 'client_applications#oauth',   :as => :oauth_credentials
    match '/your_apps/api_key' => 'client_applications#api_key', :as => :api_key_credentials
    post  '/your_apps/api_key/regenerate' => 'client_applications#regenerate_api_key', :as => :regenerate_api_key

  end

  namespace :superadmin do
    get '/' => 'users#index', :as => :users
    post '/' => 'users#create', :as => :users
    resources :users, :only => [:create, :update, :destroy, :show]
  end

  scope :oauth, :path => :oauth do
    match '/authorize'      => 'oauth#authorize',     :as => :authorize
    match '/request_token'  => 'oauth#request_token', :as => :request_token
    match '/access_token'   => 'oauth#access_token',  :as => :access_token
    get   '/identity'       => 'sessions#show'
  end

  scope "/api" do
    namespace CartoDB::API::VERSION_1, :format => :json, :module => "api/json" do
      get    '/column_types'                                    => 'meta#column_types'
      #we should depricate the following five
      get    '/tables/:table_id.:format'                        => 'export_tables#show'
      get    '/tables/:table_id/export/csv'                     => 'export_tables#show', :format  => :csv
      get    '/tables/:table_id/export/shp'                     => 'export_tables#show', :format  => :shp
      get    '/tables/:table_id/export/kml'                     => 'export_tables#show', :format  => :kml
      get    '/tables/:table_id/export/sql'                     => 'export_tables#show', :format  => :sql
      get    '/queries'                                         => 'queries#run'
      put    '/queries'                                         => 'queries#run'


      # get    '/tables'                                          => 'tables#index'
      # post   '/tables'                                          => 'tables#create'
      # get    '/tables/:id'                                      => 'tables#show'
      # put    '/tables/:id'                                      => 'tables#update'
      # delete '/tables/:id'                                      => 'tables#destroy'
      resources :tables, :only => [:index, :create, :show, :update, :destroy] do
        collection do
          # get    '/tables/tags/:tag_name'                           => 'tables#index'
          get '/tags/:tag_name' => 'tables#index', :as => 'show_tag'
          # get    '/tables/tags'                                     => 'tags#index'
          get '/tags' => 'tags#index', :as => 'list_tags'
        end
        # get    '/tables/:table_id/records'                        => 'records#index'
        # post   '/tables/:table_id/records'                        => 'records#create'
        # get    '/tables/:table_id/records/:id'                    => 'records#show'
        # put    '/tables/:table_id/records/:id'                    => 'records#update'
        # delete '/tables/:table_id/records/:id'                    => 'records#destroy'
        resources :records, :only => [:index, :create, :show, :update, :destroy] do
          # get    '/tables/:table_id/records/pending_addresses'      => 'records#pending_addresses'
          get '/pending_addresses' => 'records#pending_addresses'
          resources :columns do
            # get    '/tables/:table_id/records/:record_id/columns/:id' => 'records#show_column'
            get '/:id' => 'records#show_column'
            # put    '/tables/:table_id/records/:record_id/columns/:id' => 'records#update_column'
            put '/:id' => 'records#update_column'
          end
        end
        # get    '/tables/:table_id/columns'                        => 'columns#index'
        # post   '/tables/:table_id/columns'                        => 'columns#create'
        # get    '/tables/:table_id/columns/:id'                    => 'columns#show'
        # put    '/tables/:table_id/columns/:id'                    => 'columns#update'
        # delete '/tables/:table_id/columns/:id'                    => 'columns#delete'
        resources :columns, :only => [:index, :create, :show, :update, :destroy]
      end

      # imports
      resources :uploads, :only                                 => :create
      resources :imports, :only                                 => [:create, :show, :index]

      # Dashboard
      resources :users, :only                                   => [:show] do
        resources :layers, :only                                => [:create, :index, :update, :destroy]
        resources :assets, :only                                => [:create, :index, :destroy]
      end

      # Maps
      resources :maps, :only                                    => [:show, :create, :update, :destroy] do
        resources :layers, :only                                => [:show, :index, :create, :update, :destroy]
      end

      resources :visualizations do
        resources :overlays
        get "/table"  => 'visualizations#table'
        get "/map"    => 'visualizations#map'
      end

      get "/viz/:id/viz"                                        => 'visualizations#vizzjson', as: :vizjson

      # Tags
      resources :tags, :only                                    => [:index]
    end
  end
end

