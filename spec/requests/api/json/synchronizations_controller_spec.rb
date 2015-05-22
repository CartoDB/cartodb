# encoding: utf-8

require_relative '../../../spec_helper'
require_relative 'synchronizations_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/synchronizations_controller'

describe Api::Json::SynchronizationsController do
  it_behaves_like 'synchronization controllers' do
  end
end

