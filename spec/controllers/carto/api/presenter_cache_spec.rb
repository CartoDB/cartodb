# encoding: utf-8

require_relative '../../../../app/controllers/carto/api/presenter_cache'

describe Carto::Api::PresenterCache do

  describe '#get' do

    let(:cache) { Carto::Api::PresenterCache.new }
    let(:model_class) { String }
    let(:model_class_b) { Hash }
    let(:model_id) { 'fake_id' }
    let(:model_id_b) { 'fake_id_2' }

    it 'throws an error if no block is provided' do
      expect { cache.get(model_class, model_id) }.to raise_error(/no block given \(yield\)/)
    end

    it 'returns block value for non-cached classes or ids' do
      value = 'a'
      cache.get(model_class, model_id) { value } .should == value
      cache.get(model_class, model_id_b) { value } .should == value
    end

    it 'returns cached value for cached classes and ids' do
      value = 'b'
      cache.get(model_class, model_id) { value } .should == value
      # Block is ignored
      cache.get(model_class, model_id) { value + value } .should == value
    end

    it 'does not cache for nil classes or ids' do
      value = 'c'
      value_b = 'd'
      cache.get(nil, nil) { value } .should == value
      cache.get(nil, nil) { value_b } .should == value_b
      cache.get(model_class, nil) { value } .should == value
      cache.get(model_class, nil) { value_b } .should == value_b
    end

    it 'does not cache nil values' do
      cache.get(model_class, model_id) { nil }.should == nil
      cache.get(model_class, model_id) { 'a' }.should == 'a'
    end

  end

end
