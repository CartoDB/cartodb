# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/records_controller'
require_relative '../../../../spec/requests/api/json/records_controller_shared_examples'


describe Carto::Api::RecordsController do

  it_behaves_like 'records controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#index',   as: :api_v1_tables_records_index,  constraints: { table_id: /[^\/]+/ }
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id'       => 'records#show',      as: :api_v1_tables_records_show,   constraints: { table_id: /[^\/]+/ }
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        post '(/user/:user_domain)(/u/:user_domain)/api/v1/tables'     => 'tables#create', as: :api_v1_tables_create

        post '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records'     => 'records#create',  as: :api_v1_tables_records_create, constraints: { table_id: /[^\/]+/ }
        put  '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#update',  as: :api_v1_tables_record_update,  constraints: { table_id: /[^\/]+/ }
        delete '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id' => 'records#destroy', as: :api_v1_tables_record_destroy, constraints: { table_id: /[^\/]+/ }
      end

    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

end
