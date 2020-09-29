class BasePresenter

  attr_accessor :object, :params

  def initialize(object, params = {})
    @object = object
    @params = params
  end

  def method_missing(*args, &block)
    object.send(*args, &block)
  end

  def respond_to_missing?(method_name, _include_private = false)
    object.respond_to?(method_name)
  end

end
