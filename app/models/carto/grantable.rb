# encoding: utf-8

module Carto
  class Grantable

    attr_reader :id, :name, :type, :avatar_url

    def initialize(attributes)
      h = attributes.symbolize_keys
      @id = h[:id]
      @name = h[:name]
      @type = h[:type]
      @avatar_url = h[:avatar_url]
    end

  end
end
