CartoDB::Application.routes.draw do

  root :to => "home#index"

  get '/progress' => 'upload#progress', :format => :json

  get '/login' => 'sessions#new', :as => :login
  get '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session

  scope :module => "admin" do
    match '/dashboard'        => 'tables#index', :as => :dashboard
    match '/dashboard/public' => 'tables#index', :as => :dashboard_public, :defaults => {:public => true}
    resources :tables, :only => [:show]
  end

  namespace :api do
    namespace :json, :format => :json do
      get    'tables'                     => 'tables#index'
      post   'tables'                     => 'tables#create'
      get    'tables/query'               => 'tables#query'
      get    'tables/:id'                 => 'tables#show'
      delete 'tables/:id'                 => 'tables#delete'
      post   'tables/:id/rows'            => 'tables#create_row'
      put    'tables/:id/rows/:row_id'    => 'tables#update_row'
      get    'tables/:id/schema'          => 'tables#schema'
      put    'tables/:id/toggle_privacy'  => 'tables#toggle_privacy'
      put    'tables/:id/update'          => 'tables#update'
      put    'tables/:id/update_schema'   => 'tables#update_schema'
    end
  end

end
