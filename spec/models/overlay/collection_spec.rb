# encoding: utf-8
require 'minitest/autorun'
require_relative '../../../app/models/overlay/collection'

include CartoDB

describe Overlay::Collection do
  describe 'validations' do
    describe '#visualization_id' do
      it 'must be present' do
        collection = Overlay::Collection.new
        collection.valid?.must_equal false
        collection.errors.fetch(:visualization_id)
          .map(&:rule).map(&:class)
          .must_include Aequitas::Rule::Presence::NotBlank
      end
    end #visualization_id
  end # validations
end # Overlay::Collection

