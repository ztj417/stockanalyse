 /**
 * Tab组件1.0
 * date:2018-03-21
 * author: [chengang];
 */
(function ($, window) {
    var defaults = {
        hd: null, //Tab头选择器，默认为当前插件选择器下的第一个元素的子节点
        bd: null, //Tab内容选择器，默认为当前插件选择器下的第二个元素的子节点
        target: null, //Tab锚点，默认通过索引
        activeIndex: 0, //默认激活Tab索引
        event: "click", //Tab激活方式 click，mouseover
        activeClass: "active", //Tab激活样式
        delay: 300, //mouseover延迟时间
        before: $.noop, //选中前触发
        after: $.noop //选中后触发
    };

    function TabView(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this.init();
    }

    TabView.prototype = {
        init: function () {
            var self = this,
                settings = self.settings,
                overTimer;
            var nHd=">:eq(0) "+settings.hd,
                nBd=">:eq(1)>"+settings.bd,
                hdselector = !!settings.hd ?nHd: ">:eq(0)>:not([data-more])",
                bdselector = !!settings.bd ?nBd: ">:eq(1)>*";
               
            settings.$bd = $(bdselector, self.element);

            // 响应式tab切换，移动设备禁止跳转的解决方案
            var is_iPd = navigator.userAgent.match(/(iPad|iPod|iPhone)/i) !== null;
            var is_mobi = navigator.userAgent.toLowerCase().match(/(ipod|iphone|android|coolpad|mmp|smartphone|midp|wap|xoom|symbian|j2me|blackberry|win ce)/i) !== null;

            if (settings.event == 'click') {
                $(self.element).on('click', hdselector, function (event) {
                    if (is_iPd || is_mobi) {
                        event.preventDefault();
                    }
                    $.proxy(self.activeTab, self, $(this))();
                });

            } else if (settings.event == 'mouseover') {
                $(self.element).on('mouseover', hdselector, function () {
                    overTimer && clearTimeout(overTimer);
                    overTimer = setTimeout($.proxy(self.activeTab, self, $(this)), settings.delay);
                }).on('mouseout', hdselector,  function() {
                    overTimer && clearTimeout(overTimer);
                });
            }
            self.activeTab($(hdselector, self.element).eq(settings.activeIndex), true);
        },
        activeTab: function ($acthd, init) {
            var self = this,
                settings = self.settings,
                $bd = settings.$bd,
                $actbd;

            var $currbd = $bd.filter(":visible");
            if (!init && settings.before.call(self, $acthd, $currbd) === false) {
                return false;
            }

            $acthd.addClass(settings.activeClass).siblings(settings.hd || "*").removeClass(settings.activeClass);

            if (!settings.target) {  //id
                var idx = $acthd.index();
             
                $actbd = $bd.eq(idx)
                $actbd.show().siblings(settings.bd || "*").hide();
                $(self.element).children().eq(0).find("[data-more]").hide().eq(idx).show();

            } else {
                var targetid = $acthd.data(settings.target);
                $actbd = $bd.filter('[data-' + settings.target + '="' + targetid + '"]').show();
                $bd.not($actbd).hide();

                // $("[data-more]", self.element).hide();
                $("[data-more="+targetid+"]", self.element).show().siblings("[data-more]").hide();

            }
            if (!init) {
                settings.after.call(self, $acthd, $actbd);
            }
        }
    };

    $.fn.Tab = function (options) {
        this.each(function () {
            // if (!$.data(this, "Tab")) {
                $.data(this, "Tab", new TabView(this, options));
            // }
        });
        return this;
    };

})(jQuery, window);