# encoding: utf-8

module Carto
  module Api
    class PresenterCache

      def initialize
        @cache = Hash.new
      end

      def get(model_class, model_id)
        return yield if model_class.nil? || model_id.nil?

        class_cache = get_class_cache(model_class)

        unless class_cache[model_id]
          class_cache[model_id] = yield
        end

        class_cache[model_id]
      end

      private

      def get_class_cache(model_class)
        unless @cache[model_class]
          @cache[model_class] = Hash.new
        end
        @cache[model_class]
      end

    end
  end
end
