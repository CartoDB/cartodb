# rubocop:disable Layout/LineLength, Layout/ExtraSpacing, Layout/SpaceBeforeFirstArg

# NOTES:
# (/u/:user_domain)     -> This allows support of org-urls (support != enforcement)
# (/user/:user_domain)  -> This allows support for domainless urls (in fact directly ignores subdomains)
# defaults: { dont_rewrite: true } -> Use this to force an individual action to not get rewritten to org-url
# Can be also done at controller source files by using -> skip_before_filter :ensure_org_url_if_org_user

CartoDB::Application.routes.draw do
  # Double use: for user public dashboard AND org dashboard
  get '/[(user/:user_domain)(u/:user_domain)]' => 'admin/pages#public'
  root to: 'admin/pages#index'

  get   '/signup'           => 'signup#signup',     as: :signup
  post  '/signup'           => 'signup#create',     as: :signup_organization_user
  get   '(/user/:user_domain)(/u/:user_domain)/signup' => 'signup#signup', as: :signup_subdomainless
  post  '(/user/:user_domain)(/u/:user_domain)/signup' => 'signup#create',  as: :signup_subdomainless_organization_user
  get   '(/user/:user_domain)(/u/:user_domain)/signup_http_authentication' => 'signup#create_http_authentication', as: :signup_http_authentication
  get   '(/user/:user_domain)(/u/:user_domain)/signup_http_authentication_in_progress' => 'signup#create_http_authentication_in_progress', as: :signup_http_authentication_in_progress

  get   '(/user/:user_domain)(/u/:user_domain)/enable_account_token/:id' => 'account_tokens#enable',     as: :enable_account_token_show
  get   '(/user/:user_domain)(/u/:user_domain)/resend_validation_mail/:user_id' => 'account_tokens#resend',     as: :resend_validation_mail
  get   '(/user/:user_domain)(/u/:user_domain)/account_token_authentication_error' => 'sessions#account_token_authentication_error',     as: :account_token_authentication_error

  get   '(/user/:user_domain)/login' => 'sessions#new',     as: :login
  match '(/user/:user_domain)(/u/:user_domain)/logout'          => 'sessions#destroy', as: :logout, via: [:get, :post]
  match '(/user/:user_domain)(/u/:user_domain)/sessions/create' => 'sessions#create',  as: :create_session, via: [:get, :post]
  get '(/user/:user_domain)(/u/:user_domain)/multifactor_authentication' => 'sessions#multifactor_authentication',  as: :multifactor_authentication_session
  post '(/user/:user_domain)(/u/:user_domain)/multifactor_authentication' => 'sessions#multifactor_authentication_verify_code',  as: :multifactor_authentication_verify_code

  get '(/user/:user_domain)(/u/:user_domain)/status'          => 'home#app_status'
  get '(/user/:user_domain)(/u/:user_domain)/diagnosis'       => 'home#app_diagnosis'

  # Password change
  resources :password_change, only: [:edit, :update]

  # Password resets
  get '(/user/:user_domain)(/u/:user_domain)/password_resets/new'         => 'password_resets#new',      as: :new_password_reset
  post '(/user/:user_domain)(/u/:user_domain)/password_resets'            => 'password_resets#create',   as: :create_password_reset
  get '(/user/:user_domain)(/u/:user_domain)/password_resets/:id/edit'    => 'password_resets#edit',     as: :edit_password_reset
  match '(/user/:user_domain)(/u/:user_domain)/password_resets/:id/edit'  => 'password_resets#update',   as: :update_password_reset, via: [:put, :patch]
  get '(/user/:user_domain)(/u/:user_domain)/password_resets/sent'        => 'password_resets#sent',     as: :sent_password_reset
  get '(/user/:user_domain)(/u/:user_domain)/password_resets/changed'     => 'password_resets#changed',  as: :changed_password_reset

  # OAuth
  match '(/user/:user_domain)(/u/:user_domain)/oauth/authorize'      => 'oauth#authorize',     as: :authorize, via: [:get, :post]
  match '(/user/:user_domain)(/u/:user_domain)/oauth/request_token'  => 'oauth#request_token', as: :request_token, via: [:get, :post]
  match '(/user/:user_domain)(/u/:user_domain)/oauth/access_token'   => 'oauth#access_token',  as: :access_token, via: [:get, :post]
  get   '(/user/:user_domain)(/u/:user_domain)/oauth/identity'       => 'sessions#show',       as: :oauth_show_sessions

  # This is what an external SAML endpoint should redirect to after successful auth.
  post '(/user/:user_domain)(/u/:user_domain)/saml/finalize' => 'sessions#create'

  # Editor v3
  scope module: 'carto', path: '(/user/:user_domain)(/u/:user_domain)' do
    namespace :builder, path: '/' do
      # Visualizations
      resources :visualizations, only: :show, path: '/builder', constraints: { id: /[0-z\.\-]+/ } do
        namespace :public, path: '/' do
          match 'embed', to: 'embeds#show', via: :get
          match 'embed_protected', to: 'embeds#show_protected', via: :post
          match 'embed_protected', to: 'embeds#show', via: :get
        end
      end

      match '/builder/:id/*other', to: 'visualizations#show', via: :get

      resources :datasets, path: '/dataset', only: :show, constraints: { id: /[0-z\.\-]+/ }
    end

    namespace :editor do
      get '(*path)', to: redirect { |params, request|
        CartoDB.base_url_from_request(request) + '/builder/' + params[:path].to_s
      }
    end

    get '/github' => 'oauth_login#github', as: :github
    get '/google/oauth' => 'oauth_login#google', as: :google_oauth
    get '/saml/metadata' => 'saml#metadata'

    # Oauth2 provider
    get  '/oauth2/authorize', to: 'oauth_provider#consent', as: :oauth_provider_authorize
    post '/oauth2/authorize', to: 'oauth_provider#authorize'
    post '/oauth2/token',     to: 'oauth_provider#token', as: :oauth_provider_token

    namespace :kuviz, path: '/' do
      # Custom Visualizations
      match '/kuviz/:id', to: 'visualizations#show', via: :get, as: :show
      match '/kuviz/:id/protected', to: 'visualizations#show_protected', via: :post, as: :password_protected
      match '/kuviz/:id/protected', to: 'visualizations#show', via: :get
    end

    namespace :app, path: '/' do
      # Custom Visualizations
      match '/app/:id', to: 'visualizations#show', via: :get, as: :show
      match '/app/:id/protected', to: 'visualizations#show_protected', via: :post, as: :password_protected
      match '/app/:id/protected', to: 'visualizations#show', via: :get
    end
  end

  # Internally, some of this methods will forcibly rewrite to the org-url if user belongs to an organization
  scope :module => :admin do

    # Organization dashboard page
    get    '(/user/:user_domain)(/u/:user_domain)/organization'                 => 'organizations#show',            as: :organization
    delete '(/user/:user_domain)(/u/:user_domain)/organization'                 => 'organizations#destroy',          as: :organization_destroy
    get    '(/user/:user_domain)(/u/:user_domain)/organization/settings'        => 'organizations#settings',        as: :organization_settings
    match  '(/user/:user_domain)(/u/:user_domain)/organization/settings'        => 'organizations#settings_update', as: :organization_settings_update, via: [:put, :patch]
    post '(/user/:user_domain)(/u/:user_domain)/organization/regenerate_api_keys'       => 'organizations#regenerate_all_api_keys', as: :regenerate_organization_users_api_key

    get    '(/user/:user_domain)(/u/:user_domain)/organization/groups(/*other)' => 'organizations#groups',          as: :organization_groups

    get    '(/user/:user_domain)(/u/:user_domain)/organization/auth'        => 'organizations#auth',        as: :organization_auth
    match  '(/user/:user_domain)(/u/:user_domain)/organization/auth'        => 'organizations#auth_update', as: :organization_auth_update, via: [:put, :patch]

    get    '(/user/:user_domain)(/u/:user_domain)/organization/notifications' => 'organizations#notifications',          as: :organization_notifications_admin
    post   '(/user/:user_domain)(/u/:user_domain)/organization/notifications' => 'organizations#new_notification',          as: :new_organization_notification_admin
    delete '(/user/:user_domain)(/u/:user_domain)/organization/notifications/:id' => 'organizations#destroy_notification',          as: :destroy_organization_notification_admin

    # Organization users management
    get '(/user/:user_domain)(/u/:user_domain)/organization/users/:id/edit'  => 'organization_users#edit',    as: :edit_organization_user,   constraints: { id: /[0-z\.\-]+/ }
    match '(/user/:user_domain)(/u/:user_domain)/organization/users/:id'       => 'organization_users#update',  as: :update_organization_user, constraints: { id: /[0-z\.\-]+/ }, via: [:put, :patch]
    get '(/user/:user_domain)(/u/:user_domain)/organization/users'                 => 'organizations#show',            as: :organization_users
    post '(/user/:user_domain)(/u/:user_domain)/organization/users'           => 'organization_users#create',  as: :create_organization_user
    delete '(/user/:user_domain)(/u/:user_domain)/organization/users/:id'       => 'organization_users#destroy', as: :delete_organization_user, constraints: { id: /[0-z\.\-]+/ }
    post '(/user/:user_domain)(/u/:user_domain)/organization/users/:id/regenerate_api_key'       => 'organization_users#regenerate_api_key', as: :regenerate_organization_user_api_key, constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/organization/users/new'       => 'organization_users#new',     as: :new_organization_user

    # User profile and account pages
    get    '(/user/:user_domain)(/u/:user_domain)/profile' => 'users#profile',        as: :profile_user
    get    '(/user/:user_domain)(/u/:user_domain)/account' => 'users#account',        as: :account_user
    get    '(/user/:user_domain)(/u/:user_domain)/dashboard/oauth_apps' => 'visualizations#index', as: :oauth_apps_user
    get    '(/user/:user_domain)(/u/:user_domain)/dashboard/oauth_apps/new' => 'visualizations#index', as: :oauth_apps_user_new
    get    '(/user/:user_domain)(/u/:user_domain)/dashboard/oauth_apps/edit/:id' => 'visualizations#index', as: :oauth_apps_user_edit
    get    '(/user/:user_domain)(/u/:user_domain)/dashboard/app_permissions' => 'visualizations#index', as: :app_permissions_user
    get    '(/user/:user_domain)(/u/:user_domain)/dashboard/connections' => 'visualizations#index', as: :connections_user

    # Lockout
    get '(/user/:user_domain)(/u/:user_domain)/lockout' => 'users#lockout', as: :lockout

    # Unverified
    get '(/user/:user_domain)(/u/:user_domain)/unverified' => 'users#unverified', as: :unverified

    # Maintenance Mode
    get '(/user/:user_domain)(/u/:user_domain)/maintenance_mode' => 'users#maintenance', as: :maintenance_mode

    # search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/search/:q'               => 'visualizations#index', as: :search
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/search/tag/:q'           => 'visualizations#index', as: :tag_search
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
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/subscriptions'                => 'visualizations#index', as: :datasets_subscriptions_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/catalog'                      => 'visualizations#index', as: :datasets_catalog_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/catalog/:id'                  => 'visualizations#index', as: :ddatasets_catalog_show
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/spatial-data-catalog'         => 'visualizations#index', as: :datasets_docatalog_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/spatial-data-catalog/:type/:id'      => 'visualizations#index', as: :datasets_docatalog_dataset_summary
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/spatial-data-catalog/:type/:id/data' => 'visualizations#index', as: :datasets_docatalog_dataset_data
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/spatial-data-catalog/:type/:id/map' => 'visualizations#index', as: :datasets_docatalog_dataset_map
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
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked'                       => 'visualizations#index', as: :datasets_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/:page'                 => 'visualizations#index', as: :datasets_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/tag/:tag'              => 'visualizations#index', as: :datasets_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/locked/tag/:tag/:page'        => 'visualizations#index', as: :datasets_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library'                      => 'visualizations#index', as: :datasets_library
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/:page'                => 'visualizations#index', as: :datasets_library_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/tag/:tag'             => 'visualizations#index', as: :datasets_library_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/library/tag/:tag/:page'       => 'visualizations#index', as: :datasets_library_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/connections'                  => 'visualizations#index', as: :your_connections_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/connections/new-connection'   => 'visualizations#index', as: :your_connections_new
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/connections/dataset-new-connection/:connector' => 'visualizations#index', as: :your_connections_add
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/connections/edit/:id' => 'visualizations#index', as: :your_connections_edit
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/connections/delete/:id' => 'visualizations#index', as: :your_connections_delete
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/connections/dataset-connection/:id/dataset' => 'visualizations#index', as: :your_connections_dataset
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/new-dataset' => 'visualizations#index', as: :datasets_new
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/dataset-new-connection/:connector' => 'visualizations#index', as: :your_connections_new_from_new_dataset
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/dataset-connection/:id/dataset' => 'visualizations#index', as: :your_connections_dataset_from_new_dataset
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/dataset-add-local-file/:extension' => 'visualizations#index', as: :datasets_local_new
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/dataset-import-arcgis' => 'visualizations#index', as: :datasets_import_arcgis
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/datasets/dataset-import-twitter' => 'visualizations#index', as: :datasets_import_twitter

    # Datasets from home for new dashboard
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/new-dataset' => 'visualizations#index', as: :datasets_new_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/dataset-new-connection/:connector' => 'visualizations#index', as: :your_connections_new_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/dataset-connection/:id/dataset' => 'visualizations#index', as: :your_connections_dataset_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/dataset-add-local-file/:extension' => 'visualizations#index', as: :datasets_local_new_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/dataset-import-arcgis' => 'visualizations#index', as: :datasets_import_arcgis_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/dataset-import-twitter' => 'visualizations#index', as: :datasets_import_twitter_from_home

    # Maps from home for new dashboard
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/new-map' => 'visualizations#index', as: :maps_new_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/map-new-connection/:connector' => 'visualizations#index', as: :maps_your_connections_new_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/map-connection/:id/dataset' => 'visualizations#index', as: :maps_your_connections_dataset_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/map-add-local-file/:extension' => 'visualizations#index', as: :maps_datasets_local_new_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/map-import-arcgis' => 'visualizations#index', as: :maps_datasets_import_arcgis_from_home
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/map-import-twitter' => 'visualizations#index', as: :maps_datasets_import_twitter_from_home

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
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked'                       => 'visualizations#index', as: :maps_locked
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/:page'                 => 'visualizations#index', as: :maps_locked_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/tag/:tag'              => 'visualizations#index', as: :maps_locked_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/locked/tag/:tag/:page'        => 'visualizations#index', as: :maps_locked_tag_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/external'                     => 'visualizations#index', as: :maps_external
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/external/:page'               => 'visualizations#index', as: :maps_external_page
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/new-map' => 'visualizations#index', as: :maps_new
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/map-new-connection/:connector' => 'visualizations#index', as: :your_connections_new_from_new_map
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/map-connection/:id/dataset' => 'visualizations#index', as: :your_connections_dataset_from_new_map
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/map-add-local-file/:extension' => 'visualizations#index', as: :datasets_local_new_from_new_map
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/map-import-arcgis' => 'visualizations#index', as: :datasets_import_arcgis_from_new_map
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/maps/map-import-twitter' => 'visualizations#index', as: :datasets_import_twitter_from_new_map

    # Dashboards
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/deep-insights'                        => 'visualizations#index', as: :dashboards_index
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/deep-insights/:page'                  => 'visualizations#index', as: :dashboards_page

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

    # Private dashboard
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/'                  => 'visualizations#index', as: :dashboard
    get '(/user/:user_domain)(/u/:user_domain)/dashboard'                   => 'visualizations#index', as: :dashboard_bis
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/common_data'       => 'pages#common_data',    as: :dashboard_common_data
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/common_data/:tag'  => 'pages#common_data',    as: :dashboard_common_data_tag
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/notifications/'    => 'visualizations#index', as: :notifications
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/notifications'     => 'visualizations#index', as: :notifications_bis
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/solutions/'        => 'visualizations#index', as: :solutions
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/solutions'         => 'visualizations#index', as: :solutions_bis
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/get-started'       => 'visualizations#index', as: :get_started
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/get-started/:id'   => 'visualizations#index', as: :get_started_onboarding

    # Tileset viewer
    get '/viewer/user/:user_domain/:type' => 'tilesets_viewer#index', as: :public_tilesets_viewer
    get '(/user/:user_domain)(/u/:user_domain)/dashboard/tilesets/:id'   => 'visualizations#index', as: :tilesets_viewer, constraints: { id: /[0-z.-]+/ }

    # Public dashboard
    # root also goes to 'pages#public', as: public_visualizations_home
    get '(/user/:user_domain)(/u/:user_domain)/me'                       => 'pages#user_feed',  as: :public_user_feed_home
    get '(/user/:user_domain)(/u/:user_domain)/page/:page'               => 'pages#public',     as: :public_page
    get '(/user/:user_domain)(/u/:user_domain)/tag/:tag'                 => 'pages#public',     as: :public_tag
    get '(/user/:user_domain)(/u/:user_domain)/tag/:tag/:page'           => 'pages#public',     as: :public_tag_page
    # Public maps
    get '(/user/:user_domain)(/u/:user_domain)/maps'                     => 'pages#maps', as: :public_maps_home
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

    get '(/user/:user_domain)(/u/:user_domain)/your_apps'                      => 'client_applications#api_key',            as: :api_key_credentials
    post '(/user/:user_domain)(/u/:user_domain)/your_apps/api_key/regenerate'  => 'client_applications#regenerate_api_key', as: :regenerate_api_key
    get '(/user/:user_domain)(/u/:user_domain)/your_apps/oauth'                => 'client_applications#oauth',              as: :oauth_credentials
    delete '(/user/:user_domain)(/u/:user_domain)/your_apps/oauth/regenerate'  => 'client_applications#regenerate_oauth',   as: :regenerate_oauth
  end

  scope :module => 'carto/admin' do
    resources :mobile_apps, path: '(/user/:user_domain)(/u/:user_domain)/your_apps/mobile', except: [:edit]
  end

  scope module: 'carto/api', defaults: { format: :json } do
    # Visualizations
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                              => 'visualizations#index',                         as: :api_v1_visualizations_index
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                          => 'visualizations#show',                          as: :api_v1_visualizations_show,              constraints: { id: /[^\/]+/ }
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/related_templates'        => 'templates#related_templates_by_visualization', as: :api_v1_visualizations_related_templates, constraints: { id: /[^\/]+/ }

    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                     => 'visualizations#add_like',                      as: :api_v1_visualizations_add_like,          constraints: { id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/like'                     => 'visualizations#remove_like',                   as: :api_v1_visualizations_remove_like,       constraints: { id: /[^\/]+/ }

    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/watching'                 => 'visualizations#notify_watching',               as: :api_v1_visualizations_list_watching,     constraints: { id: /[^\/]+/ }
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/watching'                 => 'visualizations#list_watching',                 as: :api_v1_visualizations_notify_watching,   constraints: { id: /[^\/]+/ }

    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                              => 'visualizations#create',                        as: :api_v1_visualizations_create
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                          => 'visualizations#update',                        as: :api_v1_visualizations_update,            constraints: { id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id'                          => 'visualizations#destroy',                       as: :api_v1_visualizations_destroy,           constraints: { id: /[^\/]+/ }
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:id/google_maps_static_image' => 'visualizations#google_maps_static_image',      as: :api_v1_google_maps_static_image,         constraints: { id: /[^\/]+/ }

    # Tables
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id'                     => 'tables#show',   as: :api_v1_tables_show, constraints: { id: /[^\/]+/ }
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/tables'                        => 'tables#create', as: :api_v1_tables_create
    put '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id'                     => 'tables#update', as: :api_v1_tables_update, constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id/related_templates'   => 'templates#related_templates_by_table', as: :api_v1_tables_related_templates, constraints: { id: /[^\/]+/ }

    # Table columns
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#index',   as: :api_v1_tables_columns_index,   constraints: { table_id: /[^\/]+/ }
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#show',    as: :api_v1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#create',  as: :api_v1_tables_columns_create,  constraints: { table_id: /[^\/]+/ }
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#update',  as: :api_v1_tables_columns_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#destroy', as: :api_v1_tables_columns_destroy, constraints: { table_id: /[^\/]+/ }

    # Table records
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id'         => 'records#show',    as: :api_v1_tables_records_show,   constraints: { table_id: /[^\/]+/ }
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records'             => 'records#create',  as: :api_v1_tables_records_create, constraints: { table_id: /[^\/]+/ }
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:cartodb_id' => 'records#update',  as: :api_v1_tables_record_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:cartodb_id' => 'records#destroy', as: :api_v1_tables_record_destroy, constraints: { table_id: /[^\/]+/ }

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
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers'        => 'layers#user_index',   as: :api_v1_users_layers_index
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#user_show',    as: :api_v1_users_layers_show
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers'     => 'layers#user_create',  as: :api_v1_users_layers_create
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#user_update',  as: :api_v1_users_layers_update
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#user_destroy', as: :api_v1_users_layers_destroy

    # Map layers
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers'       => 'layers#map_index',   as: :api_v1_maps_layers_index
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers/:id'   => 'layers#map_show',    as: :api_v1_maps_layers_show
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers'       => 'layers#map_create',  as: :api_v1_maps_layers_create
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers(/:id)' => 'layers#map_update',  as: :api_v1_maps_layers_update
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:map_id/layers/:id'   => 'layers#map_destroy', as: :api_v1_maps_layers_destroy

    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations'                => 'synchronizations#index',     as: :api_v1_synchronizations_index
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id'            => 'synchronizations#show',     as: :api_v1_synchronizations_show
    # INFO: sync_now is public API
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id/sync_now'   => 'synchronizations#syncing?', as: :api_v1_synchronizations_syncing

    # Oembed
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/oembed' => 'oembed#show', as: :api_v1_oembed

    # Geocodings
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/available_geometries'           => 'geocodings#available_geometries', as: :api_v1_geocodings_available_geometries
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/estimation_for/:table_name'     => 'geocodings#estimation_for',       as: :api_v1_geocodings_estimation, constraints: { table_name: /[^\/]+/ }
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings'                                => 'geocodings#index',                as: :api_v1_geocodings_index
    get  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/:id'                            => 'geocodings#show',                 as: :api_v1_geocodings_show

    # Users
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:id'               => 'users#show',                    as: :api_v1_users_show
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/get_authenticated_users' => 'users#get_authenticated_users', as: :api_v1_users_get_authenticated_user

    # User assets
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/assets' => 'assets#index',   as: :api_v1_users_assets_index

    # Organization (new endpoint that deprecates old, unused one, so v1)
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:id/users' => 'organizations#users', as: :api_v1_organization_users, constraints: { id: /[^\/]+/ }

    # Groups
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/groups' => 'groups#index', as: :api_v1_organization_groups, constraints: { organization_id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/groups/:group_id' => 'groups#show', as: :api_v1_organization_groups_show, constraints: { organization_id: /[^\/]+/, group_id: /[^\/]+/ }
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/groups' => 'groups#create', as: :api_v1_organization_groups_create, constraints: { organization_id: /[^\/]+/ }
    put '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/groups/:group_id' => 'groups#update', as: :api_v1_organization_groups_update, constraints: { organization_id: /[^\/]+/, group_id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/groups/:group_id' => 'groups#destroy', as: :api_v1_organization_groups_destroy, constraints: { organization_id: /[^\/]+/, group_id: /[^\/]+/ }

    get '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/groups' => 'groups#index', as: :api_v1_user_groups, constraints: { user_id: /[^\/]+/ }

    get '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:id/groups/:group_id/users' => 'organizations#users', as: :api_v1_organization_groups_users, constraints: { organization_id: /[^\/]+/, group_id: /[^\/]+/ }
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/groups/:group_id/users' => 'groups#add_users', as: :api_v1_organization_groups_add_users, constraints: { organization_id: /[^\/]+/, group_id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/groups/:group_id/users(/:user_id)' => 'groups#remove_users', as: :api_v1_organization_groups_remove_users, constraints: { organization_id: /[^\/]+/, group_id: /[^\/]+/ , user_id: /[^\/]+/ }

    # Databases (organization) groups
    # Note: url doesn't contain org_id because this needs to be triggered from the SQL API
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/databases/:database_name/groups'                           => 'database_groups#create',  as: :api_v1_databases_group_create
    put '(/user/:user_domain)(/u/:user_domain)/api/v1/databases/:database_name/groups/:old_name'          => 'database_groups#update',  as: :api_v1_databases_group_update
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/databases/:database_name/groups/:name'          => 'database_groups#destroy',  as: :api_v1_databases_group_destroy
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/databases/:database_name/groups/:name/users'          => 'database_groups#add_users',  as: :api_v1_databases_group_add_users
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/databases/:database_name/groups/:name/users(/:username)'          => 'database_groups#remove_users',  as: :api_v1_databases_group_remove_users
    put '(/user/:user_domain)(/u/:user_domain)/api/v1/databases/:database_name/groups/:name/permission/:username/tables/:table_name' => 'database_groups#update_permission', as: :api_v1_databases_group_update_permission
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/databases/:database_name/groups/:name/permission/:username/tables/:table_name' => 'database_groups#destroy_permission', as: :api_v1_databases_group_destroy_permission

    # Grantables (entities you can share maps or datasets with)
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/grantables' => 'grantables#index', as: :api_v1_grantables_index, constraints: { id: /[^\/]+/ }

    # User creations
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/user_creations/:id' => 'user_creations#show', as: :api_v1_user_creations_show, constraints: { id: /[^\/]+/ }

    # Invitations
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/organization/:organization_id/invitations' => 'invitations#create', as: :api_v1_organization_invitations_create, constraints: { organization_id: /[^\/]+/ }

    # Visualization templates
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/templates'     => 'templates#index',   as: :api_v1_vis_templates_index
    get    '(/user/:user_domain)(/u/:user_domain)/api/v1/templates/:id' => 'templates#show',    as: :api_v1_vis_templates_show,    constraints: { id: /[^\/]+/ }
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/templates'     => 'templates#create',  as: :api_v1_vis_templates_create
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/templates/:id' => 'templates#update',  as: :api_v1_vis_templates_update,  constraints: { id: /[^\/]+/ }
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/templates/:id' => 'templates#destroy', as: :api_v1_vis_templates_destroy, constraints: { id: /[^\/]+/ }

    # V2 api/json calls

    # Visualizations

    get '(/user/:user_domain)(/u/:user_domain)/api/v2/viz/:id/viz'                       => 'visualizations#vizjson2',   as: :api_v2_visualizations_vizjson,    constraints: { id: /[^\/]+/ }
    get '(/user/:user_domain)(/u/:user_domain)/api/v2/viz/:id/static/:width/:height.png' => 'visualizations#static_map', as: :api_v2_visualizations_static_map, constraints: { id: /[^\/]+/ }

    # ImageProxy
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/image_proxy' => 'image_proxy#show'

    # Permissions
    put '(/user/:user_domain)(/u/:user_domain)/api/v1/perm/:id' => 'permissions#update', as: :api_v1_permissions_update
  end

  scope module: 'api/json', defaults: { format: :json } do

    # V1
    # --

    # Uploads
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/uploads' => 'uploads#create', as: :api_v1_uploads_create

    # Imports
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/imports'                          => 'imports#create',                      as: :api_v1_imports_create

    # Import services
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/invalidate_token'    => 'imports#invalidate_service_token',    as: :api_v1_imports_service_invalidate_token

    # User assets
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/assets'     => 'assets#create',  as: :api_v1_users_assets_create
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/users/:user_id/assets/:id' => 'assets#destroy', as: :api_v1_users_assets_destroy

    # Geocodings
    post '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings'                                => 'geocodings#create',               as: :api_v1_geocodings_create
    put  '(/user/:user_domain)(/u/:user_domain)/api/v1/geocodings/:id'                            => 'geocodings#update',               as: :api_v1_geocodings_update

    # Synchronizations
    post   '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations'              => 'synchronizations#create',   as: :api_v1_synchronizations_create
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#update',   as: :api_v1_synchronizations_update
    delete '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#destroy',  as: :api_v1_synchronizations_destroy
    put    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id/sync_now' => 'synchronizations#sync_now', as: :api_v1_synchronizations_sync_now

    # Organizations
    get '(/user/:user_domain)(/u/:user_domain)/api/v1/org/'      => 'organizations#show',  as: :api_v1_organization_show

    # WMS
    get '(/user/:user_domain)(/u/:user_domain)/api/v2/wms' => 'wms#proxy', as: :api_v2_wms_proxy
  end

  namespace :superadmin do
    resources :users, only: [:index, :show] do
      collection do
        get '/:id/dump' => 'users#dump'
        get '/:id/data_imports' => 'users#data_imports'
        get '/:id/data_imports/:data_import_id' => 'users#data_import'
        get '/:id/synchronizations' => 'users#synchronizations'
        get '/:id/synchronizations/:synchronization_id' => 'users#synchronization'
        get '/:id/geocodings' => 'users#geocodings'
        get '/:id/geocodings/:geocoding_id' => 'users#geocoding'
      end
    end
    resources :organizations, only: [:index, :show]
    resources :synchronizations
    resources :oauth_apps, only: [:create, :update, :destroy]
  end

  scope module: 'carto' do
    namespace :superadmin do
      resources :user_migration_exports, only: [:show, :create]
      resources :user_migration_imports, only: [:show, :create]
      resources :users, only: [] do
        get '/usage' => 'users#usage', on: :member
      end

      resources :organizations, only: [] do
        get '/usage' => 'organizations#usage', on: :member
      end
    end
  end

  scope module: 'superadmin', defaults: { format: :json } do
    get '/superadmin/get_databases_info' => 'platform#databases_info'
    get '/superadmin/database_validation' => 'platform#database_validation'
    get '/superadmin/stats/total_users' => 'platform#total_users'
    get '/superadmin/stats/total_pay_users' => 'platform#total_pay_users'
    get '/superadmin/stats/total_datasets' => 'platform#total_datasets'
    get '/superadmin/stats/total_seats_among_orgs' => 'platform#total_seats_among_orgs'
    get '/superadmin/stats/total_shared_objects_among_orgs' => 'platform#total_shared_objects_among_orgs'
    get '/superadmin/stats/total_visualizations' => 'platform#total_visualizations'
    get '/superadmin/stats/total_maps' => 'platform#total_maps'
    get '/superadmin/stats/total_active_users' => 'platform#total_active_users'
  end

  UUID_REGEXP = /([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{2})([0-9a-f]{2})-([0-9a-f]{12})/

  scope module: 'carto/api', path: '(/user/:user_domain)(/u/:user_domain)/api/', defaults: { format: :json } do
    scope 'v4/', module: 'public' do
      # This scope is intended for public APIs that only authenticate via API Key and have CORS enabled
      match '*path', via: [:OPTIONS], to: 'application#options'

      get 'me', to: 'users#me_public', as: :api_v4_users_me

      # Custom visualizations
      post 'kuviz', to: 'custom_visualizations#create', as: :api_v4_kuviz_create_viz
      delete 'kuviz/:id', to: 'custom_visualizations#delete', constraints: { id: UUID_REGEXP }, as: :api_v4_kuviz_delete_viz
      put 'kuviz/:id', to: 'custom_visualizations#update', constraints: { id: UUID_REGEXP }, as: :api_v4_kuviz_update_viz
      get 'kuviz', to: 'custom_visualizations#index', as: :api_v4_kuviz_list_vizs

      # apps
      post 'app', to: 'apps#create', as: :api_v4_app_create_viz
      delete 'app/:id', to: 'apps#delete', constraints: { id: UUID_REGEXP }, as: :api_v4_app_delete_viz
      put 'app/:id', to: 'apps#update', constraints: { id: UUID_REGEXP }, as: :api_v4_app_update_viz
      get 'app', to: 'apps#index', as: :api_v4_app_list_vizs

      # OAuth apps
      resources :oauth_apps, only: [:index, :show, :create, :update, :destroy], constraints: { id: UUID_REGEXP }, as: :api_v4_oauth_apps
      post 'oauth_apps/:id/regenerate_secret', to: 'oauth_apps#regenerate_secret', constraints: { id: UUID_REGEXP }, as: :api_v4_oauth_apps_regenerate_secret
      get 'granted_oauth_apps', to: 'oauth_apps#index_granted', as: :api_v4_oauth_apps_index_granted
      post 'oauth_apps/:id/revoke', to: 'oauth_apps#revoke', constraints: { id: UUID_REGEXP }, as: :api_v4_oauth_apps_revoke

      get 'datasets', to: 'datasets#index', as: :api_v4_datasets

      ## Connections
      get 'connections' => 'connections#index', as: :api_v4_connections_list
      post 'connections' => 'connections#create', as: :api_v4_connections_create
      get 'connections/:id' => 'connections#show', as: :api_v4_connections_show
      get 'connectors' => 'connections#list_connectors', as: :api_v4_connections_list_connectors
      delete 'connections/:id' => 'connections#destroy', as: :api_v4_connections_destroy
      put 'connections/:id' => 'connections#update', as: :api_v4_connections_update
      get 'connections/check_oauth/:service' => 'connections#check_oauth', as: :api_v4_connections_check_oauth
      get 'connections/:id/connect' => 'connections#connect', as: :api_v4_connections_connect
      post 'connections/:id/dryrun' => 'connections#dryrun', as: :api_v4_connections_dryrun
      get 'connections/:id/projects' => 'connections#projects', as: :api_v4_connections_projects

      scope 'do' do
        get 'token' => 'data_observatory#token', as: :api_v4_do_token
        get 'subscriptions' => 'data_observatory#subscriptions', as: :api_v4_do_subscriptions_show
        get 'subscriptions/:subscription_id' => 'data_observatory#subscription', as: :api_v4_do_subscription_show, constraints: { subscription_id: /[\w\.\-]+/ }
        put 'subscriptions/:subscription_id' => 'data_observatory#update_subscription', as: :api_v4_do_subscription_update, constraints: { subscription_id: /[\w\.\-]+/ }
        post 'subscriptions' => 'data_observatory#subscribe', as: :api_v4_do_subscriptions_create
        delete 'subscriptions' => 'data_observatory#unsubscribe', as: :api_v4_do_subscriptions_destroy
        get 'subscription_info' => 'data_observatory#subscription_info', as: :api_v4_do_subscription_info

        get 'entity_info' => 'data_observatory#entity_info', as: :api_v4_do_entity_info

        get 'subscriptions/:subscription_id/sync' => 'data_observatory#sync_info', as: :api_v4_do_subscription_sync_info, constraints: { subscription_id: /[\w\.\-]+/ }
        post 'subscriptions/:subscription_id/sync' => 'data_observatory#create_sync', as: :api_v4_do_subscription_create_sync, constraints: { subscription_id: /[\w\.\-]+/ }
        delete 'subscriptions/:subscription_id/sync' => 'data_observatory#destroy_sync', as: :api_v4_do_subscription_destroy_sync, constraints: { subscription_id: /[\w\.\-]+/ }

        post 'subscriptions/:dataset_id/sample' => 'data_observatory#create_sample', as: :api_v4_do_subscription_create_sample, constraints: { dataset_id: /[\w\.\-]+/ }
      end

      # Federated Tables

      ## Federated servers
      get 'federated_servers', to: 'federated_tables#list_federated_servers', as: :api_v4_federated_servers_list_servers
      post 'federated_servers' => 'federated_tables#register_federated_server', as: :api_v4_federated_servers_register_server
      get 'federated_servers/:federated_server_name' => 'federated_tables#show_federated_server', as: :api_v4_federated_servers_get_server
      put 'federated_servers/:federated_server_name' => 'federated_tables#update_federated_server', as: :api_v4_federated_servers_update_server
      delete 'federated_servers/:federated_server_name' => 'federated_tables#unregister_federated_server', as: :api_v4_federated_servers_unregister_server

      ## Remote schemas
      get 'federated_servers/:federated_server_name/remote_schemas', to: 'federated_tables#list_remote_schemas', as: :api_v4_federated_servers_list_schemas

      ## Remote tables
      get 'federated_servers/:federated_server_name/remote_schemas/:remote_schema_name/remote_tables', to: 'federated_tables#list_remote_tables', as: :api_v4_federated_servers_list_tables
      post 'federated_servers/:federated_server_name/remote_schemas/:remote_schema_name/remote_tables', to: 'federated_tables#register_remote_table', as: :api_v4_federated_servers_register_table
      get 'federated_servers/:federated_server_name/remote_schemas/:remote_schema_name/remote_tables/:remote_table_name', to: 'federated_tables#show_remote_table', as: :api_v4_federated_servers_get_table
      put 'federated_servers/:federated_server_name/remote_schemas/:remote_schema_name/remote_tables/:remote_table_name', to: 'federated_tables#update_remote_table', as: :api_v4_federated_servers_update_table
      delete 'federated_servers/:federated_server_name/remote_schemas/:remote_schema_name/remote_tables/:remote_table_name', to: 'federated_tables#unregister_remote_table', as: :api_v4_federated_servers_unregister_table

      # BigQuery Dataset and Tilesets

      get '/bigquery/datasets', to: 'bigquery_tilesets#list_datasets', as: :api_v4_bigquery_list_datasets
      get '/bigquery/tilesets', to: 'bigquery_tilesets#list_tilesets', as: :api_v4_bigquery_list_tilesets
      get '/bigquery/tilesets/:tileset_id', to: 'bigquery_tilesets#tileset', as: :api_v4_bigquery_get_tileset, constraints: { tileset_id: /(.*)\.(.*)\.(.*)/ }
      get '/bigquery/tilesets/publish', to: 'bigquery_tilesets#publish', as: :api_v4_bigquery_tilesets_publish
      get '/bigquery/tilesets/unpublish', to: 'bigquery_tilesets#unpublish', as: :api_v4_bigquery_tilesets_unpublish
    end

    scope 'v3/' do
      # Front/back split
      get 'me' => 'users#me', as: :api_v3_users_me
      put 'me' => 'users#update_me', as: :api_v3_users_update_me
      delete 'me' => 'users#delete_me', as: :api_v3_users_delete_me

      put 'maps/:map_id/widgets' => 'widgets#update_many', as: :api_v3_maps_layers_update_many_widgets

      scope 'maps/:map_id/layers/:map_layer_id', constraints: { map_id: /[^\/]+/, map_layer_id: /[^\/]+/ } do
        resources :widgets, only: [:show, :create, :update, :destroy], constraints: { id: /[^\/]+/ }
      end

      scope '/viz/:id', constraints: { id: /[^\/]+/ } do
        get 'viz' => 'visualizations#vizjson3', as: :api_v3_visualizations_vizjson
      end

      resource :metrics, only: [:create]

      resources :api_keys, only: [:create, :destroy, :index, :show], constraints: { id: /[^\/]+/ }
      scope 'api_keys/:id/token' do
        post 'regenerate' => 'api_keys#regenerate_token', as: :regenerate_api_key_token
      end

      scope '/viz/:visualization_id', constraints: { id: /[^\/]+/ } do
        resources :analyses, only: [:show, :create, :update, :destroy], constraints: { id: /[^\/]+/ }
        resources :mapcaps, only: [:index, :show, :create, :destroy], constraints: { id: /[^\/]+/ }
        resource :state, only: [:update]

        resources :snapshots,
                  only: [:index, :show, :create, :update, :destroy],
                  constraints: { id: UUID_REGEXP }

        scope '/layer/:layer_id', constraints: { layer_id: /[^\/]+/ } do
          resources :legends,
                    only: [:index, :show, :create, :update, :destroy],
                    constraints: { id: /[^\/]+/ }
        end
      end

      resources :visualization_exports, only: [:create, :show], constraints: { id: /[^\/]+/ } do
        get 'download' => 'visualization_exports#download', as: :download
      end

      put 'notifications/:category', to: 'static_notifications#update', as: :api_v3_static_notifications_update

      get 'email_notifications', to: 'email_notifications#show', as: :api_v3_email_notifications_show
      put 'email_notifications', to: 'email_notifications#update', as: :api_v3_email_notifications_update

      resources :organizations, only: [] do
        resources :notifications, only: [:create, :destroy],
                                  controller: :organization_notifications,
                                  constraints: { id: UUID_REGEXP }
      end

      resources :users, only: [], constraints: { id: UUID_REGEXP } do
        resources :notifications, only: [:update],
                                  controller: :received_notifications,
                                  constraints: { id: UUID_REGEXP }
      end

      # Multi-factor authentication
      resources :multifactor_auths, only: [:create, :destroy, :show, :index], constraints: { id: /[^\/]+/ } do
        post 'verify_code', on: :member
      end

      get 'tags' => 'tags#index', as: :api_v3_users_tags
      get 'search_preview/:q' => 'search_preview#index', as: :api_v3_search_preview

      scope 'dbdirect' do
        resources :certificates, only: [:index, :show, :create, :destroy], controller: 'dbdirect_certificates', as: :dbdirect_certificates
        resource :ip, only: [:show, :update, :destroy], controller: 'dbdirect_ips', as: :dbdirect_ip
      end
    end

    scope 'v2/' do
      resources :maps, only: [:show, :update], constraints: { id: UUID_REGEXP }

      # EUMAPI
      scope 'organization/:id_or_name/' do
        get    'users',             to: 'organization_users#index',   as: :api_v2_organization_users_index
        post   'users',             to: 'organization_users#create',  as: :api_v2_organization_users_create
        get    'users/:u_username', to: 'organization_users#show',    as: :api_v2_organization_users_show
        delete 'users/:u_username', to: 'organization_users#destroy', as: :api_v2_organization_users_delete
        put    'users/:u_username', to: 'organization_users#update',  as: :api_v2_organization_users_update

        get 'users/:u_username/mfa/:type', to: 'multifactor_authentication#show', as: :api_v2_organization_users_mfa_show
        post 'users/:u_username/mfa/:type', to: 'multifactor_authentication#create', as: :api_v2_organization_users_mfa_create
        delete 'users/:u_username/mfa/:type', to: 'multifactor_authentication#destroy', as: :api_v2_organization_users_mfa_delete
      end
    end

    scope 'v1/' do
      match '*path', via: :options, to: '/api/application#options'
      resources :maps, only: [:show, :update], constraints: { id: UUID_REGEXP }

      # Organization assets
      scope '/organization/:organization_id', constraints: { id: UUID_REGEXP } do
        resources :assets,
                  controller: 'organization_assets',
                  only: [:index, :show, :create, :destroy],
                  constraints: { id: UUID_REGEXP }
      end

      # EUMAPI
      scope 'organization/:id_or_name/' do
        post   'users',             to: 'organization_users#create',  as: :api_v1_organization_users_create
        get    'users/:u_username', to: 'organization_users#show',    as: :api_v1_organization_users_show
        delete 'users/:u_username', to: 'organization_users#destroy', as: :api_v1_organization_users_delete
        put    'users/:u_username', to: 'organization_users#update',  as: :api_v1_organization_users_update
      end

      # Overlays
      scope 'viz/:visualization_id/', constraints: { visualization_id: /[0-z\-]+/ } do
        resources :overlays, only: [:index, :show, :create, :update, :destroy], constraints: { id: /[0-z\-]+/ }
      end

      # Connectors
      get 'connectors' => 'connectors#index', as: :api_v1_connectors_index
      get 'connectors/:provider_id' => 'connectors#show', as: :api_v1_connectors_show
      get 'connectors/:provider_id/tables' => 'connectors#tables', as: :api_v1_connectors_tables
      get 'connectors/:provider_id/connect' => 'connectors#connect', as: :api_v1_connectors_connect
      get 'connectors/:provider_id/projects' => 'connectors#projects', as: :api_v1_connectors_projects
      post 'connectors/:provider_id/projects' => 'connectors#projects'
      get 'connectors/:provider_id/:project_id/datasets' => 'connectors#project_datasets', as: :api_v1_connectors_project_datasets
      get 'connectors/:provider_id/:project_id/:dataset_id/tables' => 'connectors#project_dataset_tables', as: :api_v1_connectors_project_dataset_tables
      post 'connectors/:provider_id/dryrun' => 'connectors#dryrun', as: :api_v1_connectors_dryrun
    end
  end

  # Load optional engines
  Carto::CartoGearsSupport.new.gears.each do |gear|
    mount gear.engine, at: '/'
  end
end

Rails.application.routes.draw do
  mount(
    Coverband::Reporters::Web.new,
    at: '/coverband',
    constraints: lambda { |request| request.env['warden']&.user&.has_access_to_coverband? }
  )
end

# rubocop:enable Layout/LineLength, Layout/ExtraSpacing, Layout/SpaceBeforeFirstArg
