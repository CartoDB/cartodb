module CartoDB
  class PermissionOrganizationPresenter

    def decorate(org_id)
      org = Carto::Organization.find_by(id: org_id)
      return {} if org.nil?
      {
          id:         org.id,
          name:       org.name,
          avatar_url: org.avatar_url
      }
    end

  end
end
