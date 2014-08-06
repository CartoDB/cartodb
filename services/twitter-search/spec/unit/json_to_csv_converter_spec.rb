# encoding: utf-8
require_relative '../../twitter-search'

include CartoDB::TwitterSearch

describe JSONToCSVConverter do
  describe '#conversion' do
    it 'checks conversion of fields' do
      conversor = JSONToCSVConverter.new

      data = data_from_file('sample_tweets.json')

      puts "-------------"
      puts conversor.process([data.first])
      puts "-------------"


    end
  end

  protected

  def data_from_file(filename, only_results=true)
    data = File.read(File.join(File.dirname(__FILE__), "../fixtures/#{filename}"))
    data = ::JSON.parse(data, symbolize_names: true)
    only_results ? data[:results] : data
  end
end

