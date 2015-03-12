# encoding: utf-8

require_relative '../../../../spec_helper'

describe Api::Json::OembedController do

  describe '#private_url_methods_tests' do

    it 'Tests the methods that handle URL manipulation' do
      controller = Api::Json::OembedController.new

      url_fragments = []
      raise_on_error = true

      controller.send(:from_domainless_url, url_fragments, raise_on_error)

    end

  end

end
