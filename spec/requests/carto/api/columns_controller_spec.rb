# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/columns_controller'
require_relative '../../../../spec/requests/api/json/columns_controller_shared_examples'


describe Carto::Api::ColumnsController do

  it_behaves_like 'columns controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns'           => 'columns#index',   as: :api_v1_tables_columns_index,   constraints: { table_id: /[^\/]+/ }
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id'       => 'columns#show',    as: :api_v1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        post   '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns'     => 'columns#create',  as: :api_v1_tables_columns_create,  constraints: { table_id: /[^\/]+/ }
        get    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#show',    as: :api_v1_tables_columns_show,    constraints: { table_id: /[^\/]+/ }
        put    '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#update',  as: :api_v1_tables_columns_update,  constraints: { table_id: /[^\/]+/ }
        delete '(/user/:user_domain)(/u/:user_domain)/api/v1/tables/:table_id/columns/:id' => 'columns#destroy', as: :api_v1_tables_columns_destroy, constraints: { table_id: /[^\/]+/ }
      end

    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

end
