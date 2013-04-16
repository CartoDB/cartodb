# encoding: utf-8
require 'minitest/autorun'
require 'ostruct'
require_relative '../../../app/models/overlay/presenter'

include CartoDB

describe Overlay::Presenter do
  describe '#to_poro' do
    it 'renders a hash representation of an overlay' do
      overlay = OpenStruct.new(
        order:    1,
        type:     'zoom',
        options:  {}
      )

      representation = Overlay::Presenter.new(overlay).to_poro

      representation.fetch(:order)    .must_equal overlay.order
      representation.fetch(:type)     .must_equal overlay.type
      representation.fetch(:options)  .must_equal overlay.options
    end
  end #to_poro
end # CartoDB

