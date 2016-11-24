# encoding: utf-8
require_relative '../../twitter-search'
require_relative '../../../../spec/rspec_configuration'

include CartoDB::TwitterSearch

describe JSONToCSVConverter do
  describe '#conversion' do
    it 'checks conversion of fields v1' do
      conversor = JSONToCSVConverter.new
      results = conversor.process(json_data_from_file('sample_tweets_v1.json'))
      results.should == data_from_file('sample_tweets_v1.csv')
    end

    it 'checks conversion of fields v2' do
      conversor = JSONToCSVConverter.new
      results = conversor.process(json_data_from_file('sample_tweets_v2.json'))
      results.should == data_from_file('sample_tweets_v2.csv')
    end

    it 'checks additional fields are added v1' do
      conversor = JSONToCSVConverter.new

      additional_fields = terms_fixture

      # without data
      results = conversor.process([], true, additional_fields)
      results.should eq data_from_file('empty_results_expected.csv')

      # And with data
      results = conversor.process(json_data_from_file('sample_tweets_v1.json'), true, additional_fields)
      results.should eq data_from_file('sample_tweets_additional_fields_v1.csv')
    end

    it 'checks additional fields are added v2' do
      conversor = JSONToCSVConverter.new

      additional_fields = terms_fixture

      # without data
      results = conversor.process([], true, additional_fields)
      results.should eq data_from_file('empty_results_expected.csv')

      # And with data
      results = conversor.process(json_data_from_file('sample_tweets_v2.json'), true, additional_fields)
      results.should eq data_from_file('sample_tweets_additional_fields_v2.csv')
    end

    it 'check headers can be skiped' do
      conversor = JSONToCSVConverter.new
      results = conversor.process([], false)
      results.should eq ''
    end
  end

  protected

  def json_data_from_file(filename, only_results=true)
    data = File.read(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"))
    data = ::JSON.parse(data, symbolize_names: true)
    only_results ? data[:results] : data
  end

  def data_from_file(filename)
    File.read(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"))
  end

  def terms_fixture
    { category_name: 'sample category', category_terms: 'term1 term2' }
  end
end
