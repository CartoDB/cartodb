# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/records_controller'
require_relative 'records_controller_shared_examples'

describe Api::Json::RecordsController do
  it_behaves_like 'records controllers' do
  end
  
end
