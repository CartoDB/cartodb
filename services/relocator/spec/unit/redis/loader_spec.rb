# encoding: utf-8user
require 'minitest/autorun'

describe ThresholdData do
  before do
    user_id         = rand(999)
    @redis          = Redis.new
    @treshold_data  = ThresholdData.new(user_id, @redis)
  end

  describe '#transform'
    it 'transforms the keys changing user_id' do
      data = @threshold_data.transform(@sample_data)
      data.keys
    end
  end #transform

  describe '#load' do
    it 'loads the data into redis' do
      @threshold_data.load(@sample_data)
    end
  end #load
end # Relocator::Redis::Loader
