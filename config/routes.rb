CartoDB::Application.routes.draw do

  root :to => "home#index"

  get '/login' => 'sessions#new', :as => :login
  get '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session


  scope :module => "admin" do
    match '/dashboard' => 'tables#index', :as => :dashboard
    resources :tables, :only => [:show]
  end

end
