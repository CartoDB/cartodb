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
    get '/dashboard/'                         => 'visualizations#index', :as => :dashboard

    # Tables
    get '/dashboard/tables'                         => 'visualizations#index'
    get '/dashboard/tables/:page'                   => 'visualizations#index'
    get '/dashboard/tables/tag/:tag'                => 'visualizations#index'
    get '/dashboard/tables/tag/:tag/:page'          => 'visualizations#index'

    # Visualizations
    get '/dashboard/visualizations'                 => 'visualizations#index'
    get '/dashboard/visualizations/:page'           => 'visualizations#index'
    get '/dashboard/visualizations/tag/:tag'        => 'visualizations#index'
    get '/dashboard/visualizations/tag/:tag/:page'  => 'visualizations#index'

    # Search
    get '/dashboard/search/:q'                      => 'visualizations#index'
    get '/dashboard/search/:q/:page'                => 'visualizations#index'

    get '/dashboard/visualizations/search/:q'                      => 'visualizations#index'
    get '/dashboard/visualizations/search/:q/:page'                => 'visualizations#index'

    get '/dashboard/tables/search/:q'                      => 'visualizations#index'
    get '/dashboard/tables/search/:q/:page'                => 'visualizations#index'

    # Tags
    get '/dashboard/tag/:tag'                       => 'visualizations#index'

    get '/dashboard/common_data'    => 'pages#common_data'

    get '/tables/track_embed'       => 'visualizations#track_embed'
    get '/tables/embed_forbidden'   => 'visualizations#embed_forbidden'
    get '/tables/:id'               => 'visualizations#show'
    get '/tables/:id/map'           => 'visualizations#show'
    get '/tables/:id/table'         => 'visualizations#show'
    get '/tables/:id/public'        => 'visualizations#public'
    get '/tables/:id/public/table'  => 'visualizations#public'
    get '/tables/:id/public/map'    => 'visualizations#public'
    get '/tables/:id/embed_map'     => 'visualizations#embed_map'

    get '/viz'                      => 'visualizations#index'
    get '/viz/track_embed'          => 'visualizations#track_embed'
    get '/viz/embed_forbidden'      => 'visualizations#embed_forbidden'
    get '/viz/:id'                  => 'visualizations#show'
    get '/viz/:id/map'              => 'visualizations#show'
    get '/viz/:id/table'            => 'visualizations#show'
    get '/viz/:id/public'           => 'visualizations#public'
    get '/viz/:id/embed_map'        => 'visualizations#embed_map'

    match '/your_apps/oauth'   => 'client_applications#oauth',   :as => :oauth_credentials
    match '/your_apps/api_key' => 'client_applications#api_key', :as => :api_key_credentials
    post  '/your_apps/api_key/regenerate' => 'client_applications#regenerate_api_key', :as => :regenerate_api_key

  end

  namespace :superadmin do
    get '/' => 'users#index', :as => :users
    post '/' => 'users#create', :as => :users
    resources :users
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
      get    '/queries'                                         => 'queries#run'
      put    '/queries'                                         => 'queries#run'


      resources :tables, :only => [:index, :create, :show, :update, :destroy] do
        collection do
          get '/tags/:tag_name' => 'tables#index', :as => 'show_tag'
        end

        resources :records, :only => [:index, :create, :show, :update, :destroy]
        resources :columns, :only => [:index, :create, :show, :update, :destroy]
      end

      # imports
      resources :uploads, :only                     => :create
      resources :imports, :only                     => [:create, :show, :index]

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
      resources :geocodings, :only                  => [:create, :show, :index]      

      get     'viz/tags' => 'tags#index', :as => 'list_tags'
      get     'viz'                                 => 'visualizations#index'
      post    'viz'                                 => 'visualizations#create'
      get     'viz/:id/stats'                       => 'visualizations#stats'
      get     'viz/:id'                             => 'visualizations#show'
      put     'viz/:id'                             => 'visualizations#update'
      delete  'viz/:id'                             => 'visualizations#destroy'
      get     'viz/:id/viz'                         => 'visualizations#vizjson1', as: :vizjson
      get     'viz/:visualization_id/overlays'      => 'overlays#index'
      post    'viz/:visualization_id/overlays'      => 'overlays#create'
      get     'viz/:visualization_id/overlays/:id'  => 'overlays#show'
      put     'viz/:visualization_id/overlays/:id'  => 'overlays#update'
      delete  'viz/:visualization_id/overlays/:id'  => 'overlays#destroy'

      # Tags
      resources :tags, :only                                    => [:index]
    end

    get '/v2/viz/:id/viz'    => 'api/json/visualizations#vizjson2', as: :vizjson
  end
end

