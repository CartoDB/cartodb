CartoDB::Application.routes.draw do
  root :to => "home#index"

  get '/progress' => 'upload#progress', :format => :json

  get '/login' => 'sessions#new', :as => :login
  get '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session

  resources :users, :only => [:create]
  match '/thanks' => 'users#thanks', :as => :thanks
  match '/limits' => 'home#limits', :as => :limits

  scope :module => "admin" do
    match '/dashboard'        => 'tables#index', :as => :dashboard
    match '/dashboard/public' => 'tables#index', :as => :dashboard_public, :defaults => {:public => true}
    resources :tables, :only => [:show]
    match '/your_apps/oauth' => 'client_applications#oauth', :as => :oauth_credentials
    match '/your_apps/jsonp' => 'client_applications#jsonp', :as => :jsonp_credentials
    post  '/your_apps/jsonp/:id/destroy' => 'client_applications#remove_api_key', :as => :destroy_api_key
  end

  namespace :superadmin do
    match '/' => 'users#index'
    resources :users, :except => [:index]
  end

  constraints :subdomain => "api" do
    namespace CartoDB::API::VERSION_1, :format => :json, :module => "api/json" do
      get '/' => 'queries#run'
    end
  end


  # Oauth
  # match '/oauth/authorize'      => 'oauth#authorize',     :as => :authorize
  # match '/oauth/request_token'  => 'oauth#request_token', :as => :request_token
  # match '/oauth/access_token'   => 'oauth#access_token',  :as => :access_token
  # match '/oauth/token'          => 'oauth#token',         :as => :token
  # match '/oauth/test_request'   => 'oauth#test_request',  :as => :test_request
  # get   '/oauth/identity'       => 'sessions#show'
  #
  # namespace :api do
  #   namespace :json, :format => :json do
  #     get    'column_types'                       => 'meta#column_types'
  #     get    'tables'                             => 'tables#index'
  #     post   'tables'                             => 'tables#create'
  #     get    'tables/query'                       => 'tables#query'
  #     get    'tables/:id'                         => 'tables#show'
  #     delete 'tables/:id'                         => 'tables#delete'
  #     post   'tables/:id/rows'                    => 'tables#create_row'
  #     put    'tables/:id/rows/:row_id'            => 'tables#update_row'
  #     delete 'tables/:id/rows/:row_id'            => 'tables#delete_row'
  #     get    'tables/:id/schema'                  => 'tables#schema'
  #     put    'tables/:id/toggle_privacy'          => 'tables#toggle_privacy'
  #     put    'tables/:id/update'                  => 'tables#update'
  #     put    'tables/:id/update_schema'           => 'tables#update_schema'
  #     put    'tables/:id/set_geometry_columns'    => 'tables#set_geometry_columns'
  #     get    'tables/:id/get_address_column'      => 'tables#get_address_column'
  #     get    'tables/:id/addresses'               => 'tables#addresses'
  #     put    'tables/:id/update_geometry/:row_id' => 'tables#update_geometry'
  #   end
  # end
end
