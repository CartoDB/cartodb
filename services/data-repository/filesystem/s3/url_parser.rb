# encoding: utf-8
module DataRepository
  module Filesystem
    module S3
      class UrlParser
        def initialize(url)
          @url = url
        end #initialize

        def parse
          object_name = url.split('/').last
          bucket_name = url.split('/')[-2]
          [bucket_name, object_name]
        end #parse

        private

        attr_reader :url
      end # UrlParser
    end # S3 
  end # Filesystem
end # DataRepository

