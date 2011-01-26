CartoDB::Application.routes.draw do

  root :to => "home#index"

  get '/login' => 'sessions#new', :as => :login
  get '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session

  scope :module => "admin" do
    match '/dashboard'        => 'tables#index', :as => :dashboard
    match '/dashboard/public' => 'tables#index', :as => :dashboard_public, :defaults => {:public => true}
    resources :tables, :only => [:show]
  end

  namespace :api do
    namespace :json do
      get 'tables'                     => 'tables#index', :format => :json
      get 'tables/:id'                 => 'tables#show', :format => :json
      get 'tables/:id/schema'          => 'tables#schema', :format => :json
      put 'tables/:id/toggle_privacy'  => 'tables#toggle_privacy', :format => :json
      put 'tables/:id/update'          => 'tables#update', :format => :json
    end
  end

end
