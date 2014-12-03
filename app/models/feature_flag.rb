# coding: UTF-8

# Feature flags are synchronized through API, so there's no need for validation
class FeatureFlag < Sequel::Model
  include CartoDB::MiniSequel

  # @param name       String
  # @param restricted boolean

end 
