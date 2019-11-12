module CartoDB
  class PermissionOrganizationPresenter

    def decorate(org_id)
      org = Organization.where(id: org_id).first
      return {} if org.nil?
      {
          id:         org.id,
          name:       org.name,
          avatar_url: org.avatar_url
      }
    end

  end
end

