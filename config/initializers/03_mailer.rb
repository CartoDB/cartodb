if Cartodb.config.present? && Cartodb.config[:action_mailer].present?
  Cartodb.config[:action_mailer].each do |method, value|
    value = value.to_sym if method.to_s == "delivery_method"
    ActionMailer::Base.send("#{method}=", value)
  end
end