module LoggerControllerHelper

  extend ActiveSupport::Concern
  include ::LoggerHelper

  def log_rescue_from(hook_id, exception)
    log_info(message: 'Captured exception in rescue_from hook', exception: exception, hook_id: hook_id)
  end

  private

  def log_context
    {
      current_user: current_user&.username,
      request_id: request.uuid,
      controller: controller_id
    }.with_indifferent_access
  end

  def controller_id
    "#{self.class.name}##{action_name}"
  end

end
