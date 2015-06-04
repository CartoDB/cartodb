# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/tables_controller'
require_relative '../../../../spec/requests/api/json/tables_controller_shared_examples'


describe Carto::Api::TablesController do
  it_behaves_like 'tables controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id'                         => 'tables#show',     as: :api_v1_tables_show, constraints: { id: /[^\/]+/ }

        get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/records/:id'       => 'records#show',    as: :api_v1_tables_records_show,   constraints: { table_id: /[^\/]+/ }

        get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns'           => 'columns#index',   as: :api_v1_tables_columns_index,   constraints: { table_id: /[^\/]+/ }
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id'       => 'columns#show',    as: :api_v1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        post '(/user/:user_domain)(/u/:user_domain)/api/v1/tables'     => 'tables#create', as: :api_v1_tables_create
        put '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:id'  => 'tables#update', as: :api_v1_tables_update, constraints: { id: /[^\/]+/ }
        put '(/user/:user_domain)(/u/:user_domain)/api/v1/perm/:id' => 'permissions#update', as: :api_v1_permissions_update
      end

    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

end
