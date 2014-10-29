# encoding: utf-8

# NOTES:
# (/u/:user_domain)                -> This allows support of org-urls (support != enforcement)
# defaults: { dont_rewrite: true } -> Use this to force an individual action to not get rewritten to org-url
# Can be also done at controller source files by using -> skip_before_filter :ensure_org_url_if_org_user

CartoDB::Application.routes.draw do
  # Double use: for user public dashboard AND org dashboard
  root :to => 'admin/pages#public'

  get   '(/u/:user_domain)/login'           => 'sessions#new',     as: :login
  get   '(/u/:user_domain)/logout'          => 'sessions#destroy', as: :logout
  match '(/u/:user_domain)/sessions/create' => 'sessions#create',  as: :create_session

  match '/limits' => 'home#limits', as: :limits
  match '/status' => 'home#app_status'

  # OAuth
  match '(/u/:user_domain)/oauth/authorize'      => 'oauth#authorize',     as: :authorize
  match '(/u/:user_domain)/oauth/request_token'  => 'oauth#request_token', as: :request_token
  match '(/u/:user_domain)/oauth/access_token'   => 'oauth#access_token',  as: :access_token
  get   '(/u/:user_domain)/oauth/identity'       => 'sessions#show',       as: :oauth_show_sessions

  # Internally, some of this methods will forcibly rewrite to the org-url if user belongs to an organization
  scope :module => :admin do

    # Organization dashboard page
    get    '(/u/:user_domain)/organization'                 => 'organizations#show',            as: :organization
    get    '(/u/:user_domain)/organization/settings'        => 'organizations#settings',        as: :organization_settings
    put    '(/u/:user_domain)/organization/settings'        => 'organizations#settings_update', as: :organization_settings_update
    # Organization users management
    get    '(/u/:user_domain)/organization/users/:id/edit'  => 'users#edit',    as: :edit_organization_user,   constraints: { id: /[0-z\.\-]+/ }
    put    '(/u/:user_domain)/organization/users/:id'       => 'users#update',  as: :update_organization_user, constraints: { id: /[0-z\.\-]+/ }
    post   '(/u/:user_domain)/organization/users'           => 'users#create',  as: :create_organization_user
    delete '(/u/:user_domain)/organization/users/:id'       => 'users#destroy', as: :delete_organization_user, constraints: { id: /[0-z\.\-]+/ }
    get    '(/u/:user_domain)/organization/users/new'       => 'users#new',     as: :new_organization_user

    # search
    get '(/u/:user_domain)/dashboard/search/:q'               => 'visualizations#index', as: :search
    get '(/u/:user_domain)/dashboard/search/:q/:page'         => 'visualizations#index', as: :search_page
    get '(/u/:user_domain)/dashboard/shared/search/:q'        => 'visualizations#index', as: :search_shared
    get '(/u/:user_domain)/dashboard/shared/search/:q/:page'  => 'visualizations#index', as: :search_shared_page

    # Tables
    get '(/u/:user_domain)/dashboard/tables'                            => 'visualizations#index', as: :tables_index
    get '(/u/:user_domain)/dashboard/tables/:page'                      => 'visualizations#index', as: :tables_page
    get '(/u/:user_domain)/dashboard/tables/tag/:tag'                   => 'visualizations#index', as: :tables_tag
    get '(/u/:user_domain)/dashboard/tables/tag/:tag/:page'             => 'visualizations#index', as: :tables_tag_page
    get '(/u/:user_domain)/dashboard/tables/shared'                     => 'visualizations#index', as: :tables_shared
    get '(/u/:user_domain)/dashboard/tables/shared/:page'               => 'visualizations#index', as: :tables_shared_page
    get '(/u/:user_domain)/dashboard/tables/shared/tag/:tag'            => 'visualizations#index', as: :tables_shared_tag
    get '(/u/:user_domain)/dashboard/tables/shared/tag/:tag/:page'      => 'visualizations#index', as: :tables_shared_tag_page
    get '(/u/:user_domain)/dashboard/tables/mine'                       => 'visualizations#index', as: :tables_mine
    get '(/u/:user_domain)/dashboard/tables/mine/:page'                 => 'visualizations#index', as: :tables_mine_page
    get '(/u/:user_domain)/dashboard/tables/mine/tag/:tag'              => 'visualizations#index', as: :tables_mine_tag
    get '(/u/:user_domain)/dashboard/tables/mine/tag/:tag/:page'        => 'visualizations#index', as: :tables_mine_tag_page
    get '(/u/:user_domain)/dashboard/tables/mine/locked'                => 'visualizations#index', as: :tables_mine_locked
    get '(/u/:user_domain)/dashboard/tables/mine/locked/:page'          => 'visualizations#index', as: :tables_mine_locked_page
    get '(/u/:user_domain)/dashboard/tables/mine/locked/tag/:tag'       => 'visualizations#index', as: :tables_mine_locked_tag
    get '(/u/:user_domain)/dashboard/tables/mine/locked/tag/:tag/:page' => 'visualizations#index', as: :tables_mine_locked_tag_page
    get '(/u/:user_domain)/dashboard/tables/locked'                     => 'visualizations#index', as: :tables_locked
    get '(/u/:user_domain)/dashboard/tables/locked/:page'               => 'visualizations#index', as: :tables_locked_page
    get '(/u/:user_domain)/dashboard/tables/locked/tag/:tag'            => 'visualizations#index', as: :tables_locked_tag
    get '(/u/:user_domain)/dashboard/tables/locked/tag/:tag/:page'      => 'visualizations#index', as: :tables_locked_tag_page

    # Tables search
    get '(/u/:user_domain)/dashboard/tables/search/:q'                    => 'visualizations#index', as: :tables_search
    get '(/u/:user_domain)/dashboard/tables/search/:q/:page'              => 'visualizations#index', as: :tables_search_page
    get '(/u/:user_domain)/dashboard/tables/shared/search/:q'             => 'visualizations#index', as: :tables_shared_search
    get '(/u/:user_domain)/dashboard/tables/shared/search/:q/:page'       => 'visualizations#index', as: :tables_shared_search_page
    get '(/u/:user_domain)/dashboard/tables/locked/search/:q'             => 'visualizations#index', as: :tables_locked_search
    get '(/u/:user_domain)/dashboard/tables/locked/search/:q/:page'       => 'visualizations#index', as: :tables_locked_search_page
    get '(/u/:user_domain)/dashboard/tables/mine/search/:q'               => 'visualizations#index', as: :tables_mine_search
    get '(/u/:user_domain)/dashboard/tables/mine/search/:q/:page'         => 'visualizations#index', as: :tables_mine_search_page
    get '(/u/:user_domain)/dashboard/tables/mine/locked/search/:q'        => 'visualizations#index', as: :tables_mine_locked_search
    get '(/u/:user_domain)/dashboard/tables/mine/locked/search/:q/:page'  => 'visualizations#index', as: :tables_mine_locked_search_page


    # Visualizations
    get '(/u/:user_domain)/dashboard/visualizations'                            => 'visualizations#index', as: :visualizations_index
    get '(/u/:user_domain)/dashboard/visualizations/:page'                      => 'visualizations#index', as: :visualizations_page
    get '(/u/:user_domain)/dashboard/visualizations/tag/:tag'                   => 'visualizations#index', as: :visualizations_tag
    get '(/u/:user_domain)/dashboard/visualizations/tag/:tag/:page'             => 'visualizations#index', as: :visualizations_tag_page
    get '(/u/:user_domain)/dashboard/visualizations/shared'                     => 'visualizations#index', as: :visualizations_shared
    get '(/u/:user_domain)/dashboard/visualizations/shared/:page'               => 'visualizations#index', as: :visualizations_shared_page
    get '(/u/:user_domain)/dashboard/visualizations/shared/tag/:tag'            => 'visualizations#index', as: :visualizations_shared_tag
    get '(/u/:user_domain)/dashboard/visualizations/shared/tag/:tag/:page'      => 'visualizations#index', as: :visualizations_shared_tag_page
    get '(/u/:user_domain)/dashboard/visualizations/mine'                       => 'visualizations#index', as: :visualizations_mine
    get '(/u/:user_domain)/dashboard/visualizations/mine/:page'                 => 'visualizations#index', as: :visualizations_mine_page
    get '(/u/:user_domain)/dashboard/visualizations/mine/tag/:tag'              => 'visualizations#index', as: :visualizations_mine_tag
    get '(/u/:user_domain)/dashboard/visualizations/mine/tag/:tag/:page'        => 'visualizations#index', as: :visualizations_mine_tag_page
    get '(/u/:user_domain)/dashboard/visualizations/mine/locked'                => 'visualizations#index', as: :visualizations_mine_locked
    get '(/u/:user_domain)/dashboard/visualizations/mine/locked/:page'          => 'visualizations#index', as: :visualizations_mine_locked_page
    get '(/u/:user_domain)/dashboard/visualizations/mine/locked/tag/:tag'       => 'visualizations#index', as: :visualizations_mine_locked_tag
    get '(/u/:user_domain)/dashboard/visualizations/mine/locked/tag/:tag/:page' => 'visualizations#index', as: :visualizations_mine_locked_tag_page
    get '(/u/:user_domain)/dashboard/visualizations/locked'                     => 'visualizations#index', as: :visualizations_locked
    get '(/u/:user_domain)/dashboard/visualizations/locked/:page'               => 'visualizations#index', as: :visualizations_locked_page
    get '(/u/:user_domain)/dashboard/visualizations/locked/tag/:tag'            => 'visualizations#index', as: :visualizations_locked_tag
    get '(/u/:user_domain)/dashboard/visualizations/locked/tag/:tag/:page'      => 'visualizations#index', as: :visualizations_locked_tag_page

    # Visualizations search
    get '(/u/:user_domain)/dashboard/visualizations/search/:q'                    => 'visualizations#index', as: :visualizations_search
    get '(/u/:user_domain)/dashboard/visualizations/search/:q/:page'              => 'visualizations#index', as: :visualizations_search_page
    get '(/u/:user_domain)/dashboard/visualizations/shared/search/:q'             => 'visualizations#index', as: :visualizations_shared_search
    get '(/u/:user_domain)/dashboard/visualizations/shared/search/:q/:page'       => 'visualizations#index', as: :visualizations_shared_search_page
    get '(/u/:user_domain)/dashboard/visualizations/locked/search/:q'             => 'visualizations#index', as: :visualizations_locked_search
    get '(/u/:user_domain)/dashboard/visualizations/locked/search/:q/:page'       => 'visualizations#index', as: :visualizations_locked_search_page
    get '(/u/:user_domain)/dashboard/visualizations/mine/search/:q'               => 'visualizations#index', as: :visualizations_mine_search
    get '(/u/:user_domain)/dashboard/visualizations/mine/search/:q/:page'         => 'visualizations#index', as: :visualizations_mine_search_page
    get '(/u/:user_domain)/dashboard/visualizations/mine/locked/search/:q'        => 'visualizations#index', as: :visualizations_mine_locked_search
    get '(/u/:user_domain)/dashboard/visualizations/mine/locked/search/:q/:page'  => 'visualizations#index', as: :visualizations_mine_locked_search_page

    # Tags
    get '(/u/:user_domain)/dashboard/tag/:tag'  => 'visualizations#index', as: :tags

    # Private dashboard
    get '(/u/:user_domain)/dashboard/'                  => 'visualizations#index', as: :dashboard
    get '(/u/:user_domain)/dashboard'                   => 'visualizations#index', as: :dashboard_bis
    get '(/u/:user_domain)/dashboard/common_data'       => 'pages#common_data',    as: :dashboard_common_data
    get '(/u/:user_domain)/dashboard/common_data/:tag'  => 'pages#common_data',    as: :dashboard_common_data_tag

    # Public dashboard
    # root goes to 'pages#public'
    get '(/u/:user_domain)/page/:page'               => 'pages#public', as: :public_page
    get '(/u/:user_domain)/tag/:tag'                 => 'pages#public', as: :public_tag
    get '(/u/:user_domain)/tag/:tag/:page'           => 'pages#public', as: :public_tag_page
    # Public dataset
    get '(/u/:user_domain)/datasets'                 => 'pages#datasets', as: :public_datasets_home
    get '(/u/:user_domain)/datasets/page/:page'      => 'pages#datasets', as: :public_datasets_page
    get '(/u/:user_domain)/datasets/tag/:tag'        => 'pages#datasets', as: :public_datasets_tag
    get '(/u/:user_domain)/datasets/tag/:tag/:page'  => 'pages#datasets', as: :public_datasets_tag_page
    get '/sitemap.xml'              => 'pages#sitemap',  as: :public_sitemap
    # Public tables
    get '(/u/:user_domain)/tables/:id/'              => 'visualizations#show',            as: :public_tables_show,      constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/tables/:id'               => 'visualizations#show',            as: :public_tables_show_bis,  constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/tables/:id/map'           => 'visualizations#show',            as: :public_tables_show_map,  constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/tables/:id/table'         => 'visualizations#show',            as: :public_tables_table,     constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/tables/:id/public'        => 'visualizations#public_table',    as: :public_table,            constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public/table'  => 'visualizations#public_table',    as: :public_table_table,      constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/public/map'    => 'visualizations#public_table',    as: :public_table_map,        constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/tables/:id/embed_map'     => 'visualizations#embed_map',       as: :public_tables_embed_map, constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    # Public visualizations
    get '(/u/:user_domain)/'                         => 'pages#public',                   as: :public_visualizations_home, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz'                      => 'visualizations#index',           as: :public_visualizations, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz/track_embed'          => 'visualizations#track_embed',     as: :public_visualizations_track_embed, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz/embed_forbidden'      => 'visualizations#embed_forbidden', as: :public_visualizations_embed_forbidden, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz/:id'                  => 'visualizations#show',            as: :public_visualizations_show,       constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz/:id/map'              => 'visualizations#show',            as: :public_visualizations_show_map,   constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz/:id/table'            => 'visualizations#show',            as: :public_visualizations_table,      constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz/:id/public'           => 'visualizations#public_table',    as: :public_visualization,             constraints: { id: /[^\/]+/ }
    get '(/u/:user_domain)/viz/:id/embed_map'        => 'visualizations#embed_map',       as: :public_visualizations_embed_map,  constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    get '(/u/:user_domain)/viz/:id/public_map'       => 'visualizations#public_map',      as: :public_visualizations_public_map, constraints: { id: /[^\/]+/ }
    # Public protected embed maps
    get '(/u/:user_domain)/viz/:id/protected_embed_map'  => 'visualizations#show_protected_embed_map', constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    post '(/u/:user_domain)/viz/:id/protected_embed_map' => 'visualizations#show_protected_embed_map', as: :protected_embed_map, constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    # Public protected maps
    get '(/u/:user_domain)/viz/:id/protected_public_map'  => 'visualizations#show_protected_public_map', constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }
    post '(/u/:user_domain)/viz/:id/protected_public_map' => 'visualizations#show_protected_public_map', as: :protected_public_map, constraints: { id: /[^\/]+/ }, defaults: { dont_rewrite: true }

    match  '(/u/:user_domain)/your_apps'                    => 'client_applications#api_key',            as: :api_key_credentials
    post   '(/u/:user_domain)/your_apps/api_key/regenerate' => 'client_applications#regenerate_api_key', as: :regenerate_api_key
    delete '(/u/:user_domain)/your_apps/oauth'              => 'client_applications#oauth',              as: :oauth_credentials

  end

  scope :module => 'api/json', :format => :json do

    # V1
    # --

    # Users
    get '(/u/:user_domain)/api/v1/get_authenticated_users' => 'users#get_authenticated_users', as: :api_v1_users_get_authenticated_user

    # Tables
    post '(/u/:user_domain)/api/v1/tables'     => 'tables#create', as: :api_v1_tables_create
    get '(/u/:user_domain)/api/v1/tables/:id'  => 'tables#show',   as: :api_v1_tables_create, constraints: { id: /[^\/]+/ }
    put '(/u/:user_domain)/api/v1/tables/:id'  => 'tables#update', as: :api_v1_tables_create, constraints: { id: /[^\/]+/ }

    # Table records
    get    '(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#index',   as: :api_v1_tables_records_index,  constraints: { table_id: /[^\/]+/ }
    post   '(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#create',  as: :api_v1_tables_records_create, constraints: { table_id: /[^\/]+/ }
    get    '(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#show',    as: :api_v1_tables_records_show,   constraints: { table_id: /[^\/]+/ }
    put    '(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#update',  as: :api_v1_tables_record_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#destroy', as: :api_v1_tables_record_destroy, constraints: { table_id: /[^\/]+/ }

    # Table columns
    get    '(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#index',   as: :api_v1_tables_columns_index,   constraints: { table_id: /[^\/]+/ }
    post   '(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#create',  as: :api_v1_tables_columns_create,  constraints: { table_id: /[^\/]+/ }
    get    '(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#show',    as: :api_v1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }
    put    '(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#update',  as: :api_v1_tables_columns_update,  constraints: { table_id: /[^\/]+/ }
    delete '(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#destroy', as: :api_v1_tables_columns_destroy, constraints: { table_id: /[^\/]+/ }

    # Uploads
    post '(/u/:user_domain)/api/v1/uploads' => 'uploads#create', as: :api_v1_uploads_create

    # Imports
    post   '(/u/:user_domain)/api/v1/imports'                          => 'imports#create',                      as: :api_v1_imports_create
    get    '(/u/:user_domain)/api/v1/imports/:id'                      => 'imports#show',                        as: :api_v1_imports_show
    get    '(/u/:user_domain)/api/v1/imports'                          => 'imports#index',                       as: :api_v1_imports_index

    # Import services
    get    '(/u/:user_domain)/api/v1/imports/service/:id/token_valid'         => 'imports#service_token_valid?',        as: :api_v1_imports_service_token_valid
    get    '(/u/:user_domain)/api/v1/imports/service/:id/list_files'          => 'imports#list_files_for_service',      as: :api_v1_imports_service_list_files
    get    '(/u/:user_domain)/api/v1/imports/service/:id/auth_url'            => 'imports#get_service_auth_url',        as: :api_v1_imports_service_auth_url
    get    '(/u/:user_domain)/api/v1/imports/service/:id/validate_code/:code' => 'imports#validate_service_oauth_code', as: :api_v1_imports_service_validate_code
    delete '(/u/:user_domain)/api/v1/imports/service/:id/invalidate_token'    => 'imports#invalidate_service_token',    as: :api_v1_imports_service_invalidate_token
    # Must be GET verb despite altering state
    get     '(/u/:user_domain)/api/v1/imports/service/:id/oauth_callback/'    => 'imports#service_oauth_callback',      as: :api_v1_imports_service_oauth_callback

    # Users
    get    '(/u/:user_domain)/api/v1/users/:id'                 => 'users#show',     as: :api_v1_users_show

    # User layers
    get    '(/u/:user_domain)/api/v1/users/:user_id/layers'     => 'layers#index',   as: :api_v1_users_layers_index
    get    '(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#show',    as: :api_v1_users_layers_show
    post   '(/u/:user_domain)/api/v1/users/:user_id/layers'     => 'layers#create',  as: :api_v1_users_layers_create
    put    '(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#update',  as: :api_v1_users_layers_update
    delete '(/u/:user_domain)/api/v1/users/:user_id/layers/:id' => 'layers#destroy', as: :api_v1_users_layers_destroy

    # User assets
    post   '(/u/:user_domain)/api/v1/users/:user_id/assets'     => 'assets#create',  as: :api_v1_users_assets_create
    get    '(/u/:user_domain)/api/v1/users/:user_id/assets'     => 'assets#index',   as: :api_v1_users_assets_index
    delete '(/u/:user_domain)/api/v1/users/:user_id/assets/:id' => 'assets#destroy', as: :api_v1_users_assets_destroy

    # /api/v1/users/5002ad84-6b3e-4372-996e-b52269ec1cac/assets/b93f1b1e-484c-491b-a22b-c61a76968b63

    # Maps
    get    '(/u/:user_domain)/api/v1/maps/:id' => 'maps#show',    as: :api_v1_maps_show
    post   '(/u/:user_domain)/api/v1/maps'     => 'maps#create',  as: :api_v1_maps_create
    put    '(/u/:user_domain)/api/v1/maps/:id' => 'maps#update',  as: :api_v1_maps_update
    delete '(/u/:user_domain)/api/v1/maps/:id' => 'maps#destroy', as: :api_v1_maps_destroy

    # Map layers
    get    '(/u/:user_domain)/api/v1/maps/:map_id/layers'     => 'layers#index',   as: :api_v1_maps_layers_index
    get    '(/u/:user_domain)/api/v1/maps/:map_id/layers/:id' => 'layers#show',    as: :api_v1_maps_layers_show
    post   '(/u/:user_domain)/api/v1/maps/:map_id/layers'     => 'layers#create',  as: :api_v1_maps_layers_create
    put    '(/u/:user_domain)/api/v1/maps/:map_id/layers/:id' => 'layers#update',  as: :api_v1_maps_layers_update
    delete '(/u/:user_domain)/api/v1/maps/:map_id/layers/:id' => 'layers#destroy', as: :api_v1_maps_layers_destroy

    # Geocodings
    get  '(/u/:user_domain)/api/v1/geocodings/available_geometries'           => 'geocodings#available_geometries', as: :api_v1_geocodings_available_geometries
    get  '(/u/:user_domain)/api/v1/geocodings/country_data_for/:country_code' => 'geocodings#country_data_for',     as: :api_v1_geocodings_country_data
    get  '(/u/:user_domain)/api/v1/geocodings/estimation_for/:table_name'     => 'geocodings#estimation_for',       as: :api_v1_geocodings_estimation
    get  '(/u/:user_domain)/api/v1/geocodings/get_countries'                  => 'geocodings#get_countries',        as: :api_v1_geocodings_get_countries
    get  '(/u/:user_domain)/api/v1/geocodings'                                => 'geocodings#index',                as: :api_v1_geocodings_index
    get  '(/u/:user_domain)/api/v1/geocodings/:id'                            => 'geocodings#show',                 as: :api_v1_geocodings_show
    post '(/u/:user_domain)/api/v1/geocodings'                                => 'geocodings#create',               as: :api_v1_geocodings_create
    put  '(/u/:user_domain)/api/v1/geocodings/:id'                            => 'geocodings#update',               as: :api_v1_geocodings_update

    # Visualizations
    get     '(/u/:user_domain)/api/v1/viz/tags'                           => 'tags#index',                     as: :api_v1_visualizations_tags_index
    get     '(/u/:user_domain)/api/v1/viz'                                => 'visualizations#index',           as: :api_v1_visualizations_index
    post    '(/u/:user_domain)/api/v1/viz'                                => 'visualizations#create',          as: :api_v1_visualizations_create
    get     '(/u/:user_domain)/api/v1/viz/:id/stats'                      => 'visualizations#stats',           as: :api_v1_visualizations_stats,           constraints: { id: /[^\/]+/ }
    get     '(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#show',            as: :api_v1_visualizations_show,            constraints: { id: /[^\/]+/ }
    put     '(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#update',          as: :api_v1_visualizations_update,          constraints: { id: /[^\/]+/ }
    delete  '(/u/:user_domain)/api/v1/viz/:id'                            => 'visualizations#destroy',         as: :api_v1_visualizations_destroy,         constraints: { id: /[^\/]+/ }
    get     '(/u/:user_domain)/api/v1/viz/:id/viz'                        => 'visualizations#vizjson1',        as: :api_v1_visualizations_vizjson,         constraints: { id: /[^\/]+/ }
    get     '(/u/:user_domain)/api/v1/viz/:visualization_id/overlays'     => 'overlays#index',                 as: :api_v1_visualizations_overlays_index,  constraints: { visualization_id: /[^\/]+/ }
    post    '(/u/:user_domain)/api/v1/viz/:visualization_id/overlays'     => 'overlays#create',                as: :api_v1_visualizations_overlays_create, constraints: { visualization_id: /[^\/]+/ }
    get     '(/u/:user_domain)/api/v1/viz/:visualization_id/overlays/:id' => 'overlays#show',                  as: :api_v1_visualizations_overlays_show,   constraints: { visualization_id: /[^\/]+/ }
    put     '(/u/:user_domain)/api/v1/viz/:visualization_id/overlays/:id' => 'overlays#update',                as: :api_v1_visualizations_overlays_update, constraints: { visualization_id: /[^\/]+/ }
    delete  '(/u/:user_domain)/api/v1/viz/:visualization_id/overlays/:id' => 'overlays#destroy',               as: :api_v1_visualizations_overlays_destroy, constraints: { visualization_id: /[^\/]+/ }
    get     '(/u/:user_domain)/api/v1/viz/:id/watching'                   => 'visualizations#list_watching',   as: :api_v1_visualizations_notify_watching, constraints: { id: /[^\/]+/ }
    put    '(/u/:user_domain)/api/v1/viz/:id/watching'                    => 'visualizations#notify_watching', as: :api_v1_visualizations_list_watching,   constraints: { id: /[^\/]+/ }

    # Tags
    get '(/u/:user_domain)/api/v1/tags' => 'tags#index', as: :api_v1_tags_index

    # Common data
    get '(/u/:user_domain)/api/v1/common_data' => 'common_data#index', as: :api_v1_common_data_index

    # Synchronizations
    get    '(/u/:user_domain)/api/v1/synchronizations'              => 'synchronizations#index',    as: :api_v1_synchronizations_index
    post   '(/u/:user_domain)/api/v1/synchronizations'              => 'synchronizations#create',   as: :api_v1_synchronizations_create
    get    '(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#show',     as: :api_v1_synchronizations_show
    put    '(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#update',   as: :api_v1_synchronizations_update
    delete '(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#destroy',  as: :api_v1_synchronizations_destroy
    get    '(/u/:user_domain)/api/v1/synchronizations/:id/sync_now' => 'synchronizations#syncing?', as: :api_v1_synchronizations_syncing
    put    '(/u/:user_domain)/api/v1/synchronizations/:id/sync_now' => 'synchronizations#sync_now', as: :api_v1_synchronizations_sync_now

    # Permissions
    get '(/u/:user_domain)/api/v1/perm/:id' => 'permissions#show',   as: :api_v1_permissions_show
    put '(/u/:user_domain)/api/v1/perm/:id' => 'permissions#update', as: :api_v1_permissions_show

    # Organizations
    get '(/u/:user_domain)/api/v1/org/'      => 'organizations#show',  as: :api_v1_organization_show
    get '(/u/:user_domain)/api/v1/org/users' => 'organizations#users', as: :api_v1_organization_users

    # V2
    # --

    # Visualizations
    get '(/u/:user_domain)/api/v2/viz/:id/viz'    => 'visualizations#vizjson2', as: :api_v2_visualizations_vizjson, constraints: { id: /[^\/]+/ }

    # WMS
    get '(/u/:user_domain)/api/v2/wms' => 'wms#proxy', as: :api_v2_wms_proxy

  end

  namespace :superadmin do
    resources :users do
      collection do
        get '/:id/dump' => 'users#dump'
        get '/:id/data_imports' => 'users#data_imports'
        get '/:id/data_imports/:data_import_id' => 'users#data_import'
      end
    end
    resources :organizations
    resources :synchronizations
  end

  scope :module => 'superadmin', :format => :json do
    get '/superadmin/get_databases_info' => 'platform#databases_info'
  end

end
