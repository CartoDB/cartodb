module Doubles
  class Request

    def initialize(attributes={})
      @host = attributes.fetch(:host, '')
      @fullpath = attributes.fetch(:fullpath, '')
      @params = attributes.fetch(:params, {})
    end

    attr_reader :host, :params, :fullpath

  end
end

