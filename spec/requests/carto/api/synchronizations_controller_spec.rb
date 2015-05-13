# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/synchronizations_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/synchronizations_controller'

describe Carto::Api::SynchronizationsController do

  before(:all) do
    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations'              => 'synchronizations#index',    as: :api_v1_synchronizations_index
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id'          => 'synchronizations#show',     as: :api_v1_synchronizations_show
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations/:id/sync_now' => 'synchronizations#syncing?', as: :api_v1_synchronizations_syncing
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        post   '(/user/:user_domain)(/u/:user_domain)/api/v1/synchronizations'              => 'synchronizations#create',   as: :api_v1_synchronizations_create
      end
    end
  end

  after(:all) do
    Rails.application.reload_routes!
  end

  it_behaves_like 'synchronization controllers' do
  end
end

