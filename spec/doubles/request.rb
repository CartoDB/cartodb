# encoding: utf-8

module Doubles
  class Request

    def initialize(attributes={})
      @host = attributes.fetch(:host, '')
      @params = attributes.fetch(:params, {})
    end

    attr_reader :host, :params

  end
end

