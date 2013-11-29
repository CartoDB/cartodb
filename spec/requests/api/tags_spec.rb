# encoding: utf-8
require 'rack/test'
require_relative '../../spec_helper'

def app
  CartoDB::Application.new
end #app

describe "API 1.0 tags management" do
  include Rack::Test::Methods
  before do
    @user     = create_user(username: 'test')
    @user.set_map_key
    @api_key  = @user.api_key
    @headers  = { 
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  describe 'GET /api/v1/tags' do
    it 'returns a collection of tags with their counters' do
      table1 = create_table(
        user_id:  @user.id,
        name:     'My table #1',
        privacy:  Table::PUBLIC,
        tags:     "tag 1,tag 2,tag 3,tag 3"
      )
      table2 = create_table(
        user_id:  @user.id,
        name:     'My table #2',
        privacy:  Table::PRIVATE,
        tags:     "tag 3"
      )
      table3 = create_table(
        user_id:  create_user.id,
        name:     'Another table #3',
        privacy:  Table::PRIVATE
      )

      get "/api/v1/tags?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.should include({"name" => "tag 1", "count" => 1})
      response.should include({"name" => "tag 2", "count" => 1})
      response.should include({"name" => "tag 3", "count" => 2})

      get "/api/v1/tags?type=table&api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.should include({"name" => "tag 1", "count" => 1})
      response.should include({"name" => "tag 2", "count" => 1})
      response.should include({"name" => "tag 3", "count" => 2})

      get "/api/v1/tags?type=derived&api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200

      response = JSON.parse(last_response.body)
      response.should be_empty
    end
  end # GET /api/v1/tags
end

