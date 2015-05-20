# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/tags_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/tags_controller'

describe Carto::Api::TagsController do
  it_behaves_like 'tags controllers' do
  end

  before(:all) do
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get     '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/tags'                           => 'tags#index',                     as: :api_v1_visualizations_tags_index
      end

      # old controller
      scope :module => 'api/json', :format => :json do
        post    '(/user/:user_domain)(/u/:user_domain)/api/v1/viz'                                => 'visualizations#create',          as: :api_v1_visualizations_create
      end
    end
  end

  after(:all) do
    Rails.application.reload_routes!
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper
end

