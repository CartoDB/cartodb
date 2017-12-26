# encoding: utf-8
require_relative '../../../simplecov_helper'
require_relative '../../../../app/controllers/carto/api/presenter_cache'

class Carto::Api::FakeModel
  attr_reader :id

  def initialize(id = rand(100000))
    @id = id
  end
end

class Carto::Api::FakePresenter
  def initialize(model)
    @model = model
  end

  def to_poro
    { id: @model.id }
  end
end

describe Carto::Api::PresenterCache do

  describe '#get_poro' do

    let(:cache) { Carto::Api::PresenterCache.new }

    let(:fake_model) { Carto::Api::FakeModel.new }
    let(:fake_model_b) { Carto::Api::FakeModel.new }
    let(:fake_model_idless) { Carto::Api::FakeModel.new(nil) }

    let(:fake_presenter) { Carto::Api::FakePresenter.new(fake_model) }
    let(:fake_presenter_b) { Carto::Api::FakePresenter.new(fake_model_b) }

    it 'throws an error if no block is provided' do
      expect { cache.get_poro(fake_model) }.to raise_error(/no block given \(yield\)/)
    end

    it 'returns block presenter.to_poro for non-cached models' do
      cache.get_poro(fake_model) { fake_presenter }.should == fake_presenter.to_poro
      cache.get_poro(fake_model_b) { fake_presenter_b }.should == fake_presenter_b.to_poro
    end

    it 'returns cached presenter.to_poro for cached classes and ids' do
      cache.get_poro(fake_model) { fake_presenter }.should == fake_presenter.to_poro
      # Block is ignored
      cache.get_poro(fake_model) { fake_presenter_b }.should == fake_presenter.to_poro
    end

    it 'raises error with nil models' do
      expect { cache.get_poro(nil) }.to raise_error(/no model given/)
    end

    it 'does not cache if model.id is nil' do
      cache.get_poro(fake_model_idless) { fake_presenter }.should == fake_presenter.to_poro
      cache.get_poro(fake_model_idless) { fake_presenter_b }.should == fake_presenter_b.to_poro
    end

    it 'raises error for nil presenters' do
      expect { cache.get_poro(fake_model) { nil } }.to raise_error(/no presenter given/)
      expect { cache.get_poro(fake_model_idless) { nil } }.to raise_error(/no presenter given/)
    end

    it 'does not raise error for nil presenter if it was cached' do
      cache.get_poro(fake_model) { fake_presenter }.should == fake_presenter.to_poro
      cache.get_poro(fake_model) { nil }.should == fake_presenter.to_poro
    end

  end

end
