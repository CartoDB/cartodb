# encoding: utf-8

require_relative '../../../spec_helper'
require_relative 'tags_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/tags_controller'

describe Api::Json::TagsController do
  it_behaves_like 'tags controllers' do
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper
end
