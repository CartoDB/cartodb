# encoding: UTF-8

class Carto::AnalysisNode
  def initialize(definition)
    @definition = definition
  end

  attr_reader :definition

  def id
    definition[:id]
  end

  def type
    definition[:type]
  end

  def params
    definition[:params]
  end

  def options
    definition[:options]
  end

  def children
    children_and_location.values
  end

  def children_and_location
    @children ||= get_children(@definition)
  end

  def find_by_id(node_id)
    return self if node_id == id
    children.each do |child|
      found = child.find_by_id(node_id)
      return found unless found.nil?
    end
    nil
  end

  def source?
    type == 'source'
  end

  def table_source?(table_name)
    # Maybe check params[:query]
    source? && options && options[:table_name] == table_name
  end

  private

  MANDATORY_KEYS_FOR_ANALYSIS_NODE = [:id, :type, :params, :options].freeze
  def get_children(definition, path = [])
    children = definition.map do |k, v|
      if v.is_a?(Hash)
        this_path = path + [k]
        if (MANDATORY_KEYS_FOR_ANALYSIS_NODE - v.keys).empty?
          { this_path => Carto::AnalysisNode.new(v) }
        else
          get_children(v, this_path)
        end
      end
    end
    children.flatten.compact.reduce({}, :merge)
  end
end
