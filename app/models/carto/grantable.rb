# encoding utf-8

module Carto
  class Grantable

    attr_reader :id, :name, :type

    def initialize(attributes)
      h = attributes.symbolize_keys
      @id = h[:id]
      @name = h[:name]
      @type = h[:type]
    end

  end
end

