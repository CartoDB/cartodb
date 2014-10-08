# encoding: utf-8

module CartoDB
  module Importer2
    class PostImportHandler

      TYPE_FIX_GEOMETRIES = 1

      def initialize
        @tasks = []
      end

      def clean
        @tasks = []
      end

      def add_fix_geometries_task(params={})
        add_task(TYPE_FIX_GEOMETRIES, params)
      end

      def has_fix_geometries_task?
        has_task?(TYPE_FIX_GEOMETRIES)
      end

      private

      def add_task(task_type, task_params={})
        @tasks.push({
                     type:   task_type,
                     params: task_params
                   }) unless has_task?(task_type)
      end

      def has_task?(task_type)
        @tasks.select{ |task|
          task[:type] == task_type
        }.count > 0
      end

      attr_accessor :tasks

    end
  end
end

