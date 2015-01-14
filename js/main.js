var time_shift_value = 0;

$('document').ready(function() {
  // Create some global variables.
  var $timer_containers_wrapper;
  var favicon = new Favico({
    animation: 'slide',
    bgColor : '#F14040',
    textColor : '#F14040',
  });
  // All the actual mechanics.
  app = {
    // function_name : function() {},
    start : function() {
      $timer_containers_wrapper = $('#containers-wrapper');
      var stored_data = app.load_stored_data('interface_state');
      if (stored_data) {
        $timer_containers_wrapper.html(stored_data);
        app.init_loaded_timers();
      }
      app.add_help_button();
      app.add_total_button();
      app.add_global_stop();
      app.add_clear_button();
      app.add_container_button();
      app.init_confirm_dialog();
      app.change_page_title('Timer');
      app.autosave();
    },

    autosave : function() {
      $elements = $(document.body);
      $elements.add('form');
      $elements.click(function() {
        app.save_state();
      });
    },

    load_stored_data : function(key) {
      if ((typeof localStorage.getItem(key) != undefined) && (localStorage.getItem(key) != null) && (localStorage.getItem(key) != "null") && (localStorage.getItem(key) != "")) {
        return localStorage.getItem(key);
      }
      else return false;
    },

    init_loaded_timers : function() {
      $timers = $('.timer');
      var i = 0;
      $timers.each(function() {
        var start_at = app.parse_time(this);
        i++;
        app.add_new_timer(i, $timers, start_at);
      });
      app.create_container();
      var now = localStorage.getItem('interface_save_time');
      $('#last-saved').html('Saved: ' + now.toString());
      $('.timer').last().parent().remove();
    },

    init_confirm_dialog : function() {
      $('#main-content').append(confirm_dialog_html.html);
      $('#dialog-confirm').hide();
      $('#main-content').append(confirm_dialog_all_html.html);
      $('#dialog-confirm-all').hide();
      $('#main-content').append(edit_dialog_html.html);
      $('#dialog-edit').hide();
    },

    parse_time : function($timer_value) {
      // Need to parse the HTML string and turn it into a millisecond value.
      var start_at = $($timer_value).html();
      var time_components = start_at.split(':');
      for (var j = 0; j < time_components.length; j++) {
        time_components[j] = parseInt(time_components[j]);
      }
      // Figure out what we're looking at here.
      if (time_components.length == 1) {
        // Seconds.
        start_at = time_components[0] * 1000;
      }
      else if (time_components.length == 2) {
        // Minutes and seconds.
        start_at = time_components[0] * 60;
        start_at += time_components[1];
        start_at = start_at * 1000;
      }
      else if (time_components.length == 3) {
        // Hours, minutes and seconds.
        // Hours -> seconds.
        start_at = time_components[0] * 3600;
        // Minutes -> seconds.
        start_at += time_components[1] * 60;
        // Seconds.
        start_at += time_components[2];
        // Milliseconds.
        start_at = start_at * 1000;
      }
      else {
        // Days, hours, minutes, seconds.
        // Days -> seconds.
        start_at = time_components[0] * 24 * 3600;
        // Hours -> seconds.
        start_at = time_components[1] * 3600;
        // Minutes -> seconds.
        start_at += time_components[2] * 60;
        // Seconds.
        start_at += time_components[3];
        // Milliseconds.
        start_at = start_at * 1000;
      }
      return start_at;
    },

    add_help_button : function() {
      $('#main-content').prepend(help_html.button);
      $('#main-content').append(help_html.html);
      $('#help-text').hide();
      $('#help-button').click(function(e) {
        e.preventDefault();
        var dialog_width = window.innerWidth * 0.8;
        $('#help-text').dialog({ width: dialog_width });
      });
    },

    add_container_button : function() {
      $('#main-content').prepend(add_container_button_html.html);
      $('#add-container-button').click(function(e) {
        e.preventDefault();
        app.create_container(true);
      });
    },

    add_global_stop : function() {
      $('#main-content').prepend(global_stop_button_html.html);
      $('#global-stop-button').click(function(e) {
        e.preventDefault();
        app.stop_all_timers();
        app.deactivate_all_containers();
      });
    },

    add_clear_button : function() {
      $('#main-content').prepend(global_clear_button_html.html);
      $('#global-clear-button').click(function(e) {
        // Destroy all timers and clear storage.
        var $timers = $('#containers-wrapper li');
        app.confirm_delete_all_dialog($timers);
      });
    },

    add_total_button : function() {
      $('#main-content').prepend(global_total_button_html.html);
      $('#global-total-button').click(function(e) {
        // Add up the value of all timers.
        // Get all timers.
        var $timers = $('.timer-container .timer');
        var total_time = 0;
        // Get values.
        $timers.each(function() {
          // Parse values.
          var this_time = app.parse_time(this);
          // Sum.
          total_time += this_time;
        });
        // Format time.
        // The total is in milliseconds. Convert to seconds.
        total_time = total_time/1000;
        var time_string = total_time.toString();
        var formatted_time = time_string.toHHMMSS();
        $('#total-time').html('Total timed: ' + formatted_time);
      });
    },

    create_container : function(create) {
      // Create a new timer container.
      $timer_containers_wrapper.append(container_html.html);
      // Ensure the containers are sortable.
      // Do it each time to refresh the collection.
      $( "#containers-wrapper" ).sortable();
      // Set up cached collections.
      var $titles = $('.timer-container .title');
      var $containers = $('.timer-container');
      var $timers = $('.timer-container .timer');
      // Stop running timers
      $timers.each(function() {
        $(this).runner('stop');
      });
      // Set up the new container.
      app.set_default_title($titles.length, $titles);
      app.add_new_timer($timers.length, $timers);
      // Ensure the titles are editable.
      $titles.each ( function() {
        $(this)[0].onmousedown = function(e) {
          this.focus();
          $(this).selectText();
          $(this).keypress(function( event ) {
            if (event.which == 13) {
              event.preventDefault();
              app.clear_selection();
              app.select_container($(this).parent());
            }
          });
        };

        $(this).blur(function() {
          if (window.getSelection) {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(this);
            selection.removeAllRanges();
          }
        });
      });
    },

    clear_selection: function() {
      var sel;
      if ( (sel = document.selection) && sel.empty ) {
        sel.empty();
      }
      else {
        if (window.getSelection) {
          window.getSelection().removeAllRanges();
        }
        var activeEl = document.activeElement;
        if (activeEl) {
          var tagName = activeEl.nodeName.toLowerCase();
          if ( tagName == "textarea" ||
             (tagName == "input" && activeEl.type == "text") ) {
            // Collapse the selection to the end
            activeEl.selectionStart = activeEl.selectionEnd;
          }
        }
      }
    },

    select_container : function(elem) {
      app.stop_all_timers();
      app.deactivate_all_containers();
      // Check for active merge function.
      if ($('.merge.button.pressed').length > 0) {
        // Merge button has been pressed so do a merge.
        app.merge(elem);
      }
      else if ($('.edit.button.pressed').length > 0) {
        app.update_shifted_timers(elem);
      }
      else {
        // Start the timer.
        $(elem).addClass('active')
        elem.find('.timer').runner('start');
        favicon.badge(1);
        var timer_title = elem.find('.title').text();
        app.change_page_title(timer_title);
      }
    },

    set_default_title : function(count, $titles) {
      var new_temp_title = 'Untitled ' + count;
      var new_title_node = $titles.eq(count - 1);
      new_title_node.text(new_temp_title);
      var selection = window.getSelection();
      new_title_node.selectText();
      $(new_title_node).keypress(function( event ) {
        if (event.which == 13) {
          event.preventDefault();
          app.clear_selection();
          app.select_container($(this).parent());
        }
      });
    },

    add_new_timer : function(count, $timers, start_at) {
      $new_timer = $timers.eq(count - 1);
      if (start_at == undefined) {
        start_at = 0;
      }
      $new_timer.runner({milliseconds : false, startAt : start_at});
      $new_timer_container = $new_timer.parent();
      app.select_container($new_timer_container);
      // Make containers clickable for starting timers.
      $new_timer_container.click(function(e) {
        app.select_container($(this));
      });
      $new_timer_container.find('.description').hide();
      // Make this containers delete and merge buttons work.
      $new_timer_container.find('.delete.button').click(function(e) {
        var $target_timer = $(this);
        app.confirm_delete_dialog($target_timer);
      });
      $new_timer_container.find('.merge.button').click(function(e) {
        e.stopPropagation();
        // Ensure that no other timers are 'pressed'.
        app.press_element(this);
        app.message('Choose a target timer to merge into.');
      });
      $new_timer_container.find('.expand.button').click(function(e) {
        $this = $(this);
        $this.toggleClass('expanded');
        $this.toggleHtml('&#x25C0', '&#x25BC');
        var $description = $this.parent().find('.description');
        $description.toggle();

      });
      $new_timer_container.find('.edit.button').click(function(e) {
        e.stopImmediatePropagation();
        app.press_element(this);
        var time_shift_dialog = $( "#dialog-edit" ).dialog({
          autoOpen: false,
          height: 300,
          width: 350,
          modal: true,
          buttons: {
            "Shift time to another timer": app.shift_time,
            Cancel: function() {
              time_shift_dialog.dialog( "close" );
              $('.pressed').removeClass('pressed');
            }
          },
          close: function() {
            // $('.pressed').removeClass('pressed');
          }
        });
        time_shift_dialog.dialog( "open" );
      });
    },

    press_element: function(elem) {
      $('.pressed').not(elem).removeClass('pressed');
      var $target_timer = $(elem);
      $target_timer.addClass('pressed');
    },

    update_shifted_timers: function(elem) {
      $target = $(elem);
      var $target_timer = $target.find('.timer');
      var target_timer_value = app.parse_time($target_timer);
      var $origin = $('.button.edit.pressed').parent();
      var origin_time = $origin.find('.timer');
      var origin_timer_value = app.parse_time(origin_time);
      app.message('Choose a timer to shift to.');
      target_timer_value += time_shift_value;
      origin_timer_value -= time_shift_value;
      // These timer updates are all chained to fire one after another.
      app.update_timer($origin, origin_timer_value,
        app.update_timer($target, target_timer_value,
          app.unpress_elements()
        )
      );
      app.message('Time successfully shifted.');
    },

    unpress_elements: function() {
      $('.pressed').removeClass('pressed');
    },

    shift_time: function() {
      $( "#dialog-edit" ).dialog('close');
      time_shift_value = $( "#dialog-edit #amount").val() * 60 * 1000;

      // Origin.
      var $origin = $('.pressed');
      var origin_time = $origin.parent().find('.timer');
      var origin_timer_value = app.parse_time(origin_time);
      // Check we have enough time to shift.
      if (origin_timer_value < time_shift_value) {
        app.message('You don\'t have that much time to shift!');
      }
    },

    message : function(text) {
      var $system_message = $('#messages');
      $system_message.html(text);
      $system_message.hide();
      $system_message.slideDown('fast','linear', function() {
        setTimeout("$('#messages').slideUp('fast','linear', function() {$('#messages').html('');app.autosave();})", 4000);
      });
    },

    merge : function($elem) {
      // Target element is passed in.
      var $target = $elem;
      // Find the original element
      var $original = $('.timer-container .pressed').parent();
      $original.find('.pressed').removeClass('pressed');
      // Make sure you're not merging the same timer.
      if ($original[0] == $target[0]) {
        app.message('Cannot merge the same timer into itself.');
        return;
      }
      // Write messages.
      // Select a candidate.
      // Get timer value of merge_timer and candidate.
      var time_1 = $target.find('.timer');
      time_1 = app.parse_time(time_1);
      var time_2 = $original.find('.timer');
      time_2 = app.parse_time(time_2);
      // Merge timers.
      var new_time = time_1 + time_2;
      // Remove the original timer.
      $original.remove();
      // Update the remaining timer.
      app.update_timer($target, new_time);
      app.message('Merge complete.');
    },

    update_timer: function($target, new_time, callback) {
      $updated_timer = $target.find('.timer');
      $updated_timer.runner({milliseconds : false, startAt : new_time});
      if (typeof callback === 'function') {
        callback();
      }
    },

    stop_all_timers : function() {
      var $timers = $('.timer-container .timer');
      // Stop running timers
      $timers.each(function() {
        $(this).runner('stop');
      });
      favicon.badge(0);
      app.change_page_title('Stopped');
    },

    deactivate_all_containers : function() {
      var $containers = $('.timer-container');
      $containers.each(function() {
        $(this).removeClass('active');
      });
    },

    confirm_delete_dialog : function($target_timer) {
      $( "#dialog-confirm" ).dialog( {
        resizable: false,
        height: 140,
        modal: true,
        buttons: {
          "Confirm delete": function() {
            $target_timer.parent().remove();
            favicon.badge(0);
            $( this ).dialog( "close" );
          },
          Cancel: function() {
            $( this ).dialog( "close" );
          }
        }
      });
      $('.dialog-confirm').css('height', 'auto');
    },

    confirm_delete_all_dialog : function($timers) {
      $( "#dialog-confirm-all" ).dialog( {
        resizable: false,
        height: 140,
        modal: true,
        buttons: {
          "Confirm delete": function() {
            $timers.remove();
            favicon.badge(0);
            $( this ).dialog( "close" );
          },
          Cancel: function() {
            $( this ).dialog( "close" );
          }
        }
      });
      $('.dialog-confirm-all').css('height', 'auto');
    },

    change_page_title : function(title) {
      document.title = title;
    },

    save_state : function() {
      $interface_state = $('#containers-wrapper').html();
      localStorage.setItem('interface_state', $interface_state);
      var now = new Date();
      localStorage.setItem('interface_save_time', now);
      $('#last-saved').html('Saved: ' + now.toString());
    },
  }

  // Startup routine
  app.start();
});

/**
 * JQuery plugin to make contenteditable text selectable.
 */
jQuery.fn.selectText = function() {
  var range, selection;
  return this.each(function() {
    if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(this);
      range.select();
    } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(this);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
};

/**
 * JQuery plugin to toggle HTML in an element.
 */
jQuery.fn.extend({
  toggleHtml: function (a, b) {
    var that = this;
    if (that.hasClass('expanded')) {
      that.html(b);
    }
    else {
      that.html(a);
    }
    return this;
  }
});

/**
 * Format a seconds string to a human readable time.
 */
String.prototype.toHHMMSS = function () {
  var sec_num = parseInt(this, 10); // don't forget the second param
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  var time    = hours+':'+minutes+':'+seconds;
  return time;
}


// down &#x25BC;
// left &#x25C0;
