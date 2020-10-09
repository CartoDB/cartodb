class BasePresenter

  attr_accessor :object, :params

  def self.object_klass
    raise 'Must be overriden in child class'
  end

  def self.delegated_methods
    object_klass.columns.map(&:name).map(&:to_sym) + (object_klass.instance_methods - Object.methods)
  end

  def initialize(object, params = {})
    @object = object
    @params = params
  end

end
