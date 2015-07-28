# encoding: utf-8

# NOTES:
# (/u/:user_domain)     -> This allows support of org-urls (support != enforcement)
# (/user/:user_domain)  -> This allows support for domainless urls (in fact directly ignores subdomains)
# defaults: { dont_rewrite: true } -> Use this to force an individual action to not get rewritten to org-url
# Can be also done at controller source files by using -> skip_before_filter :ensure_org_url_if_org_user

CartoDB::Application.routes.draw do
  # Double use: for user public dashboard AND org dashboard
  get   '/(user/:user_domain)(u/:user_domain)'                 => 'admin/pages#public', as: :root
  root :to => 'admin/pages#index'

  get   '(/user/:user_domain)(/u/:user_domain)/signup'           => 'signup#signup',     as: :signup
  post   '(/user/:user_domain)(/u/:user_domain)/signup'           => 'signup#create',  as: :signup_organization_user

  get   '(/user/:user_domain)(/u/:user_domain)/enable_account_token/:id' => 'account_tokens#enable',     as: :enable_account_token_show
  get   '(/user/:user_domain)(/u/:user_domain)/resend_validation_mail/:user_id' => 'account_tokens#resend',     as: :resend_validation_mail
  get   '(/user/:user_domain)(/u/:user_domain)/account_token_authentication_error' => 'sessions#account_token_authentication_error',     as: :account_token_authentication_error

  get   '(/user/:user_domain)(/u/:user_domain)/login'           => 'sessions#new',     as: :login
  get   '(/user/:user_domain)(/u/:user_domain)/logout'          => 'sessions#destroy', as: :logout
  match '(/user/:user_domain)(/u/:user_domain)/sessions/create' => 'sessions#create',  as: :create_session

  match '(/user/:user_domain)(/u/:user_domain)/status'          => 'home#app_status'

  # OAuth
  match '(/user/:user_domain)(/u/:user_domain)/oauth/authorize'      => 'oauth#authorize',     as: :authorize
  match '(/user/:user_domain)(/u/:user_domain)/oauth/request_token'  => 'oauth#request_token', as: :request_token
  match '(/user/:user_domain)(/u/:user_domain)/oauth/access_token'   => 'oauth#access_token',  as: :access_token
  get   '(/user/:user_domain)(/u/:user_domain)/oauth/identity'       => 'sessions#show',       as: :oauth_show_sessions

  get '/google_plus' => 'google_plus#google_plus', as: :google_plus
  post '/google/signup' => 'google_plus#google_signup', as: :google_plus_signup

  # Internally, some of this methods will forcibly rewrite to the org-url if user belongs to an organization
  scope :module => :admin do

    # Organization dashboard page
    get    '(/user/:user_domain)(/u/:user_domain)/organization'                 => 'organizations#show',            as: :organization
    get    '(/user/:user_domain)(/u/:user_domain)/organization/settings'        => 'organizations#settings',        as: :organization_settings
    put    '(/user/:user_domain)(/u/:user_domain)/organization/settings'        => 'organizations#settings_update', as: :organization_settings_update
    post '(/user/:user_domain)(/u/:user_domain)/organization/regenerate_api_keys'       => 'organizations#regenerate_all_api_keys', as: :regenerate_organization_users_api_key
    # Organization users management
    get    '(/user/:user_domain)(/u/:user_domain)/organization/users/:id/edit'  => 'organization_users#edit',    as: :edit_organization_user,   constraints: { id: /[0-z\.\-]+/ }
    put    '(/user/:user_domain)(/u/:user_domain)/organization/users/:id'       => 'organization_users#update',  as: :update_organization_user, constraints: { id: /[0-z\.\-]+/ }
    post   '(/user/:user_domain)(/u/:user_domain)/organization/users'           => 'organization_users#create',  as: :create_organization_user
    delete '(/user/:user_domain)(/u/:user_domain)/organization/users/:id'       => 'organization_users#destroy', as: :delete_organization_user, constraints: { id: /[0-z\.\-]+/ }
    post '(/user/:user_domain)(/u/:user_domain)/organization/users/:id/regenerate_api_key'       => 'organization_users#regenerate_api_key', as: :regenerate_organization_user_api_key, constraints: { id: /[^\/]+/ }
    get    '(/user/:user_domain)(/u/:user_domain)/organization/users/new'       => 'organization_users#new',     as: :new_organization_user

    # User profile and account pages
    get    '(/user/:user_domain)(/u/:user_domain)/profile' => 'users#profile',        as: :profile_user
    put    '(/user/:user_domain)(/u/:user_domain)/profile' => 'users#profile_update', as: :profile_update_user
    get    '(/user/:user_domain)(/u/:user_domain)/account' => 'users#account',        as: :account_user
    delete '(/user/:user_domain)(/u/:user_domain)/account' => 'users#delete',        as: :account_user
    put    '(/user/:user_domain)(/u/:user_domain)/account' => 'users#account_update', as: :account_update_user
    delete '(/user/:user_domain)(/u/:user_domain)/account/:id' => 'users#delete', as: :delete_user

    # search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/search/:q'               => 'visualizations#index', as: :search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/search/:q/:page'         => 'visualizations#index', as: :search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/shared/search/:q'        => 'visualizations#index', as: :search_shared
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/shared/search/:q/:page'  => 'visualizations#index', as: :search_shared_page

    # Tables
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables'                            => 'visualizations#index', as: :tables_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/:page'                      => 'visualizations#index', as: :tables_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/tag/:tag'                   => 'visualizations#index', as: :tables_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/tag/:tag/:page'             => 'visualizations#index', as: :tables_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/shared'                     => 'visualizations#index', as: :tables_shared
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/shared/:page'               => 'visualizations#index', as: :tables_shared_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/shared/tag/:tag'            => 'visualizations#index', as: :tables_shared_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/shared/tag/:tag/:page'      => 'visualizations#index', as: :tables_shared_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine'                       => 'visualizations#index', as: :tables_mine
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/:page'                 => 'visualizations#index', as: :tables_mine_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/tag/:tag'              => 'visualizations#index', as: :tables_mine_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/tag/:tag/:page'        => 'visualizations#index', as: :tables_mine_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/locked'                => 'visualizations#index', as: :tables_mine_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/locked/:page'          => 'visualizations#index', as: :tables_mine_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/locked/tag/:tag'       => 'visualizations#index', as: :tables_mine_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/locked/tag/:tag/:page' => 'visualizations#index', as: :tables_mine_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/locked'                     => 'visualizations#index', as: :tables_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/locked/:page'               => 'visualizations#index', as: :tables_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/locked/tag/:tag'            => 'visualizations#index', as: :tables_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/locked/tag/:tag/:page'      => 'visualizations#index', as: :tables_locked_tag_page

    # Datasets for new dashboard
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets'                              => 'visualizations#index', as: :datasets_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/:page'                        => 'visualizations#index', as: :datasets_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/tag/:tag'                     => 'visualizations#index', as: :datasets_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/tag/:tag/:page'               => 'visualizations#index', as: :datasets_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared'                       => 'visualizations#index', as: :datasets_shared
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/:page'                 => 'visualizations#index', as: :datasets_shared_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/tag/:tag'              => 'visualizations#index', as: :datasets_shared_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/tag/:tag/:page'        => 'visualizations#index', as: :datasets_shared_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/locked'                => 'visualizations#index', as: :datasets_shared_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/locked/:page'          => 'visualizations#index', as: :datasets_shared_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/locked/tag/:tag'       => 'visualizations#index', as: :datasets_shared_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/locked/tag/:tag/:page' => 'visualizations#index', as: :datasets_shared_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked'                        => 'visualizations#index', as: :datasets_liked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/:page'                  => 'visualizations#index', as: :datasets_liked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/tag/:tag'               => 'visualizations#index', as: :datasets_liked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/tag/:tag/:page'         => 'visualizations#index', as: :datasets_liked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/locked'                 => 'visualizations#index', as: :datasets_liked_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/locked/:page'           => 'visualizations#index', as: :datasets_liked_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/locked/tag/:tag'        => 'visualizations#index', as: :datasets_liked_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/locked/tag/:tag/:page'  => 'visualizations#index', as: :datasets_liked_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked'                       => 'visualizations#index', as: :datasets_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/:page'                 => 'visualizations#index', as: :datasets_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/tag/:tag'              => 'visualizations#index', as: :datasets_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/tag/:tag/:page'        => 'visualizations#index', as: :datasets_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library'                      => 'visualizations#index', as: :datasets_library
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/:page'                => 'visualizations#index', as: :datasets_library_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/tag/:tag'             => 'visualizations#index', as: :datasets_library_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/tag/:tag/:page'       => 'visualizations#index', as: :datasets_library_tag_page

    # Tables search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/search/:q'                    => 'visualizations#index', as: :tables_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/search/:q/:page'              => 'visualizations#index', as: :tables_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/shared/search/:q'             => 'visualizations#index', as: :tables_shared_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/shared/search/:q/:page'       => 'visualizations#index', as: :tables_shared_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/locked/search/:q'             => 'visualizations#index', as: :tables_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/locked/search/:q/:page'       => 'visualizations#index', as: :tables_locked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/search/:q'               => 'visualizations#index', as: :tables_mine_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/search/:q/:page'         => 'visualizations#index', as: :tables_mine_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/locked/search/:q'        => 'visualizations#index', as: :tables_mine_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tables/mine/locked/search/:q/:page'  => 'visualizations#index', as: :tables_mine_locked_search_page

    # Datasets search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/search/:q'                      => 'visualizations#index', as: :datasets_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/search/:q/:page'                => 'visualizations#index', as: :datasets_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/search/:q'               => 'visualizations#index', as: :datasets_shared_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/search/:q/:page'         => 'visualizations#index', as: :datasets_shared_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/search/:q'               => 'visualizations#index', as: :datasets_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/search/:q/:page'         => 'visualizations#index', as: :datasets_locked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/locked/search/:q'        => 'visualizations#index', as: :datasets_shared_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/shared/locked/search/:q/:page'  => 'visualizations#index', as: :datasets_shared_locked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/search/:q'                => 'visualizations#index', as: :datasets_liked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/search/:q/:page'          => 'visualizations#index', as: :datasets_liked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/locked/search/:q'         => 'visualizations#index', as: :datasets_liked_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/liked/locked/search/:q/:page'   => 'visualizations#index', as: :datasets_liked_locked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/search/:q'              => 'visualizations#index', as: :datasets_library_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/search/:q/:page'        => 'visualizations#index', as: :datasets_library_search_page

    # Visualizations
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations'                            => 'visualizations#index', as: :visualizations_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/:page'                      => 'visualizations#index', as: :visualizations_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/tag/:tag'                   => 'visualizations#index', as: :visualizations_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/tag/:tag/:page'             => 'visualizations#index', as: :visualizations_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/shared'                     => 'visualizations#index', as: :visualizations_shared
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/shared/:page'               => 'visualizations#index', as: :visualizations_shared_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/shared/tag/:tag'            => 'visualizations#index', as: :visualizations_shared_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/shared/tag/:tag/:page'      => 'visualizations#index', as: :visualizations_shared_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine'                       => 'visualizations#index', as: :visualizations_mine
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/:page'                 => 'visualizations#index', as: :visualizations_mine_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/tag/:tag'              => 'visualizations#index', as: :visualizations_mine_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/tag/:tag/:page'        => 'visualizations#index', as: :visualizations_mine_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/locked'                => 'visualizations#index', as: :visualizations_mine_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/locked/:page'          => 'visualizations#index', as: :visualizations_mine_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/locked/tag/:tag'       => 'visualizations#index', as: :visualizations_mine_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/locked/tag/:tag/:page' => 'visualizations#index', as: :visualizations_mine_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/locked'                     => 'visualizations#index', as: :visualizations_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/locked/:page'               => 'visualizations#index', as: :visualizations_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/locked/tag/:tag'            => 'visualizations#index', as: :visualizations_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/locked/tag/:tag/:page'      => 'visualizations#index', as: :visualizations_locked_tag_page

    # Maps
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps'                              => 'visualizations#index', as: :maps_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/:page'                        => 'visualizations#index', as: :maps_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/tag/:tag'                     => 'visualizations#index', as: :maps_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/tag/:tag/:page'               => 'visualizations#index', as: :maps_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared'                       => 'visualizations#index', as: :maps_shared
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/:page'                 => 'visualizations#index', as: :maps_shared_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/tag/:tag'              => 'visualizations#index', as: :maps_shared_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/tag/:tag/:page'        => 'visualizations#index', as: :maps_shared_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/locked'                => 'visualizations#index', as: :maps_shared_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/locked/:page'          => 'visualizations#index', as: :maps_shared_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/locked/tag/:tag'       => 'visualizations#index', as: :maps_shared_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/locked/tag/:tag/:page' => 'visualizations#index', as: :maps_shared_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked'                        => 'visualizations#index', as: :maps_liked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/:page'                  => 'visualizations#index', as: :maps_liked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/tag/:tag'               => 'visualizations#index', as: :maps_liked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/tag/:tag/:page'         => 'visualizations#index', as: :maps_liked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/locked'                 => 'visualizations#index', as: :maps_liked_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/locked/:page'           => 'visualizations#index', as: :maps_liked_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/locked/tag/:tag'        => 'visualizations#index', as: :maps_liked_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/locked/tag/:tag/:page'  => 'visualizations#index', as: :maps_liked_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked'                       => 'visualizations#index', as: :maps_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/:page'                 => 'visualizations#index', as: :maps_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/tag/:tag'              => 'visualizations#index', as: :maps_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/tag/:tag/:page'        => 'visualizations#index', as: :maps_locked_tag_page

    # Visualizations search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/search/:q'                    => 'visualizations#index', as: :visualizations_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/search/:q/:page'              => 'visualizations#index', as: :visualizations_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/shared/search/:q'             => 'visualizations#index', as: :visualizations_shared_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/shared/search/:q/:page'       => 'visualizations#index', as: :visualizations_shared_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/locked/search/:q'             => 'visualizations#index', as: :visualizations_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/locked/search/:q/:page'       => 'visualizations#index', as: :visualizations_locked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/search/:q'               => 'visualizations#index', as: :visualizations_mine_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/search/:q/:page'         => 'visualizations#index', as: :visualizations_mine_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/locked/search/:q'        => 'visualizations#index', as: :visualizations_mine_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/visualizations/mine/locked/search/:q/:page'  => 'visualizations#index', as: :visualizations_mine_locked_search_page

    # Maps search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/search/:q'                      => 'visualizations#index', as: :maps_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/search/:q/:page'                => 'visualizations#index', as: :maps_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/search/:q'               => 'visualizations#index', as: :maps_shared_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/search/:q/:page'         => 'visualizations#index', as: :maps_shared_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/search/:q'               => 'visualizations#index', as: :maps_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/search/:q/:page'         => 'visualizations#index', as: :maps_locked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/locked/search/:q'        => 'visualizations#index', as: :maps_shared_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/shared/locked/search/:q/:page'  => 'visualizations#index', as: :maps_shared_locked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/search/:q'                => 'visualizations#index', as: :maps_liked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/search/:q/:page'          => 'visualizations#index', as: :maps_liked_search_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/locked/search/:q'         => 'visualizations#index', as: :maps_liked_locked_search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/liked/locked/search/:q/:page'   => 'visualizations#index', as: :maps_liked_locked_search_page

    # Tags
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tag/:tag'  => 'visualizations#index', as: :tags

    # Private dashboard
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/'                  => 'visualizations#index', as: :dashboard
    get '(/user/:user_domain)(/u/:user_domain)/dashboard'                   => 'visualizations#index', as: :dashboard_bis
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/common_data'       => 'pages#common_data',    as: :dashboard_common_data
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/common_data/:tag'  => 'pages#common_data',    as: :dashboard_common_data_tag

    # Public dashboard
    # root also goes to 'pages#public', as: public_visualizations_home
    get '(/user/:user_domain)(/u/:user_domain)/maps'                     => 'pages#public', as: :public_maps_home
    get '(/user/:user_domain)(/u/:user_domain)/page/:page'               => 'pages#public', as: :public_page
    get '(/user/:user_domain)(/u/:user_domain)/tag/:tag'                 => 'pages#public', as: :public_tag
    get '(/user/:user_domain)(/u/:user_domain)/tag/:tag/:page'           => 'pages#public', as: :public_tag_page
    # Public dataset
    get '(/user/:user_domain)(/u/:user_domain)/datasets'                 => 'pages#datasets', as: :public_datasets_home
    get '(/user/:user_domain)(/u/:user_domain)/datasets/page/:page'      => 'pages#datasets', as: :public_datasets_page
    get '(/user/:user_domain)(/u/:user_domain)/datasets/tag/:tag'        => 'pages#datasets', as: :public_datasets_tag
    get '(/user/:user_domain)(/u/:user_domain)/datasets/tag/:tag/:page'  => 'pages#datasets', as: :public_datasets_tag_page
    get '/sitemap.xml'                                                   => 'pages#sitemap',  as: :public_sitemap
    # Public tables
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id/'              => 'visualizations#show',            as: :public_tables_show,      constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id'               => 'visualizations#show',            as: :public_tables_show_bis,  constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id/map'           => 'visualizations#show',            as: :public_tables_show_map,  constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id/table'         => 'visualizations#show',            as: :public_tables_table,     constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id/public'        => 'visualizations#public_table',    as: :public_table,            constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id/public/table'  => 'visualizations#public_table',    as: :public_table_table,      constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id/public/map'    => 'visualizations#public_table',    as: :public_table_map,        constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/tables/:id/embed_map'     => 'visualizations#embed_map',       as: :public_tables_embed_map, constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    # Public visualizations
    get '(/user/:user_domain)(/u/:user_domain)/'                         => 'pages#public',                   as: :public_visualizations_home, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/viz'                      => 'visualizations#index',           as: :public_visualizations, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/viz/track_embed'          => 'visualizations#track_embed',     as: :public_visualizations_track_embed, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/viz/embed_forbidden'      => 'visualizations#embed_forbidden', as: :public_visualizations_embed_forbidden, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id'                  => 'visualizations#show',            as: :public_visualizations_show,       constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id/map'              => 'visualizations#show',            as: :public_visualizations_show_map,   constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id/table'            => 'visualizations#show',            as: :public_visualizations_table,      constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id/public'           => 'visualizations#public_table',    as: :public_visualization,             constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id/embed_map'        => 'visualizations#embed_map',       as: :public_visualizations_embed_map,  constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id/public_map'       => 'visualizations#public_map',      as: :public_visualizations_public_map, constraints: { id: /[^\/]+/ }
    # Public protected embed maps
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id/protected_embed_map'  => 'visualizations#show_protected_embed_map', constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    post '(/user/:user_domain)(/u/:user_domain)/viz/:id/protected_embed_map' => 'visualizations#show_protected_embed_map', as: :protected_embed_map, constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    # Public protected maps
    get '(/user/:user_domain)(/u/:user_domain)/viz/:id/protected_public_map'  => 'visualizations#show_protected_public_map', constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    post '(/user/:user_domain)(/u/:user_domain)/viz/:id/protected_public_map' => 'visualizations#show_protected_public_map', as: :protected_public_map, constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }

    match  '(/user/:user_domain)(/u/:user_domain)/your_apps'                    => 'client_applications#api_key',            as: :api_key_credentials
    post   '(/user/:user_domain)(/u/:user_domain)/your_apps/api_key/regenerate' => 'client_applications#regenerate_api_key', as: :regenerate_api_key
    match  '(/user/:user_domain)(/u/:user_domain)/your_apps/oauth'              => 'client_applications#oauth',              as: :oauth_credentials
    delete '(/user/:user_domain)(/u/:user_domain)/your_apps/oauth/regenerate'   => 'client_applications#regenerate_oauth',   as: :regenerate_oauth

  end

  scope :module => 'carto/api', :format => :json do

    # V1 api/json calls

    # Visualizations
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                                => 'visualizations#index',           as: :api_v1_visualizations_index
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#show',            as: :api_v1_visualizations_show,            constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/likes'                      => 'visualizations#likes_count',     as: :api_v1_visualizations_likes_count,     constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/likes/detailed'             => 'visualizations#likes_list',      as: :api_v1_visualizations_likes_list,      constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#is_liked',        as: :api_v1_visualizations_is_liked,        constraints: { id: /[^\/]+/ }

    # Tables
    get '(/user/:user_domain)(/u/:user_domain)/api/v1_1/tables/:id'                         => 'tables#show',       as: :api_v1_1_tables_show, constraints: { id: /[^\/]+/ }

    # Table columns
    get '(/user/:user_domain)(/u/:user_domain)/api/v1_1/tables/:table_id/columns'           => 'columns#index',     as: :api_v1_1_tables_columns_index,   constraints: { table_id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v1_1/tables/:table_id/columns/:id'       => 'columns#show',      as: :api_v1_1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }

    # Table records
    get '(/user/:user_domain)(/u/:user_domain)/api/v1_1/tables/:table_id/records/:id'       => 'records#show',      as: :api_v1_1_tables_records_show,   constraints: { table_id: /[^\/]+/ }

    # Imports
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports'                          => 'imports#index',                       as: :api_v1_imports_index
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/:id'                      => 'imports#show',                        as: :api_v1_imports_show

    # Import services
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/token_valid'         => 'imports#service_token_valid?',        as: :api_v1_imports_service_token_valid
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/list_files'          => 'imports#list_files_for_service',      as: :api_v1_imports_service_list_files
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/auth_url'            => 'imports#get_service_auth_url',        as: :api_v1_imports_service_auth_url
    # TODO: deprecate?
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/validate_code/:code' => 'imports#validate_service_oauth_code', as: :api_v1_imports_service_validate_code
    # Must be GET verb despite altering state
    get     '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/oauth_callback/'    => 'imports#service_oauth_callback',      as: :api_v1_imports_service_oauth_callback

    # Custom layers grouped by user
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers'              => 'layers#custom_layers_by_user',   as: :api_v1_users_layers_index
    # No show action

    # Map layers
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers'                => 'layers#layers_by_map',   as: :api_v1_maps_layers_index
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers/:id'            => 'layers#show',    as: :api_v1_maps_layers_show

    # Maps
    get '(/user/:user_domain)(/u/:user_domain)/api/v1_1/maps/:id'                           => 'maps#show',    as: :api_v1_1_maps_show

    # Overlays
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays'     => 'overlays#index',    as: :api_v1_visualizations_overlays_index,  constraints: { visualization_id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays/:id' => 'overlays#show',     as: :api_v1_visualizations_overlays_show,   constraints: { visualization_id: /[^\/]+/ }

    # Synchronizations
    # TODO: deprecated?
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/synchronizations'              => 'synchronizations#index',    as: :api_v1_1_synchronizations_index
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/synchronizations/:id'          => 'synchronizations#show',     as: :api_v1_1_synchronizations_show
    # INFO: sync_now is public API
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/synchronizations/:id/sync_now' => 'synchronizations#syncing?', as: :api_v1_1_synchronizations_syncing

    # Watching
    get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/watching'                   => 'visualizations#list_watching',   as: :api_v1_visualizations_notify_watching, constraints: { id: /[^\/]+/ }

    # Oembed
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/oembed' => 'oembed#show', as: :api_v1_oembed

    # Geocodings
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1_1/geocodings/available_geometries'           => 'geocodings#available_geometries', as: :api_v1_1_geocodings_available_geometries
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1_1/geocodings/estimation_for/:table_name'     => 'geocodings#estimation_for',       as: :api_v1_1_geocodings_estimation, constraints: { table_name: /[^\/]+/ }
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1_1/geocodings'                                => 'geocodings#index',                as: :api_v1_1_geocodings_index
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1_1/geocodings/:id'                            => 'geocodings#show',                 as: :api_v1_1_geocodings_show

    # Users
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:id'               => 'users#show',                    as: :api_v1_users_show
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/get_authenticated_users' => 'users#get_authenticated_users', as: :api_v1_users_get_authenticated_user

    # User assets
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/users/:user_id/assets'     => 'assets#index',   as: :api_v1_1_users_assets_index

    # Organization (new endpoint that deprecates old, unused one, so v1)
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:id/users' => 'organizations#users', as: :api_v1_organization_users, constraints: { id: /[^\/]+/ }

    # User creations
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/user_creations/:id' => 'user_creations#show', as: :api_v1_user_creations_show, constraints: { id: /[^\/]+/ }

    # V2 api/json calls

    # Visualizations

    get '(/user/:user_domain)(/u/:user_domain)/api/v2/viz/:id/viz'                       => 'visualizations#vizjson2',   as: :api_v2_visualizations_vizjson,    constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v2/viz/:id/static/:width/:height.png' => 'visualizations#static_map', as: :api_v2_visualizations_static_map, constraints: { id: /[^\/]+/ }

  end

  scope :module => 'api/json', :format => :json do

    # V1
    # --

    # Tables
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/tables'     => 'tables#create', as: :api_v1_tables_create
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id'  => 'tables#show',   as: :api_v1_tables_show, constraints: { id: /[^\/]+/ }
    put '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id'  => 'tables#update', as: :api_v1_tables_update, constraints: { id: /[^\/]+/ }

    # Table records
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#index',   as: :api_v1_tables_records_index,  constraints: { table_id: /[^\/]+/ }
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#create',  as: :api_v1_tables_records_create, constraints: { table_id: /[^\/]+/ }
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#show',    as: :api_v1_tables_records_show,   constraints: { table_id: /[^\/]+/ }
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#update',  as: :api_v1_tables_record_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#destroy', as: :api_v1_tables_record_destroy, constraints: { table_id: /[^\/]+/ }

    # Table columns
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#index',   as: :api_v1_tables_columns_index,   constraints: { table_id: /[^\/]+/ }
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#create',  as: :api_v1_tables_columns_create,  constraints: { table_id: /[^\/]+/ }
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#show',    as: :api_v1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#update',  as: :api_v1_tables_columns_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#destroy', as: :api_v1_tables_columns_destroy, constraints: { table_id: /[^\/]+/ }

    # Uploads
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/uploads' => 'uploads#create', as: :api_v1_uploads_create

    # Imports
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/imports'                          => 'imports#create',                      as: :api_v1_imports_create

    # Import services
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/invalidate_token'    => 'imports#invalidate_service_token',    as: :api_v1_imports_service_invalidate_token

    # User layers
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#show',    as: :api_v1_users_layers_show
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers'     => 'layers#create',  as: :api_v1_users_layers_create
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#update',  as: :api_v1_users_layers_update
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#destroy', as: :api_v1_users_layers_destroy

    # User assets
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/assets'     => 'assets#create',  as: :api_v1_users_assets_create
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/assets'     => 'assets#index',   as: :api_v1_users_assets_index
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/assets/:id' => 'assets#destroy', as: :api_v1_users_assets_destroy

    # Maps
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:id' => 'maps#show',    as: :api_v1_maps_show
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:id' => 'maps#update',  as: :api_v1_maps_update

    # Map layers
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers'     => 'layers#create',  as: :api_v1_maps_layers_create
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers(/:id)' => 'layers#update',  as: :api_v1_maps_layers_update
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers/:id' => 'layers#destroy', as: :api_v1_maps_layers_destroy

    # Geocodings
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/available_geometries'           => 'geocodings#available_geometries', as: :api_v1_geocodings_available_geometries
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/estimation_for/:table_name'     => 'geocodings#estimation_for',       as: :api_v1_geocodings_estimation, constraints: { table_name: /[^\/]+/ }
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings'                                => 'geocodings#index',                as: :api_v1_geocodings_index
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/:id'                            => 'geocodings#show',                 as: :api_v1_geocodings_show
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings'                                => 'geocodings#create',               as: :api_v1_geocodings_create
    put  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/:id'                            => 'geocodings#update',               as: :api_v1_geocodings_update

    # Visualizations
    post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                                => 'visualizations#create',          as: :api_v1_visualizations_create
    put     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#update',          as: :api_v1_visualizations_update,          constraints: { id: /[^\/]+/ }
    delete  '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#destroy',         as: :api_v1_visualizations_destroy,         constraints: { id: /[^\/]+/ }
    post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays'     => 'overlays#create',                as: :api_v1_visualizations_overlays_create, constraints: { visualization_id: /[^\/]+/ }
    put     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays/:id' => 'overlays#update',                as: :api_v1_visualizations_overlays_update, constraints: { visualization_id: /[^\/]+/ }
    delete  '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays/:id' => 'overlays#destroy',               as: :api_v1_visualizations_overlays_destroy, constraints: { visualization_id: /[^\/]+/ }
    # TODO: deprecate?
    put     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/watching'                   => 'visualizations#notify_watching', as: :api_v1_visualizations_list_watching,   constraints: { id: /[^\/]+/ }
    put     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/next_id'                    => 'visualizations#set_next_id',     as: :api_v1_visualizations_set_next_id,     constraints: { id: /[^\/]+/ }
    post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#add_like',        as: :api_v1_visualizations_add_like,        constraints: { id: /[^\/]+/ }
    delete  '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                       => 'visualizations#remove_like',     as: :api_v1_visualizations_remove_like,     constraints: { id: /[^\/]+/ }

# Tags
    # Common data
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/common_data' => 'common_data#index', as: :api_v1_common_data_index

    # Synchronizations
    # TODO: deprecated?
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations'              => 'synchronizations#index',    as: :api_v1_synchronizations_index
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations'              => 'synchronizations#create',   as: :api_v1_synchronizations_create
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#show',     as: :api_v1_synchronizations_show
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#update',   as: :api_v1_synchronizations_update
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#destroy',  as: :api_v1_synchronizations_destroy
    # INFO: sync_now is public API
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id/sync_now' => 'synchronizations#syncing?', as: :api_v1_synchronizations_syncing
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id/sync_now' => 'synchronizations#sync_now', as: :api_v1_synchronizations_sync_now

    # Permissions
    put '(/user/:user_domain)(/u/:user_domain)/api/v1/perm/:id' => 'permissions#update', as: :api_v1_permissions_update

    # Organizations
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/org/'      => 'organizations#show',  as: :api_v1_organization_show


    # V2
    # --

    # WMS
    get '(/user/:user_domain)(/u/:user_domain)/api/v2/wms' => 'wms#proxy', as: :api_v2_wms_proxy

  end

  namespace :superadmin do
    resources :users do
      collection do
        get '/:id/dump' => 'users#dump'
        get '/:id/data_imports' => 'users#data_imports'
        get '/:id/data_imports/:data_import_id' => 'users#data_import'
        get '/:id/synchronizations' => 'users#synchronizations'
        get '/:id/synchronizations/:synchronization_id' => 'users#synchronization'
      end
    end
    resources :organizations
    resources :synchronizations
    resources :feature_flags
  end

  scope :module => 'superadmin', :format => :json do
    get '/superadmin/get_databases_info' => 'platform#databases_info'
    get '/superadmin/stats/total_users' => 'platform#total_users'
    get '/superadmin/stats/total_datasets' => 'platform#total_datasets'
    get '/superadmin/stats/total_seats_among_orgs' => 'platform#total_seats_among_orgs'
    get '/superadmin/stats/total_shared_objects_among_orgs' => 'platform#total_shared_objects_among_orgs'
  end

end
