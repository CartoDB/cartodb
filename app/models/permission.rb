# encoding: utf-8

module CartoDB
  class Permission < Sequel::Model

    @id = nil
    @owner = nil
    @acl = []
    @updated_at = nil

    attr_accessor :id,
                  :owner

    def acl
      ::JSON.parse(acl)
    end

    def acl=
      @acl = ::JSON.dump(acl)
    end

    def validate
      super
      if new?
        #errors.add(:user_id, " already has an oauth token created for service #{:service}") unless existing_oauth.nil?
      else
      end
    end #validate

    def before_save
      super
      @updated_at = Time.now
    end

  end
end