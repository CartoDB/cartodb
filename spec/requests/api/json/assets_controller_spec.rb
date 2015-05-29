# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/assets_controller'
require_relative 'assets_controller_shared_examples'

describe Api::Json::AssetsController do
  it_behaves_like 'assets controllers' do
  end
end