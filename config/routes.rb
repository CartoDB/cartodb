# All the requests from a host with the header
# cartodbclient are allowed in other subdomain
# that api
class APISubdomainConstraint
  def matches?(req)
    if req.headers["cartodbclient"].blank?
      req.host =~ /^api\./
    else
      return true
    end
  end
end

CartoDB::Application.routes.draw do
  root :to => "home#index"

  get '/progress' => 'upload#progress', :format => :json
  post '/upload' => 'upload#create', :format => :json

  get   '/login' => 'sessions#new', :as => :login
  get   '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session

  resources :invitations, :only => [:create, :edit, :update]
  match '/thanks' => 'invitations#thanks', :as => :thanks
  match '/limits' => 'home#limits', :as => :limits
  match '/status' => 'home#app_status'

  scope :module => "admin" do
    match '/dashboard'        => 'tables#index', :as => :dashboard
    match '/dashboard/public' => 'tables#index', :as => :dashboard_public, :defaults => {:public => true}
    resources :tables, :only => [:show]
    match '/your_apps/oauth' => 'client_applications#oauth', :as => :oauth_credentials
    match '/your_apps/jsonp' => 'client_applications#jsonp', :as => :jsonp_credentials
    post  '/your_apps/jsonp/:id/destroy' => 'client_applications#remove_api_key', :as => :destroy_api_key
    resources :users, :only => [:edit, :update, :destroy]
    post '/unlock' => 'users#unlock', :as => :unlock
    get '/byebye' => 'users#byebye', :as => :farewel
  end


  namespace :superadmin do
    get '/' => 'users#index', :as => :users
    post '/' => 'users#create', :as => :users
    resources :users, :except => [:index]
  end

  constraints APISubdomainConstraint.new do
    scope :oauth, :path => :oauth do
      match '/authorize'      => 'oauth#authorize',     :as => :authorize
      match '/request_token'  => 'oauth#request_token', :as => :request_token
      match '/access_token'   => 'oauth#access_token',  :as => :access_token
      match '/token'          => 'oauth#token',         :as => :token
      match '/test_request'   => 'oauth#test_request',  :as => :test_request
      get   '/identity'       => 'sessions#show'
    end

    namespace CartoDB::API::VERSION_1, :format => :json, :module => "api/json" do
      match  '/'             => 'queries#run'
      get    '/column_types' => 'meta#column_types'
      get    '/tables'       => 'tables#index'
      post   '/tables'       => 'tables#create'
      get    '/tables/tags/:tag_name' => 'tables#index'
      get    '/tables/tags'  => 'tags#index'
      get    '/tables/:id'   => 'tables#show'
      put    '/tables/:id'   => 'tables#update'
      delete '/tables/:id'   => 'tables#destroy'
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
    end
  end

  # Subdomain "developers." is served by rack application ApiDocumentationServer
end