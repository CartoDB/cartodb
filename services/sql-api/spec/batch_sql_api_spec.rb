# encoding: utf-8
require_relative '../batch_sql_api.rb'
require_relative '../../../spec/rspec_configuration.rb'

module Cartodb; end

describe CartoDB::BatchSQLApi do

  before(:each) do
    Cartodb.stubs(:config).returns(TEST_SQL_BATCH_API_CONFIG)
  end

  let(:api) { CartoDB::BatchSQLApi.new(username: 'cdb_example', api_key: 'abcde12345') }

  describe '#execute' do

    it "returns job information after request" do
      stub_api_request 200, 'sql_batch_api_request.json'
      result = api.execute("SELECT 1")
      result.should eq "created_at" => "2016-03-21T12:04:55.527Z", "job_id" => "d837e44a-687b-4b9e-b5e1-880140cd8d11", "query" => "SELECT 1", "status" => "pending", "updated_at" => "2016-03-21T12:04:55.527Z", "user" => "cdb_example"
    end

  end

  describe '#status' do

    it "returns job status" do
      stub_api_request 200, 'sql_batch_api_request.json'
      result = api.status("d837e44a-687b-4b9e-b5e1-880140cd8d11")
      result.should eq "created_at" => "2016-03-21T12:04:55.527Z", "job_id" => "d837e44a-687b-4b9e-b5e1-880140cd8d11", "query" => "SELECT 1", "status" => "pending", "updated_at" => "2016-03-21T12:04:55.527Z", "user" => "cdb_example"
      result["status"].should eq "pending"
    end

    it "returns error when job id does not exist" do
      stub_api_request 400, 'sql_batch_api_job_error.json'
      expect { api.status("09651d94-044e-4b60-a694-23fa0c3069f7") }.to raise_error(CartoDB::BatchSQLApi::SQLError)
    end

  end

  describe '#list' do

    it "returns list with requested jobs" do
      stub_api_request 200, 'sql_batch_api_job_list.json'
      result = api.list_jobs
      result.should eq [{"job_id" => "d837e44a-687b-4b9e-b5e1-880140cd8d11", "user" => "cdb_example", "status" => "done", "query" => "SELECT 1", "created_at" => "2016-03-21T12:04:55.527Z", "updated_at" => "2016-03-21T12:05:35.594Z" }]
    end

  end


  def stub_api_request(code, response_file)
    response = File.open(path_to(response_file)).read
    Typhoeus.stub(/.*cartodb.com\/api\/v2\/sql\/job/).and_return(
      Typhoeus::Response.new(code: code, body: response)
    )
  end

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end

  TEST_SQL_BATCH_API_CONFIG =  {:sql_api => {
      "batch" => {
        "protocol" =>   'http',
        "domain" => 'cartodb.com',
        "endpoint" =>  '/api/v2/sql/job',
        "port" =>       8080
      }
    }
  }

end
