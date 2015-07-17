# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/tables_controller'
require_relative 'tables_controller_shared_examples'

describe Api::Json::TablesController do

  it_behaves_like 'tables controllers' do
  end

end
