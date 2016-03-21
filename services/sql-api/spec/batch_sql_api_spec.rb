# encoding: utf-8
require_relative '../batch_sql_api.rb'
require_relative '../../../spec/rspec_configuration.rb'

module Cartodb; end

describe CartoDB::BatchSQLApi do

  before(:each) do
    Cartodb.stubs(:config).returns(TEST_SQL_API_CONFIG)
  end

  describe '#execute' do

    let(:api) { CartoDB::SQLApi.new(username: 'maloshumos') }

    it "returns an array of rows" do
      stub_api_request 200, 'sql_api_success.json'
      result = api.fetch("SELECT cartodb_id, description from public_table")
      result.should eq [{"cartodb_id"=>1, "description"=>"a"}, {"cartodb_id"=>2, "description"=>"b"}, {"cartodb_id"=>3, "description"=>"c"}, {"cartodb_id"=>4, "description"=>"d"}]
    end

    it "raises PermissionError when the table is private" do
      stub_api_request 400, 'sql_api_private.json'
      expect { api.fetch("SELECT * FROM private_table") }.to raise_error(CartoDB::SQLApi::PermissionError)
    end

    it "raises SQLError when the query is flawed" do
      stub_api_request 400, 'sql_api_error.json'
      expect { api.fetch("wrong query") }.to raise_error(CartoDB::SQLApi::SQLError)
    end

    it "handles gzipped output" do
      stub_api_request 200, 'sql_api_binary.bin'
      result = api.fetch("SELECT description from public_table", 'csv')
      result.should match /description,\r\n\"Pretend that you’ve opened this book/
      result.should match /And if not, then the onion will make it all happen for you.*$/
    end

  end #fetch


  def stub_api_request(code, response_file)
    response = File.open(path_to(response_file)).read
    Typhoeus.stub(/.*cartodb.com\/api\/v[12]/).and_return(
      Typhoeus::Response.new(code: code, body: response)
    )
  end # stub_api_request

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to

  TEST_SQL_API_CONFIG =  {:sql_api => {
      "private" => {
        "protocol" =>   'http',
        "domain" => 'cartodb.com',
        "endpoint" =>  '/api/v1/sql',
        "port" =>       8080
      },
      "public" => {
        "protocol" =>   'http',
        "domain" =>    'cartodb.com',
        "endpoint" =>   '/api/v2/sql',
        "port" =>       8080
      }
    }
  }

end # CartoDB::SQLApi
