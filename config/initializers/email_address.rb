# Previously we validated email domains against DNS records, but since we forced the email verification before
# provisioning users this is not needed anymore.
# Also, some user emails coming from SAML IDPs may have domains which don't have a corresponding DNS record
# https://app.clubhouse.io/cartoteam/story/145527/reef-set-up-sso#activity-146696
EmailAddress::Config.configure(local_format: :conventional, host_validation: :syntax)

class EmailValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return unless value

    if value.is_a?(Array)
      value.each { |v| validate_value(record, attribute, v) }
    else
      validate_value(record, attribute, value)
    end
  end

  private

  def validate_value(record, attribute, value)
    unless EmailAddress.valid?(value)
      record.errors[attribute] << (options[:message] || "#{value} is not a valid email")
    end
  end
end
