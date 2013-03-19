# encoding: utf-8
module DataRepository
  module Filesystem
    module S3
      class UrlParser
        def initialize(url)
          @url = URI(url)
        end #initialize

        def parse
          parts = url.path.split('/').delete_if { |part| part.empty? }
          bucket_name = parts.first
          object_name = parts[1..-1].join('/')
          [bucket_name, object_name]
        end #parse

        private

        attr_reader :url
      end # UrlParser
    end # S3 
  end # Filesystem
end # DataRepository

