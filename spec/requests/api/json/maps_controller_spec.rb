# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/maps_controller'
require_relative 'maps_controller_shared_examples'

describe Api::Json::MapsController do
  it_behaves_like 'maps controllers' do
  end
end
