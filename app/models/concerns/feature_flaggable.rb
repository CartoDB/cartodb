module Concerns
  module FeatureFlaggable

    def data(options = {})
      return {} if !defined?(super)
        
      super_data = super(options)
      super_data[:feature_flags] = feature_flags
      super_data
    end

    def feature_flags
      @feature_flags ||= get_feature_flags rescue []
    end

    def has_feature_flag?(feature_flag)
      feature_flags.includes?(feature_flag)
    end

    private
    def get_feature_flags
      if sync_data_with_cartodb_central?
        cartodb_central_client.get_feature_flags(self.username)
      else
        (Cartodb.config[:user_feature_flags][username] + Cartodb.config[:feature_flags].select { |name, properties| !properties[:restricted] }.map { |k, v| k }).uniq.sort
      end
    end

  end

end
