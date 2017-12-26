module CartoGearsApi
  module Queue
    class JobsService
      # Sends a job to the queue. Example:
      #     `CartoGearsApi::Queue::JobsService.new.send_job('MyModule::MyClass', :class_method, 'param1', 2)`
      # @param class_name [String] Name of the class that will be run in the queue.
      # @param class_method [String] Name of the class method (not instance method) to call.
      # @param args Arguments to be sent send to the class method. This will be be serialized and passed
      #     over to the job at the queue, so don't use models here. Instead, use simple types and perform searches in
      #     the job if needed.
      def send_job(class_name, method, *args)
        ::Resque.enqueue(CartoGearsApi::Queue::GenericJob, class_name, method, *args)
      end
    end
  end
end
