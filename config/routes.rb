ProtoCartodb::Application.routes.draw do

  root :to => "home#index"

  match '/login' => 'sessions#new', :as => :login
  match '/sessions/create' => 'sessions#create', :as => :create_session

  match '/dashboard' => 'admin/dashboard#index', :as => :dashboard

end
