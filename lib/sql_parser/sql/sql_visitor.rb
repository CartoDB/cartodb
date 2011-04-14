module SQL
  class SQLVisitor
    def initialize
      @negated = false
    end

    def visit(node)
      node.accept(self)
    end

    def visit_DirectSelect(o)
      [
        o.query_expression,
        o.order_by
      ].compact.collect { |e| visit(e) }.join(' ')
    end

    def visit_OrderBy(o)
      "ORDER BY #{arrayize(o.sort_specification)}"
    end

    def visit_Subquery(o)
      "(#{visit(o.query_specification)})"
    end

    def visit_Select(o)
      # FIXME: This feels like a hack
      initialize

      "SELECT #{visit_all([o.list, o.table_expression].compact).join(' ')}"
    end

    def visit_SelectList(o)
      arrayize(o.columns)
    end

    def visit_Distinct(o)
      "DISTINCT(#{visit(o.column)})"
    end

    def visit_All(o)
      '*'
    end

    def visit_TableExpression(o)
      [
        o.from_clause,
        o.where_clause,
        o.group_by_clause,
        o.having_clause
      ].compact.collect { |e| visit(e) }.join(' ')
    end

    def visit_FromClause(o)
      "FROM #{arrayize(o.tables)}"
    end

    def visit_OrderClause(o)
      "ORDER BY #{arrayize(o.columns)}"
    end

    def visit_Ascending(o)
      "#{visit(o.column)} ASC"
    end

    def visit_Descending(o)
      "#{visit(o.column)} DESC"
    end

    def visit_HavingClause(o)
      "HAVING #{visit(o.search_condition)}"
    end

    def visit_GroupByClause(o)
      "GROUP BY #{arrayize(o.columns)}"
    end

    def visit_WhereClause(o)
      "WHERE #{visit(o.search_condition)}"
    end

    def visit_On(o)
      "ON #{visit(o.search_condition)}"
    end

    def visit_Using(o)
      "USING (#{arrayize(o.columns)})"
    end

    def visit_Or(o)
      search_condition('OR', o)
    end

    def visit_And(o)
      search_condition('AND', o)
    end

    def visit_Exists(o)
      if @negated
        "NOT EXISTS #{visit(o.table_subquery)}"
      else
        "EXISTS #{visit(o.table_subquery)}"
      end
    end

    def visit_Is(o)
      if @negated
        comparison('IS NOT', o)
      else
        comparison('IS', o)
      end
    end

    def visit_Like(o)
      if @negated
        comparison('NOT LIKE', o)
      else
        comparison('LIKE', o)
      end
    end

    def visit_In(o)
      if @negated
        comparison('NOT IN', o)
      else
        comparison('IN', o)
      end
    end

    def visit_InValueList(o)
      "(#{arrayize(o.values)})"
    end

    def visit_Between(o)
      if @negated
        "#{visit(o.left)} NOT BETWEEN #{visit(o.min)} AND #{visit(o.max)}"
      else
        "#{visit(o.left)} BETWEEN #{visit(o.min)} AND #{visit(o.max)}"
      end
    end

    def visit_GreaterOrEquals(o)
      comparison('>=', o)
    end

    def visit_LessOrEquals(o)
      comparison('<=', o)
    end

    def visit_Greater(o)
      comparison('>', o)
    end

    def visit_Less(o)
      comparison('<', o)
    end

    def visit_Equals(o)
      if @negated
        comparison('<>', o)
      else
        comparison('=', o)
      end
    end

    def visit_Sum(o)
      aggregate('SUM', o)
    end

    def visit_Minimum(o)
      aggregate('MIN', o)
    end

    def visit_Maximum(o)
      aggregate('MAX', o)
    end

    def visit_Average(o)
      aggregate('AVG', o)
    end

    def visit_Count(o)
      aggregate('COUNT', o)
    end

    def visit_CrossJoin(o)
      "#{visit(o.left)} CROSS JOIN #{visit(o.right)}"
    end

    def visit_InnerJoin(o)
      qualified_join('INNER', o)
    end

    def visit_LeftJoin(o)
      qualified_join('LEFT', o)
    end

    def visit_LeftOuterJoin(o)
      qualified_join('LEFT OUTER', o)
    end

    def visit_RightJoin(o)
      qualified_join('RIGHT', o)
    end

    def visit_RightOuterJoin(o)
      qualified_join('RIGHT OUTER', o)
    end

    def visit_FullJoin(o)
      qualified_join('FULL', o)
    end

    def visit_FullOuterJoin(o)
      qualified_join('FULL OUTER', o)
    end

    def visit_Table(o)
      quote(o.name)
    end

    def visit_QualifiedColumn(o)
      "#{visit(o.table)}.#{visit(o.column)}"
    end

    def visit_Column(o)
      quote(o.name)
    end

    def visit_As(o)
      "#{visit(o.value)} AS #{visit(o.column)}"
    end

    def visit_Multiply(o)
      arithmetic('*', o)
    end

    def visit_Divide(o)
      arithmetic('/', o)
    end

    def visit_Add(o)
      arithmetic('+', o)
    end

    def visit_Subtract(o)
      arithmetic('-', o)
    end

    def visit_Not(o)
      negate { visit(o.value) }
    end

    def visit_UnaryPlus(o)
      "+#{visit(o.value)}"
    end

    def visit_UnaryMinus(o)
      "-#{visit(o.value)}"
    end

    def visit_True(o)
      'TRUE'
    end

    def visit_False(o)
      'FALSE'
    end

    def visit_Null(o)
      'NULL'
    end

    def visit_CurrentUser(o)
      'CURRENT_USER'
    end

    def visit_DateTime(o)
      "'%s'" % escape(o.value.strftime('%Y-%m-%d %H:%M:%S'))
    end

    def visit_Date(o)
      "DATE '%s'" % escape(o.value.strftime('%Y-%m-%d'))
    end

    def visit_String(o)
      "'%s'" % escape(o.value)
    end

    def visit_ApproximateFloat(o)
      "#{visit(o.mantissa)}E#{visit(o.exponent)}"
    end

    def visit_Float(o)
      o.value.to_s
    end

    def visit_Integer(o)
      o.value.to_s
    end

    private

    def negate
      @negated = true
      yield
    ensure
      @negated = false
    end

    def quote(str)
      "`#{str}`"
    end

    def escape(str)
      str.gsub(/'/, "''")
    end

    def arithmetic(operator, o)
      search_condition(operator, o)
    end

    def comparison(operator, o)
      [visit(o.left), operator, visit(o.right)].join(' ')
    end

    def search_condition(operator, o)
      "(#{visit(o.left)} #{operator} #{visit(o.right)})"
    end

    def visit_all(nodes)
      nodes.collect { |e| visit(e) }
    end

    def arrayize(arr)
      visit_all(arr).join(', ')
    end

    def aggregate(function_name, o)
      "#{function_name}(#{visit(o.column)})"
    end

    def qualified_join(join_type, o)
      "#{visit(o.left)} #{join_type} JOIN #{visit(o.right)} #{visit(o.search_condition)}"
    end
  end
end
