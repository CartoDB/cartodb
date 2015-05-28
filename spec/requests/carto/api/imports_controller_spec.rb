# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/imports_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/imports_controller'

describe Carto::Api::ImportsController do
  it_behaves_like 'imports controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports'                          => 'imports#index',                       as: :api_v1_imports_index
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/:id'                      => 'imports#show',                        as: :api_v1_imports_show
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/token_valid'         => 'imports#service_token_valid?',        as: :api_v1_imports_service_token_valid
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/list_files'          => 'imports#list_files_for_service',      as: :api_v1_imports_service_list_files
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/auth_url'            => 'imports#get_service_auth_url',        as: :api_v1_imports_service_auth_url
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/validate_code/:code' => 'imports#validate_service_oauth_code', as: :api_v1_imports_service_validate_code
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/imports/service/:id/oauth_callback/'    => 'imports#service_oauth_callback',      as: :api_v1_imports_service_oauth_callback
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        post   '(/user/:user_domain)(/u/:user_domain)/api/v1/imports'                          => 'imports#create',                      as: :api_v1_imports_create
      end

    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

  #include Rack::Test::Methods
  #include Warden::Test::Helpers
end

