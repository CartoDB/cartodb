CartoDB::Application.routes.draw do

  root :to => "home#index"

  get '/login' => 'sessions#new', :as => :login
  get '/logout' => 'sessions#destroy', :as => :logout
  match '/sessions/create' => 'sessions#create', :as => :create_session

  match '/dashboard' => 'admin/dashboard#index', :as => :dashboard

end
