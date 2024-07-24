/*!
 * jquery.grid.js 0.0.1 - https://github.com/yckart/jquery.grid.js
 * A lightweight plugin to align elements perfect in grid.
 *
 * Copyright (c) 2013 Yannick Albert (http://yckart.com)
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
 * 2013/02/09
*/
;(function($, window, document, undefined) {
    var pluginName = 'grid',

        defaults = {
            center: false,
            autoresize: true,
            animate: {
                enabled: false,
                options: {
                    queue: false,
                    duration: 500
                }
            },
            gutterWidth: 0,
            isRTL: false
        },

        Plugin = function(options, element) {
            this.elem = element;
            this.$elem = $(element);

            this._create(options);
            this._init();
        },
        Method = Plugin.prototype;

    Method._filterFindItems = function($elems) {
        var selector = this.options.itemSelector;
        // if there is a selector
        // filter/find appropriate item elements
        return !selector ? $elems : $elems.filter(selector).add($elems.find(selector));
    };

    Method._getItems = function($elems) {
        var $items = this._filterFindItems($elems).css({
            position: 'absolute'
        }).addClass(pluginName + '-item');
        return $items;
    };

    // sets up widget
    Method._create = function(options) {

        this.options = $.extend(true, {}, defaults, options);
        this.styleQueue = [];

        // get original styles in case we re-apply them in .destroy()
        var elemStyle = this.elem.style;
        this.originalStyle = {
            // get height
            height: elemStyle.height || ''
        };

        this.alignment = this.options.isRTL ? 'right' : 'left';

        var x = this.$elem.css('padding-' + this.alignment),
            y = this.$elem.css('padding-top');

        this.offset = {
            x: x ? parseInt(x, 10) : 0,
            y: y ? parseInt(y, 10) : 0
        };

        this.isFluid = this.options.columnWidth && typeof this.options.columnWidth === 'function';

        // add plugin class first time around
        var instance = this;
        setTimeout(function() {
            instance.$elem.addClass(pluginName);
        }, 0);

        // bind resize method
        if (this.options.autoresize) {
            var resizeTimer;
            $(window).bind('resize.' + pluginName, function() {
                if (resizeTimer) {
                    clearTimeout(resizeTimer);
                }
                resizeTimer = setTimeout(function() {
                    instance.resize();
                }, 100);
            });
        }

        // need to get items
        this.reloadItems();

    };

    // _init fires when instance is first created
    // and when instance is triggered again -> $el.grid();
    Method._init = function(callback) {
        this._getCols();
        this._reLayout(callback);
    };

    Method.option = function(key, value) {
        // set options AFTER initialization:
        // signature: $('#foo').bar({ cool:false });
        if ($.isPlainObject(key)) {
            this.options = $.extend(true, this.options, key);
        }
    };

    // ====================== General Layout ======================
    // used on collection of atoms (should be filtered, and sorted before )
    // accepts atoms-to-be-laid-out to start with
    Method.layout = function($items, callback) {

        // place each item
        for (var i = 0, len = $items.length; i < len; i++) {
            this._placeItem($items[i]);
        }

        // set the size of the container
        var containerSize = {};
        containerSize.height = Math.max.apply(Math, this.colYs);
        if (this.options.center) {
            var unusedCols = 0;
            i = this.cols;
            // count unused columns
            while (--i) {
                if (this.colYs[i] !== 0) {
                    break;
                }
                unusedCols++;
            }
            // fit container to columns that have been used;
            containerSize.width = (this.cols - unusedCols) * this.columnWidth - this.options.gutterWidth;
        }
        this.styleQueue.push({
            $el: this.$elem,
            style: containerSize
        });

        // are we animating the layout arrangement?
        // use plugin-ish syntax for css or animate
        var styleFn = !this.isLaidOut ? 'css' : (this.options.animate === true || this.options.animate.enabled ? 'animate' : 'css'),
            animOpts = this.options.animate.options;

        // process styleQueue
        var obj;
        for (i = 0, len = this.styleQueue.length; i < len; i++) {
            obj = this.styleQueue[i];
            obj.$el[styleFn](obj.style, animOpts);
        }

        // clear out queue for next time
        this.styleQueue = [];

        // provide $elems as context for the callback
        if (callback) {
            callback.call($items);
        }

        this.isLaidOut = true;
    };

    // calculates number of columns
    // i.e. this.columnWidth = 200
    Method._getCols = function() {
        var container = this.options.center ? this.$elem.parent() : this.$elem,
            containerWidth = container.width();

        // use fluid columnWidth function if there
        this.columnWidth = this.isFluid ? this.options.columnWidth(containerWidth) :
        // if not, how about the explicitly set option?
        this.options.columnWidth ||
        // or use the size of the first item
        this.$items.outerWidth(true) ||
        // if there's no items, use size of container
        containerWidth;

        this.columnWidth += this.options.gutterWidth;

        this.cols = Math.floor((containerWidth + this.options.gutterWidth) / this.columnWidth);
        this.cols = Math.max(this.cols, 1);

    };

    // layout logic
    Method._placeItem = function(item) {
        var $item = $(item),
            colSpan, groupCount, groupY, groupColY, j;

        //how many columns does this item span
        colSpan = Math.ceil($item.outerWidth(true) / this.columnWidth);
        colSpan = Math.min(colSpan, this.cols);

        if (colSpan === 1) {
            // if item spans only one column, just like singleMode
            groupY = this.colYs;
        } else {
            // item spans more than one column
            // how many different places could this item fit horizontally
            groupCount = this.cols + 1 - colSpan;
            groupY = [];

            // for each group potential horizontal position
            for (j = 0; j < groupCount; j++) {
                // make an array of colY values for that one group
                groupColY = this.colYs.slice(j, j + colSpan);
                // and get the max value of the array
                groupY[j] = Math.max.apply(Math, groupColY);
            }

        }

        // get the minimum Y value from the columns
        var minimumY = Math.min.apply(Math, groupY),
            shortCol = 0;

        // Find index of short column, the first from the left
        for (var i = 0, len = groupY.length; i < len; i++) {
            if (groupY[i] === minimumY) {
                shortCol = i;
                break;
            }
        }

        // position the item
        var position = {
            top: minimumY + this.offset.y
        };

        // position.left or position.right
        position[this.alignment] = this.columnWidth * shortCol + this.offset.x;

        this.styleQueue.push({
            $el: $item,
            style: position
        });

        // apply setHeight to necessary columns
        var setHeight = minimumY + $item.outerHeight(true),
            setSpan = this.cols + 1 - len;
        for (i = 0; i < setSpan; i++) {
            this.colYs[shortCol + i] = setHeight;
        }

    };


    Method.resize = function() {
        var prevColCount = this.cols;
        // get updated colCount
        this._getCols();
        if (this.isFluid || this.cols !== prevColCount) {
            // if column count has changed, trigger new layout
            this._reLayout();
        }
    };


    Method._reLayout = function(callback) {
        // reset columns
        var i = this.cols;
        this.colYs = [];
        while (i--) {
            this.colYs.push(0);
        }
        // apply layout logic to all items
        this.layout(this.$items, callback);
    };

    // ====================== Convenience methods ======================
    // goes through all children again and gets items in proper order
    Method.reloadItems = function() {
        this.$items = this._getItems(this.$elem.children());
    };


    Method.reload = function(callback) {
        this.reloadItems();
        this._init(callback);
    };


    // convienence method for working with Infinite Scroll
    Method.appended = function($content, animateFromBottom, callback) {
        if (animateFromBottom) {
            // set new stuff to the bottom
            this._filterFindItems($content).css({
                top: this.$elem.height()
            });
            var instance = this;
            setTimeout(function() {
                instance._appended($content, callback);
            }, 1);
        } else {
            this._appended($content, callback);
        }
    };

    Method._appended = function($content, callback) {
        var $newItems = this._getItems($content);
        // add new items to item pool
        this.$items = this.$items.add($newItems);
        this.layout($newItems, callback);
    };

    // removes elements from Masonry widget
    Method.remove = function($content) {
        this.$items = this.$items.not($content);
        $content.remove();
    };

    // destroys widget, returns elements and container back (close) to original style
    Method.destroy = function() {

        this.$items.removeClass(pluginName + '-item').each(function() {
            this.style.position = '';
            this.style.top = '';
            this.style.left = '';
        });

        // re-apply saved container styles
        var elemStyle = this.elem.style;
        for (var prop in this.originalStyle) {
            if (this.originalStyle.hasOwnProperty(prop)) {
                elemStyle[prop] = this.originalStyle[prop];
            }
        }

        this.$elem.unbind('.' + pluginName).removeClass(pluginName).removeData(pluginName);

        $(window).unbind('.' + pluginName);

    };


    // helper function for logging errors
    this.console = this.console || {
        error: function() {}
    };

    // ======================= Plugin bridge ===============================
    // leverages data method to either create or return Plugin constructor
    // A bit from jQuery UI
    // https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.widget.js
    // A bit from jcarousel
    // https://github.com/jsor/jcarousel/blob/master/lib/jquery.jcarousel.js
/*
    $.fn[pluginName] = function(options) {
        var args = arguments;
        if (options === undefined || typeof options === 'object') {
            return this.each(function() {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            var returns;
            this.each(function() {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }
            });
            return returns !== undefined ? returns : this;
        }
    };
*/

    $.fn[pluginName] = function(options) {
        if (typeof options === 'string') {
            // call method
            var args = Array.prototype.slice.call(arguments, 1);

            this.each(function() {
                var instance = $.data(this, pluginName);

                // no such method found or plugin was not initialized prior method call
                if (!instance || typeof instance[options] !== 'function' || options.charAt(0) === "_") {
                    return;
                }

                // apply method
                instance[options].apply(instance, args);
            });
        } else {
            this.each(function() {
                var instance = $.data(this, pluginName);
                if (instance) {
                    // apply options & init
                    instance.option(options || {});
                    instance._init();
                } else {
                    // initialize new instance
                    $.data(this, pluginName, new Plugin(options, this));
                }
            });
        }
        return this;
    };

})(window.jQuery || window.Zepto, window, document);