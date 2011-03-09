

    //////////////////////////////////////////////
    // Get last post from CartoDB Tumblr blog   //
    //////////////////////////////////////////////

    // head(function(){
    //   var tables_published = 0;
    //   var last_post = 0;
    // 
    //   if ($('section.prefooter').length>0) {
    //    $.getJSON("http://cartodb.tumblr.com/api/read/json?type=text&tagged=table_published&num=2&filter=text&callback=?",
    //      function(blog_posts) {
    //        $.each(blog_posts.posts, function(index,post){
    //          if (tables_published != 2) {
    //            var text = post["regular-body"].substr(0,200);
    //            if (post["regular-title"].length>53) {
    //               var title = post["regular-title"].substr(0,50) + '...';
    //             } else {
    //               var title = post["regular-title"];
    //             }
    //            if (tables_published==0) {
    //              $('section.prefooter div.block:eq(0) h4').html('<a href="'+post.url+'" target="_blank">'+title+'</a>');
    //              $('section.prefooter div.block:eq(0) p').html(text+'... <a href="'+post.url+'" target="_blank">Read more...</a>');
    //            } else {
    //              $('section.prefooter div.block:eq(1) h4').html('<a href="'+post.url+'" target="_blank">'+title+'</a>');
    //              $('section.prefooter div.block:eq(1) p').html(text+'... <a href="'+post.url+'" target="_blank">Read more...</a>');
    //            }
    //             tables_published++;
    //          } else {
    //            return false;
    //          }
    //        });
    //      }
    //    );
    //     $.getJSON("http://cartodb.tumblr.com/api/read/json?type=text&tagged=Post&num=1&filter=text&callback=?",
    //       function(blog_posts) {
    //       $.each(blog_posts.posts, function(index,post){
    //         var text = post["regular-body"].substr(0,200);
    //         if (post["regular-title"].length>53) {
    //           var title = post["regular-title"].substr(0,50) + '...';
    //         } else {
    //           var title = post["regular-title"];
    //         }
    //         if (last_post!=1) {
    //              $('section.prefooter div.block:eq(2) h4').html('<a href="'+post.url+'" target="_blank">'+title+'</a>');
    //              $('section.prefooter div.block:eq(2) p').html(text+'... <a href="'+post.url+'" target="_blank">Read more...</a>');
    //           last_post++;
    //         } else {
    //           return false;
    //          }
    //        });
    //      }
    //     );
    //   }
    // });