# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/columns_controller'
require_relative 'columns_controller_shared_examples'

describe Api::Json::ColumnsController do
  it_behaves_like 'columns controllers' do
  end
  
end
