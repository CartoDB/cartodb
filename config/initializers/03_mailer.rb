if APP_CONFIG[:action_mailer].present?
  APP_CONFIG[:action_mailer].each do |method, value|
    value = value.to_sym if method.to_s == "delivery_method"
    ActionMailer::Base.send("#{method}=", value)
  end
end