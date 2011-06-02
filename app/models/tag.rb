# coding: UTF-8

class Tag < Sequel::Model

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:name)

  def self.load_user_tags(user_id, options = {})
    options[:limit] ||= 5
    fetch("select tags.name, count(*) as count
                        from tags
                        where tags.user_id = ?
                        group by tags.name
                        order by count desc limit ?", user_id, options[:limit]).all.map{|t| t.values }
  end

  # TODO: V2
  # def self.load_public_tags(user_id, options = {})
  #   options[:limit] ||= 5
  #   fetch("select tags.name, count(*) as count
  #                       from tags
  #                       inner join user_tables on user_tables.id = tags.table_id and user_tables.privacy = #{Table::PUBLIC}
  #                       where tags.user_id != ?
  #                       group by tags.name
  #                       order by count desc limit ?", user_id, options[:limit]).all.map{|t| t.values }
  # end

end
