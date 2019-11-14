require_dependency 'carto/query_rewriter'

class Carto::AnalysisNode
  include Carto::QueryRewriter

  def initialize(definition)
    @definition = definition
  end

  attr_reader :definition

  def self.find_by_natural_id(visualization_id, natural_id)
    analyses = Carto::Analysis.where(visualization_id: visualization_id).all
    analyses.lazy.map { |analysis| analysis.analysis_node.find_by_id(natural_id) }.find(&:present?)
  end

  def id
    definition[:id]
  end

  def type
    definition[:type]
  end

  def params
    definition[:params]
  end

  def non_child_params
    param_locations = children_and_location.keys.select { |cal| cal.first == :params }.map(&:second)
    params && params.reject { |key| param_locations.include?(key) }
  end

  def options
    definition[:options] ||= Hash.new
  end

  def children
    children_and_location.values
  end

  def children_and_location
    @children ||= get_children(@definition)
  end

  def find_by_id(node_id)
    return self if node_id == id
    children.lazy.map { |child| child.find_by_id(node_id) }.find { |child| child }
  end

  def source?
    type == 'source'
  end

  def table_source?(table_name)
    # Maybe check params[:query]
    source? && options && options[:table_name] == table_name
  end

  def source_descendants
    return [self] if source?
    children.map(&:source_descendants).flatten
  end

  def descendants
    [self] + children.map(&:descendants).flatten
  end

  def fix_analysis_node_queries(old_username, new_user, renamed_tables)
    if options && options.key?(:table_name)
      old_table_name = options[:table_name]
      old_username, old_table_name = old_table_name.split('.') if old_table_name.include?('.')
      options[:table_name] = renamed_tables.fetch(old_table_name, old_table_name)
    end

    if params && old_username
      query = params[:query]
      params[:query] = rewrite_query(query, old_username, new_user, renamed_tables) if query.present?
    end

    children.each { |child| child.fix_analysis_node_queries(old_username, new_user, renamed_tables) }
  end

  private

  MANDATORY_KEYS_FOR_ANALYSIS_NODE = [:id, :type, :params].freeze
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
