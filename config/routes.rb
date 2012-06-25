CartoDB::Application.routes.draw do
  root :to => redirect("/login")

  get   '/login' => 'sessions#new', :as => :login
  get   '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session

  match '/limits' => 'home#limits', :as => :limits
  match '/status' => 'home#app_status'

  post '/upload' => 'upload#create', :format => :json

  scope :module => "admin" do
    match '/dashboard'        => 'tables#index', :as => :dashboard
    # TO IMPLEMENT
    #match '/dashboard/public' => 'tables#index_public', :as => :dashboard_public
    
    resources :tables, :only => [:show] do
      get 'embed_map', :on => :member
      get 'public' => 'tables#show_public', :on => :member
    end      
    match '/your_apps/oauth'   => 'client_applications#oauth',   :as => :oauth_credentials
    match '/your_apps/api_key' => 'client_applications#api_key', :as => :api_key_credentials
    post  '/your_apps/api_key/regenerate' => 'client_applications#regenerate_api_key', :as => :regenerate_api_key
  end

  namespace :superadmin do
    get '/' => 'users#index', :as => :users
    post '/' => 'users#create', :as => :users
    resources :users, :only => [:create, :update, :destroy]
  end
  
  scope :oauth, :path => :oauth do
    match '/authorize'      => 'oauth#authorize',     :as => :authorize
    match '/request_token'  => 'oauth#request_token', :as => :request_token
    match '/access_token'   => 'oauth#access_token',  :as => :access_token
    get   '/identity'       => 'sessions#show'
  end

  scope "/api" do    
    namespace CartoDB::API::VERSION_1, :format => :json, :module => "api/json" do
      get    '/column_types'                         => 'meta#column_types'
      get    '/tables'                               => 'tables#index'
      post   '/tables'                               => 'import#create'
      get    '/tables/tags/:tag_name'                => 'tables#index'
      get    '/tables/tags'                          => 'tags#index'
      get    '/tables/:id'                           => 'tables#show'
      put    '/tables/:id'                           => 'tables#update'
      delete '/tables/:id'                           => 'tables#destroy'
      post   '/tables/:id/infowindow'                => 'tables#set_infowindow', :as => "api_tables_info_window"
      post   '/tables/:id/map_metadata'              => 'tables#set_map_metadata', :as => "api_tables_map_metadata"
      get    '/tables/:id/map_metadata'              => 'tables#get_map_metadata'
      get    '/tables/:table_id.:format'             => 'export_tables#show'
      #we should depricate the following four
      get    '/tables/:table_id/export/csv'          => 'export_tables#show', :format => :csv
      get    '/tables/:table_id/export/shp'          => 'export_tables#show', :format => :shp
      get    '/tables/:table_id/export/kml'          => 'export_tables#show', :format => :kml
      get    '/tables/:table_id/export/sql'          => 'export_tables#show', :format => :sql
      
      get    '/tables/:table_id/records'             => 'records#index'
      post   '/tables/:table_id/records'             => 'records#create'
      get    '/tables/:table_id/records/pending_addresses' => 'records#pending_addresses'
      get    '/tables/:table_id/records/:id'         => 'records#show'
      put    '/tables/:table_id/records/:id'         => 'records#update'
      delete '/tables/:table_id/records/:id'         => 'records#destroy'
      get    '/tables/:table_id/columns'             => 'columns#index'
      post   '/tables/:table_id/columns'             => 'columns#create'
      get    '/tables/:table_id/columns/:id'         => 'columns#show'
      put    '/tables/:table_id/columns/:id'         => 'columns#update'
      delete '/tables/:table_id/columns/:id'         => 'columns#delete'
      get    '/tables/:table_id/records/:record_id/columns/:id' => 'records#show_column'
      put    '/tables/:table_id/records/:record_id/columns/:id' => 'records#update_column'
      get    '/queries'                              => 'queries#run'
    end
  end
end