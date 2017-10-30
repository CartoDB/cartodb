module Carto
  def self.deep_freeze(obj)
    obj.freeze
    obj = obj.values if obj.respond_to?(:values)
    obj.each { |e| Carto.deep_freeze(e) } if obj.respond_to?(:each)
  end
end
