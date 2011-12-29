
      /*==========================================================================================================================*/
      /*  																																																												*/
      /*				loaderQueue => Control loader of the table    .																																		*/
      /*  																																																												*/
      /*==========================================================================================================================*/

      	function loaderQueue () {
      		this.count = 0;
      		this.pendingOperations = [];
      		this.checking = false;
      		var me = this,
      		    interval,
      		    count_interval = 0;
      		
      		//Create the loader element
      		$('section.subheader').append('<div class="performing_op"><p class="loading">Loading...</p></div>');
          this.loader = $('section.subheader div.performing_op');
      	}

      	/*========================================================================================================================*/
      	/*  Add new request to the loader queue  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.newRequest = function(requestId,type) {
      	  this.count++;
      	  this.pendingOperations[requestId] = new Object();
      	  this.pendingOperations[requestId].status = "pending";
      	  this.pendingOperations[requestId].type = type;
      	  if (!this.checking) {
      	    if (this.loader.html()=="") {
      	      if (this.georeferencing) {
        	      this.loader.append('<p class="loading" style="text-align:center">Georeferencing... <strong style="opacity:0">'+this.georeferencing.total+'/</strong>'+this.georeferencing.total+'</p>');
      	      } else {
        	      this.loader.append('<p class="loading">Loading...</p>');
      	      }
      	    } else {
      	      this.loader.children('p').each(function(index,element){
      	        if (!$(element).hasClass('loading')) {
      	          $(element).remove();
      	        }
      	      });
      	    }
      	    
      	    var width = this.loader.find('p.loading').width() + 42;
      	    this.loader.children('p').show();
      	    this.loader.css('width',width+'px');
            this.loader.css('backgroundColor',!this.georeferencing?'#FFEAA4':'#FFAA00');
            this.loader.css('margin','0 0 0 -'+(width/2)+'px');
            this.loader.find('p.loading').css('margin','0 0 0 -'+(width/2)+'px');
            this.loader.animate({height:30,opacity:1},200,function(){
       	      $(this).css('borderBottom','1px solid #D0C090');
       	    });
      	    this.loader.animate({height:30,opacity:1},200,function(){
      	      $(this).css('borderBottom','1px solid #D0C090');
      	    });
      	    this.checking = true;
      	    if (this.count==1) {
        	    this.loopPendingOperations();
      	    }
      	  }
      	}
      	
      	
      	/*========================================================================================================================*/
      	/*  Abstract georeferencing  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.startGeoreferencing = function(geo_id,total) {
      	  this.georeferencing = {id:geo_id,total: total || 0,actual:0,showed:false,finished:false};
      	  this.newRequest(geo_id,'georeferencing');
      	}
      	
      	loaderQueue.prototype.updateGeoreferencing = function(total) {
      	  if (total) {
            this.georeferencing.total = total || this.georeferencing.total;
      	  } else {
            this.georeferencing.actual++;
      	  }
          this.loader.find('p.loading').html('Geolocating...  <strong style="text-align:right">'+this.georeferencing.actual+'/'+this.georeferencing.total+'</strong>');
      	}
      	
      	loaderQueue.prototype.finishGeoreferencing = function() {
      	  this.georeferencing.finished = true;
          this.responseRequest(this.georeferencing.id,'ok','');
      	}
      	
      	loaderQueue.prototype.stopGeoreferencing = function() {
          this.responseRequest(this.georeferencing.id,'error','geolocation was stopped');
          this.georeferencing = null;
      	}
 
      	
      	
      	/*========================================================================================================================*/
      	/*  Change the request to "arrive" and change the status  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.responseRequest = function(requestId, status, error) {
      	  if (this.pendingOperations[requestId]!=undefined) {
      	    this.pendingOperations[requestId].status = status;
        	  this.pendingOperations[requestId].error = error;
      	  }
      	}
      	
      	
      	/*========================================================================================================================*/
      	/*  Loop for get pending operations  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.loopPendingOperations = function() {
      	  var me = this;
      	  
      	  for (var request in this.pendingOperations) {
      	    if (this.pendingOperations[request].status!="pending") {
      	      this.count--;
      	      this.showResult(this.pendingOperations[request]);
      	      delete this.pendingOperations[request];
        	    setTimeout(function(){me.loopPendingOperations()},2000);
      	      return false;
      	    }
      	  }
      	        	  
      	  if (this.count == 0) {
      	    var delay = 0;
      	    if (this.last_action == "georeferencing") {
      	      this.last_action = '';
      	      this.georeferencing = null;
      	      delay = 4000;
      	    }
      	    
            this.loader.delay(delay).animate({height:0},300,function(){
              $(this).css('borderBottom','none');
              $(this).children('p:eq(0)').remove();
              if (me.count>0) {
                me.loader.append('<p class="loading">Loading...</p>');
                me.loader.css('width','100px');
                me.loader.css('margin','0 0 0 -50px');
                me.loader.css('backgroundColor','#FFEAA4');
                me.loader.animate({height:30,opacity:1},200,function(){
          	      $(this).css('borderBottom','1px solid #D0C090');
          	    });
                me.checking = true;
                me.loopPendingOperations();
              } else {
                me.checking = false;
              }
            });
         
      	  } else {
            if (me.loader.find('p.loading').length==0) {
              var loading_text = 'Loading...';
              if (this.georeferencing!=null) {
                loading_text = 'Geolocating...'+this.georeferencing.actual+'/'+this.georeferencing.total;
              }
              var element = $('<p class="loading">'+loading_text+'</p>');
          	  element.css('top','30px');
          	  element.css('opacity','0');
          	  this.loader.append(element);

          	  var element_width = element.width();

          	  this.loader.animate({
          	    backgroundColor:!me.georeferencing?'#FFEAA4':'#FFAA00',
          	    borderBottomColor:!me.georeferencing?'#D0C090':'#FF9900',
          	    width: element_width+44+'px',
          	    marginLeft: '-'+(element_width/2)+'px',
          	  },200);

          	  this.loader.children('p:eq(0)').animate({top:'-20px',opacity:0},600,function(){$(this).remove()});
          	  this.loader.children('p:eq(1)').css("marginLeft",'-'+((element_width+44)/2)+'px');
          	  this.loader.children('p:eq(1)').animate({top:'0',opacity:1},700);
            }
      	    setTimeout(function(){me.loopPendingOperations()},(this.georeferencing)?1000:100);
      	  }
      	}
      	
      	
      	/*========================================================================================================================*/
      	/*  Show the result of the request  */
      	/*========================================================================================================================*/
      	loaderQueue.prototype.showResult = function(data) {
      	  this.last_action = (data.status=="ok")?data.type:'';
      	  var element = $('<p>'+ ((data.status=="ok")? loadingMessages[data.type] :data.error) +'</p>');
      	  element.css('top','30px');
      	  element.css('opacity','0');
      	  this.loader.append(element);
      	  
      	  var new_element_width = element.width();
      	  var old_element_width = this.loader.children('p:eq(0)').width();

      	  this.loader.animate({
      	    backgroundColor:((data.status!="ok")?'#D0878E':'#99CC66'),
      	    borderBottomColor:((data.status!="ok")?'#FFA3A9':'#A5BB93'),
      	    width: new_element_width+24+'px',
      	    marginLeft: '-'+(new_element_width/2)+'px',
      	  },200);
      	  
      	  if (this.loader.children('p:eq(0)').hasClass('loading')) {
        	  this.loader.children('p:eq(0)').css("marginLeft",'-'+((old_element_width+44)/2)+'px');
      	  } else {
        	  this.loader.children('p:eq(0)').css("marginLeft",'-'+((old_element_width+24)/2)+'px');
      	  }
      	  
      	  this.loader.children('p:eq(0)').animate({top:'-20px',opacity:0},600,function(){$(this).remove()});
      	  this.loader.children('p:eq(1)').css("marginLeft",'-'+((new_element_width+24)/2)+'px');
      	  this.loader.children('p:eq(1)').animate({top:'0',opacity:1},700);
      	}
        