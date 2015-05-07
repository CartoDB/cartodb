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
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/imports'                          => 'imports#index',                       as: :api_v1_imports_index
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1_1/imports/:id'                      => 'imports#show',                        as: :api_v1_imports_show
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

