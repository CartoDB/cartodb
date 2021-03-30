require 'spec_helper_unit'
require_relative 'imports_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/imports_controller'

describe Api::Json::ImportsController do
  it_behaves_like 'imports controllers' do
  end
end
