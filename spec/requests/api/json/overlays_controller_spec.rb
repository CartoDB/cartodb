# encoding: UTF-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/overlays_controller'
require_relative 'overlays_controller_shared_examples'

describe Api::Json::OverlaysController do
  it_behaves_like 'overlays controllers' do
  end
end
