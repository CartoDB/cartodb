module Carto
  module Api
    class PresenterCache

      def initialize
        @cache = Hash.new
      end

      # Caches to_poro of the presenter that is passed in a block, based on model class and id. Example:
      # cache.get_poro(user)  { Carto::Api::UserPresenter.new(user, { fetch_groups: false } ) }
      def get_poro(model)
        raise "no model given" unless model

        model_class = model.class
        model_id = model.id

        if model_id.nil?
          presenter = yield
          raise "no presenter given" if presenter.nil?
          return presenter.to_poro
        end

        class_cache = get_class_cache(model_class)

        unless class_cache[model_id]
          presenter = yield
          raise "no presenter given" if presenter.nil?
          class_cache[model_id] = presenter.to_poro
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
