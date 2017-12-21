# encoding: utf-8

require_relative '../../../spec_helper'
require_relative 'imports_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/imports_controller'

describe Api::Json::ImportsController do
  it_behaves_like 'imports controllers' do
  end
end
