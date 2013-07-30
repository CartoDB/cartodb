# encoding: utf-8
require_relative '../../../app/models/overlay/collection'

include CartoDB

describe Overlay::Collection do
  before do
    Overlay.repository = DataRepository.new
  end

  describe 'validations' do
    describe '#visualization_id' do
      it 'must be present' do
        collection = Overlay::Collection.new
        collection.valid?.should == false
        collection.errors.fetch(:visualization_id)
          .map(&:rule).map(&:class)
          .should include Aequitas::Rule::Presence::NotBlank
      end
    end #visualization_id
  end # validations
end # Overlay::Collection

