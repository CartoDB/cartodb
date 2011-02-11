
      /*==========================================================================================================================*/
      /*  																																																												*/
      /*				loaderQueue => Control loader of the table    .																																		*/
      /*  																																																												*/
      /*==========================================================================================================================*/

      	function loaderQueue () {
      		this.count = 0;
      		this.pendingOperations = [];
      		this.checking = false;
      		
      		//Create the loader element
          $('section.subheader').append('<div class="performing_op"></div>');
          
          this.loader = $('section.subheader div.performing_op');
      		
      		
      	}

      	/*========================================================================================================================*/
      	/*  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.newRequest = function(requestId, ok_msg, error_msg) {
      	  this.count++;
      	  this.pendingOperations[requestId] = new Object();
      	  this.pendingOperations[requestId].status = "pending";
      	  this.pendingOperations[requestId].ok = ok_msg;
      	  this.pendingOperations[requestId].error = error_msg;
      	  if (!this.checking) {
      	    console.log(this.loader);
      	    if (this.loader.html()=="") {
      	      this.loader.append('<p class="loading">Loading...</p>');
      	    }
      	    this.loader.children('p.loading').animate({opacity:1},200);
      	    this.checking = true;
      	    this.loopPendingOperations();
      	  }
      	}
      	
      	
      	/*========================================================================================================================*/
      	/*  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.responseRequest = function(requestId, status) {
      	  this.pendingOperations[requestId].status = status;
      	}
      	
      	
      	/*========================================================================================================================*/
      	/*  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.loopPendingOperations = function() {
      	  var me = this;
      	  
      	  for (var request in this.pendingOperations) {
      	    if (this.pendingOperations[request].status!="pending") {
      	      this.count--;
      	      this.showResult(this.pendingOperations[request]);
      	      delete this.pendingOperations[request];
        	    setTimeout(function(){me.loopPendingOperations()},1000);
      	      return false;
      	    }
      	  }
      	  if (this.count == 0) {
            this.loader.children('p').animate({opacity:0},300,function(){
        	    $(this).remove();
        	    if (me.count>0) {
        	      me.loader.append('<p class="loading">Loading...</p>');
        	      me.loader.children('p.loading').animate({opacity:1},200);
        	      me.checking = true;
        	      me.loopPendingOperations();
        	    } else {
        	      me.checking = false;
        	    }

            });
      	  } else {
            if (!me.loader.children('p').hasClass('loading')) {
              me.loader.children('p:eq(0)')
          	            .css('position','absolute')
          	            .css('bottom','0px')
          	            .css('left',0 + 'px')
          	            .css('zIndex','100');
              me.loader.children('p:eq(0)').animate({opacity:0},300,function(){
                $(this).remove();
              });
              me.loader.append('<p class="loading">Loading...</p>');
              me.loader.children('p:eq(1)').animate({opacity:1},200);
            }
      	    setTimeout(function(){me.loopPendingOperations()},50);
      	  }
      	}
      	
      	
      	/*========================================================================================================================*/
      	/*  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.showResult = function(data) {
      	  var element = '';
      	  
      	  if (this.count==0) {
      	    element = '<p class="'+((data.status!="ok")?'error':'success')+'">'+ ((data.status=="ok")?data.ok:data.error) +'</p>';
      	  } else {
      	    var text = ((data.status=="ok")?data.ok:data.error) + ', ';
      	    text += (this.count==1)?'there is '+ this.count + ' in the queue':'there are '+ this.count + ' in the queue';
      	    element = '<p class="'+((data.status!="ok")?'error':'success')+'">'+ text +'</p>';
      	  }
      	  
      	  var left_position = this.loader.children('p:eq(0)').position().left;
      	  console.log(left_position);
      	  this.loader.children('p:eq(0)')
      	            .css('position','absolute')
      	            .css('bottom','0px')
      	            .css('left',left_position + 'px')
      	            .css('zIndex','100');
      	  this.loader.children('p:eq(0)').animate({opacity:0},800,function(){$(this).remove();});
      	  
      	  this.loader.append(element);
      	  var width = this.loader.children('p:eq(1)').width();
      	  this.loader.children('p:eq(1)').css('margin','0 0 0 '+ ((650-width)/2) +'px');
      	  this.loader.children('p:eq(1)').animate({opacity:1},400);
      	}

      	
      	
      	
      	
      	function test1() {
      	  requests_queue.newRequest("a", "The row 'J' column 'P' has been updated","The row 'J' column 'P' hasn't been updated");
          requests_queue.newRequest("b", "The tags has been updated","The tags hasn't been updated");
          requests_queue.newRequest("c", "Table name updated","Sorry, table name update error");
          requests_queue.newRequest("d", "The row 'J' column 'P' has been updated","The row 'J' column 'P' hasn't been updated");
      	}

        function test2() {
          requests_queue.responseRequest('b','ok');
          setTimeout(function(){requests_queue.responseRequest('a','error');},15000)
          requests_queue.responseRequest('d','ok');
          requests_queue.responseRequest('c','error');
        }