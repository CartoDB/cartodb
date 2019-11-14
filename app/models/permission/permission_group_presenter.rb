module CartoDB
  class PermissionGroupPresenter

    def decorate(group_id)
      group = Carto::Group.where(id: group_id).first
      return {} if group.nil?
      {
        id:         group.id,
        name:       group.name
      }
    end

  end
end

