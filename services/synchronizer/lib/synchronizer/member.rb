# encoding: utf-8

module CartoDB
  module Synchronizer
    class Member
      def initialize(attributes={})
        @attributes = attributes
      end

      def run
        self
      end
    end # Member
  end # Synchronizer
end # CartoDB

