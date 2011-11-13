if (!window.SpaiaMe) {
    (function(){
        
            var jquery_url  = 'http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js';
        
        var spaiame_url = "http://spaia.me";
        var yql_timeout = 20000;
        var $ = null;
        
    	var speed = speed || 1;
    	speed = Math.floor(1000/speed);

        // instance methods
        var SpaiaMe = function(id) {
           this.id = id;
           this.data = {};
           this.spaiame_url = spaiame_url;
           this.items_count = 0;

           if (typeof(arguments[1]) != 'undefined')
                this.show(arguments[1]);
        };

        SpaiaMe.prototype = {
            debug: function() {
                return null;
                // if (window.console) {
                //     window.console.log.apply(window.console, arguments);
                // }
            },
            
            show: function(div_id) {
                var that = this;
                this.container = null;
                _checkForJquery(function() {
                    _loadedJquery();
                   that.container = jQuery("#"+div_id);
                   that.load(div_id);
                });
            },
            
            load: function(div_id) {
                var that = this;
                $.getJSON(this.spaiame_url +"/"+this.id+".js?div_id="+div_id+"&callback=?", function(data) {
                    $(data.services).each(function(i, service) {
                        service.last_retrieve = 0;
                        service.last_request  = 0;
                        service.running = false;
                        service.last_entry = null;
                    });
                    that.data = data;
                    // $(document).ready(function() {
                        that.draw();
                    // });
                });
            },
            draw: function() {
                var that = this;
                var container = that.container;

                container.html(that.data.template);
                that.containerList = $(container.find("ul")[0]);
                this._onIdle();
                this._animate();
            },
            
            _insertEntries: function(entries) {
                var that = this;
                
                $(entries).each(function(i, entry){
                    var timeago  = '<span class="timeago"></span>';
                    var content  = that._calledImage(entry.profile.img, entry.profile.url);
                    content += '<div class="spaiame_entry_content">'
                    content += entry.content + timeago + "</div>";
                    
                    var li_entry = $(
                        '<li class="entries hide ' + entry.service.type + '">' + 
                          content + 
                          '<div class="clear"></div>' + 
                        '</li>'
                    );
                    li_entry.data("date", entry.date);
                    
                    that.containerList.prepend(li_entry);
                });
            },
            
            // TODO: Check error in return YQL
            _onIdle: function() {
                var that = this;
                $(that.data.services).each(function(i, service) {
                    var now = new Date().getTime();
                    
                    if(!service.running && (service.last_retrieve + service.refresh_rate * 1000) < now) {
                        service.running = true;
                        service.last_request = now;
                        var url = service.url + "&callback=?&rnd=_" + new Date().getTime();                        
                        that.debug(url);
                        (function() {
                            $.getJSON(url, function(data) {
                                if (data.query) {
                                    that.debug(data);
                                    that._insertEntries(service.render_entry(that, service, data));
                                } else {
                                    that.debug("Error in " + service.type, data.error);
                                }
                                
                                service.last_retrieve = new Date().getTime();
                                service.running = false;
                            });
                        })();
                    } else if (service.running && (now - service.last_request) > yql_timeout) {
                        service.running = false;
                        service.last_retrieve = now;
                    }
                });
                
                that._setTimeOut(that._onIdle, 1000);
            },
            
            // Replace url for links
            _linkfy: function(str) {
                return str.replace(/((ftp|https?):\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?)/gm,'<a href="$1" target="_blank">$1</a>');
            },
            
            // Format image of the called
            _calledImage: function(src, url) {
                var img = '<img class="called_img" src="' + src + '"/>';
                return '<a class="called_link" target="_blank" href="' + url + '">' + img + '</a>';
            },
            
            _animate: function() {
                var that = this;
                that._updateTimeAgo();
                var lastQueueEntry = that.containerList.find('.hide:last');
                if (lastQueueEntry.size() == 1) {
                    
                    // Remove item
                    if (this.items_count+1 > that.data.max_entries) {
                        that.containerList.find('li:last')
                            .animate({opacity: 0}, Math.floor(speed/8)+375, 'linear')
                            .slideUp(Math.floor(speed/20)+50, function(){
                                $(this).remove();
                            });
                        this.items_count--;
                    }
                    
                    // Inser item
                    lastQueueEntry.removeClass('hide').css({
                        opacity: 0,
                        marginTop: (lastQueueEntry.height()+10)*-1
                    });
                    
                    var anim_velocity = Math.floor(speed/10)+(lastQueueEntry.height())*2;
                    lastQueueEntry
                        .animate({ marginTop: 0}, anim_velocity, 'linear')
                        .animate({opacity: 1}, anim_velocity+200, 'linear', function() {
                            that.items_count++;
                            // on animation end, call again with delay
                            that._setTimeOut(that._animate, speed);
                    });
                } else {
                    that._setTimeOut(that._animate, speed);
                }
            },
            
            _setTimeOut: function(func, time) {
                func.bind = function(obj) {
                    var func = this;
                    return function() { return func.apply(obj, arguments); };
                };
                
                window.clearTimeout(func);
                window.setTimeout(func.bind(this), time);
            },
            
            _updateTimeAgo: function() {
                var elements = this.containerList.find('li');
                $(elements).each(function(i, li){
                    li = $(li);
                    li.find('.timeago').html(' (' + $.timeago(li.data("date")) + ')');
                });
            },
            
            _arrayFind: function(array, fun) {
                var len = array.length >>> 0;
                if (typeof fun != "function")
                    throw new TypeError();
                    
                var res = [];
                for (var i = 0; i < len; i++) {
                    if (i in array) {
                        var val = array[i];
                        if (fun.call(this, val, i, array))
                            return val;
                    }
                }
                return null;
            }
        };

        // class methods
        SpaiaMe.render = function(id) {
           var div_id = "spaiame_" + id;
           document.write('<div id="'+div_id+'"></div>');
           (new SpaiaMe(id)).show(div_id);
        };

        // private
        var _loadedJquery = function() {
            $ = jQuery;
            _timeAgo($);
        };

        var _checkForJquery = function(callback) {
            _loadExternalScript(jquery_url, callback, function() { return !(typeof jQuery == 'undefined') });
        };
        
        var _loadExternalScript = function(src, callback, check_func) {
            if (!check_func()) {
                var scriptElement = document.createElement("script");
                var head = document.getElementsByTagName("head").item(0);
                scriptElement.setAttribute("src", src);
                head.appendChild(scriptElement);
                
                function waitForLoad() {
                    if (!check_func()) {
                        window.setTimeout(waitForLoad, 100); 
                    } else {
                        callback();
                    }
                }
                
                waitForLoad();
            } else {
                callback();
            }
        };

        window.SpaiaMe = SpaiaMe;
        
        /*
         * timeago: a jQuery plugin, version: 0.8.2 (2010-02-16)
         * @requires jQuery v1.2.3 or later
         *
         * Timeago is a jQuery plugin that makes it easy to support automatically
         * updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
         *
         * For usage and examples, visit:
         * http://timeago.yarp.com/
         *
         * Licensed under the MIT:
         * http://www.opensource.org/licenses/mit-license.php
         *
         * Copyright (c) 2008-2010, Ryan McGeary (ryanonjavascript -[at]- mcgeary [*dot*] org)
         */
        var _timeAgo = function($) {
          $.timeago = function(timestamp) {
            if (timestamp instanceof Date) return inWords(timestamp);
            else if (typeof timestamp == "string") return inWords($.timeago.parse(timestamp));
            else return inWords($.timeago.datetime(timestamp));
          };
          var $t = $.timeago;

          $.extend($.timeago, {
            settings: {
              refreshMillis: 60000,
              allowFuture: false,
              strings: {
                prefixAgo: null,
                prefixFromNow: null,
                suffixAgo: "ago",
                suffixFromNow: "from now",
                ago: null, // DEPRECATED, use suffixAgo
                fromNow: null, // DEPRECATED, use suffixFromNow
                seconds: "less than a minute",
                minute: "about a minute",
                minutes: "%d minutes",
                hour: "about an hour",
                hours: "about %d hours",
                day: "a day",
                days: "%d days",
                month: "about a month",
                months: "%d months",
                year: "about a year",
                years: "%d years"
              }
            },
            inWords: function(distanceMillis) {
              var $l = this.settings.strings;
              var prefix = $l.prefixAgo;
              var suffix = $l.suffixAgo || $l.ago;
              if (this.settings.allowFuture) {
                if (distanceMillis < 0) {
                  prefix = $l.prefixFromNow;
                  suffix = $l.suffixFromNow || $l.fromNow;
                }
                distanceMillis = Math.abs(distanceMillis);
              }

              var seconds = distanceMillis / 1000;
              var minutes = seconds / 60;
              var hours = minutes / 60;
              var days = hours / 24;
              var years = days / 365;

              var words = seconds < 45 && substitute($l.seconds, Math.round(seconds)) ||
                seconds < 90 && substitute($l.minute, 1) ||
                minutes < 45 && substitute($l.minutes, Math.round(minutes)) ||
                minutes < 90 && substitute($l.hour, 1) ||
                hours < 24 && substitute($l.hours, Math.round(hours)) ||
                hours < 48 && substitute($l.day, 1) ||
                days < 30 && substitute($l.days, Math.floor(days)) ||
                days < 60 && substitute($l.month, 1) ||
                days < 365 && substitute($l.months, Math.floor(days / 30)) ||
                years < 2 && substitute($l.year, 1) ||
                substitute($l.years, Math.floor(years));

              return $.trim([prefix, words, suffix].join(" "));
            },
            parse: function(iso8601) {
              var s = $.trim(iso8601);
              s = s.replace(/-/,"/").replace(/-/,"/");
              s = s.replace(/T/," ").replace(/Z/," UTC");
              s = s.replace(/([\+-]\d\d)\:?(\d\d)/," $1$2"); // -04:00 -> -0400
              return new Date(s);
            },
            datetime: function(elem) {
              // jQuery's `is()` doesn't play well with HTML5 in IE
              var isTime = $(elem).get(0).tagName.toLowerCase() == "time"; // $(elem).is("time");
              var iso8601 = isTime ? $(elem).attr("datetime") : $(elem).attr("title");
              return $t.parse(iso8601);
            }
          });

          $.fn.timeago = function() {
            var self = this;
            self.each(refresh);

            var $s = $t.settings;
            if ($s.refreshMillis > 0) {
              setInterval(function() { self.each(refresh); }, $s.refreshMillis);
            }
            return self;
          };

          function refresh() {
            var data = prepareData(this);
            if (!isNaN(data.datetime)) {
              $(this).text(inWords(data.datetime));
            }
            return this;
          }

          function prepareData(element) {
            element = $(element);
            if (!element.data("timeago")) {
              element.data("timeago", { datetime: $t.datetime(element) });
              var text = $.trim(element.text());
              if (text.length > 0) element.attr("title", text);
            }
            return element.data("timeago");
          }

          function inWords(date) {
            return $t.inWords(distance(date));
          }

          function distance(date) {
            return (new Date().getTime() - date.getTime());
          }

          function substitute(stringOrFunction, value) {
            var string = $.isFunction(stringOrFunction) ? stringOrFunction(value) : stringOrFunction;
            return string.replace(/%d/i, value);
          }

          // fix for IE6 suckage
          document.createElement("abbr");
          document.createElement("time");
        };
    })();
}