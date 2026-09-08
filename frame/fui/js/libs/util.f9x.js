'use strict';
/* global echarts */
// 工具方法

if (!window.Util) {
    window.Util = {};
}
$.extend(window.Util, {
    /**
     * 获取数组中指定属性的最大值
     * @param {Array} arr 数组
     * @param {String} key 指定属性
     * @returns {Number} 最大数值
     * @example [{key:166},{key:200},{key:33}]=>getMax(arr,'key);=>200
     */
    getMax: function (arr, key) {
        var max = 0,
            len = arr.length;
        for (var i = 0; i < len; i++) {
            var item = arr[i][key];
            if (max < item) max = item;
        }
        return max;
    },
    /**
     * 获取数组中指定属性的最小值
     * @param {Array} arr 数组
     * @param {String} key 指定属性
     * @returns {Number} 最小值
     * @example [{key:166},{key:200},{key:33}]=>getMax(arr,'key);=>33
     */
    getMin: function (arr, key) {
        if (arr.length === 0) return;
        var min = arr[0][key],
            len = arr.length;
        for (var i = 1; i < len; i++) {
            var item = arr[i][key];
            if (min > item) min = item;
        }
        return min;
    },
    /**
     * 获取数组指定属性的和
     * @param {Array} arr 数组
     * @param {String} key 指定属性
     * @returns {Number} 和
     * @example [{key:166},{key:200},{key:33}]=>getSum(arr,'key);=>399
     */
    getSum: function (arr, key) {
        var sum = 0,
            len = arr.length;
        for (var i = 0; i < len; i++) {
            sum += arr[i][key];
        }
        return sum;
    },
    /**
     * 获取数组中指定属性的数组
     * @param {Array} arr 源数组
     * @param {String} key 指定属性
     * @returns {Array} 目标数组
     * @example [{key:166},{key:200},{key:33}]=>getValArr(arr,'key);=>[166,200,33]
     */
    getValArr: function (arr, key) {
        var val = [],
            len = arr.length;
        for (var i = 0; i < len; i++) {
            val.push(arr[i][key]);
        }
        return val;
    },
    /**
     * 快速渲染数字及文本
     * @param {String} space 命名空间
     * @param {Object} data 数据
     * @param {Function} filterFn 过滤函数，处理渲染结果，比如加单位
     */
    renderNum: function (space, data, filterFn) {
        for (var i in data) {
            if (Object.prototype.hasOwnProperty.call(data, i)) {
                var $dom = $('#' + space + '-' + i);
                if ($dom.length > 0) {
                    $dom.text(filterFn ? filterFn(data[i]) : data[i]);
                }
            }
        }
    },
    /**
     * 获取百分比
     * @param {Number} max 总数
     * @param {Number} data 数据
     * @param {Number} fixed 精确到小数点位数，可不传，默认为0
     * @param {Number} unit 配置单位，可不传，默认%，不要百分号传""
     */
    getPercent: function (max, data, fixed, unit) {
        var _fixed = fixed || 0,
            newunit = unit === '' ? '' : (unit || '%');
        return max === 0 ? 0 + newunit : (data / max * 100).toFixed(_fixed) + newunit;
    },
    /**
     * 图表自动切换展示tooltip
     * @param {Object} chart 图表实例
     * @param {Number} length 图表数据量
     * @param {Number} interval 切换间隔，单位ms
     */
    showTooltip: function (chart, length, interval) {
        chart.dataLength = length;
        chart.currentIndex = 0;
        clearInterval(chart.timer);
        chart.interval = interval || 3000;
        chart.timer = setInterval(function () {
            if (chart.currentIndex === chart.dataLength) {
                chart.currentIndex = 0;
            }
            chart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: chart.currentIndex
            });
            chart.currentIndex++;
        }, chart.interval);
    },
    // 鼠标悬浮到图表，停止showTooltip
    chartHover: function (chart, length, interval) {
        chart.on('mouseover', function () {
            clearInterval(chart.timer);
        });
        chart.on('mouseout', function () {
            Util.showTooltip(chart, length, interval);
        });
    },
    // 数字千分位转换
    addCommas: function (n) {
        if (isNaN(n)) {
            return '-';
        }
        n = (n + '').split('.');
        return n[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,') +
            (n.length > 1 ? ('.' + n[1]) : '');
    },
    // echarts自适应
    echartsResize: function () {
        var echartsResizeTimer = null;
        return function () {
            $(window).on('resize', function () {
                // 获取所有echarts容器的jQuery对象
                var $echarts = $('[_echarts_instance_]');
                if (echartsResizeTimer) clearTimeout(echartsResizeTimer);
                echartsResizeTimer = setTimeout(function () {
                    $.each($echarts, function (i, e) {
                        // 调用echarts的api获取图表实例，执行缩放
                        var chart = echarts.getInstanceByDom(e);
                        chart.resize();
                    });
                }, 50);
            });
        };
    },
    /**
     * 定时切换地图高亮
     * @param {Object}chartInstance 图表实例
     * @param {Number} length 数据长度
     */
    areaHight: function (chartInstance, length) {
        chartInstance.dataLen = length;
        chartInstance.curData = 0;
        clearInterval(chartInstance.hightTimer);
        chartInstance.hightTimer = setInterval(function () {
            if (chartInstance.curData === chartInstance.dataLen) {
                chartInstance.curData = 0;
            }
            // 取消高亮
            chartInstance.dispatchAction({
                type: 'downplay',
                seriesIndex: 0
            });
            // 高亮地图区域
            chartInstance.dispatchAction({
                type: 'highlight',
                seriesIndex: 0,
                dataIndex: chartInstance.curData
            });
            // 显示悬浮窗
            chartInstance.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: chartInstance.curData
            });
            chartInstance.curData++;
        }, 3000);
    },
    /**
     * 地图图表专用：鼠标悬浮到地图，停止showTooltip
     * @param {Object} chartInstance 图表实例
     * @param {Number} length 图表数据量
     */
    mapChartHover: function (chartInstance, length) {
        chartInstance.on('mouseover', function () {
            clearInterval(chartInstance.hightTimer);
        });
        chartInstance.on('mouseout', function () {
            Util.areaHight(chartInstance, length, chartInstance.interval || 3000);
        });
    },
    /**
     * echarts渐变色,适用双色渐变，可根据实际需求改写,方向参数可不传，默认水平方向渐变
     * @param {String} color1 jquery dom对象
     * @param {String} color2 html字符串
     * @param {direction} 0：左右，1：上下
     */
    linearColor: function (color1, color2, direction) {
        var x1, y1 = 0, x2 = 0, y2;
        if ((direction || 0) === 0) {
            x1 = 1;
            y2 = 0;
        } else {
            x1 = 0;
            y2 = 1;
        }
        return new echarts.graphic.LinearGradient(x1, y1, x2, y2,
            [{
                offset: 0,
                color: color1
            }, {
                offset: 1,
                color: color2
            }]
        );
    },
    // 点击高亮
    act: function ($dom, fn) {
        if ($dom.hasClass('active')) {
            return;
        } else {
            var ctx = this,
                args = Array.prototype.slice.call(arguments, 2);
            $dom.addClass('active').siblings().removeClass('active');
            args.unshift($dom)
            fn && fn.apply(ctx, args);
        }
    },
    /**
     *将字符串按照固定的字数截取
     * @param {String} str 需要处理的字符串
     * @param {Number} num 截断间隔
     * @param {Str} split 需要插入的字符，不传默认换行符 '\n'
     */
    splitStr: function (str, num, split) {
        var splitStr = split || '\n',
            reg = new RegExp('(\\S{' + num + '})', 'g'),
            reg2 = new RegExp('(\\' + splitStr + ')$'),
            fmtStr = str.replace(reg, '$1' + splitStr);
        return fmtStr.replace(reg2, '');
    },
    /**
     * 数组分组，用于多页面渲染
     * @param {Number} num 每组元素的数量
     * @param {Array} arr 需要处理的数组
     */
    getArrTrans: function (arr, num) {
        var resultArr = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            var page = Math.floor(i / num);
            if (!resultArr[page]) {
                resultArr[page] = [];
            }
            resultArr[page].push(arr[i]);
        }
        return resultArr;
    },
    /**
     * 根据value查找key
     * @param {Object} object 需要查找的对象
     * @param {Function} predicate 查询条件
     */
    findKey: function (object, predicate) {
        var result;
        if (object === null) {
            return result;
        }
        Object.keys(object).some(function (key) {
            var value = object[key];
            if (predicate(value, key, object)) {
                result = key;
                return true;
            }
        });
        return result;
    },
    /**
     * 动态载入、更新数字，需要引入插件countUp.js
     * @param {String} space 命名空间
     * @param {Number} data 数据
     * @param {Object} options 插件自定义配置，可不传
     */
    animateRender: function (space, data, options) {
        for (var i in data) {
            if (Object.prototype.hasOwnProperty.call(data, i)) {
                var $dom = $('#' + space + '-' + i),
                    d = data[i] - 0;
                if ($dom.length > 0) {
                    if (!isNaN(d)) {
                        var dotIdx = String(data[i]).indexOf('.'), //获取小数点的位置
                            decimal = 0; // 默认整数
                        if (dotIdx > -1) {
                            decimal = String(data[i]).length - dotIdx - 1; //获取小数点后的个数
                        }
                        var countUpOption = $.extend({}, {
                            //定义是否开启缓动
                            useEasing: true,
                            //是否开启分组
                            useGrouping: false,
                            decimalPlaces: decimal
                        }, options || {});
                        if (!$dom.data('countUp')) {
                            var num = new CountUp(space + '-' + i, data[i], countUpOption);
                            if (!num.error) {
                                //开启滚动
                                num.start();
                            } else {
                                // eslint-disable-next-line no-console
                                console.log(num.error);
                            }
                            //  = num;
                            $dom.data('countUp', num);
                        } else {
                            $dom.data('countUp').update(data[i]);
                        }
                    } else {
                        $dom.text(data[i]);
                    }
                }
            }
        }
    },
    /**
     * 载入状态，类似renderNum
     * @param {String} space 命名空间
     * @param {Number} data 数据
     * @param {String} stateCls 状态名称前缀，不传默认'state'
     */
    renderState: function (space, data, stateCls) {
        for (var i in data) {
            if (Object.prototype.hasOwnProperty.call(data, i)) {
                var $dom = $('#' + space + '-' + i);
                if ($dom.length > 0) {
                    $dom.attr('data-' + (stateCls || 'state'), data[i]);
                }
            }
        }
    },
    /**
     * 删除链接中的html后缀
     * @param {String} url 需要处理的url字符串
     */
    removeHtml: function (url) {
        return url.replace(/\.html/ig, '');
    },
    /**
     * 饼图自动切换
     * @param {Object} curChart 图表实例
     * @param {Number} chartLength 数据长度
     * @param {Number} timer 切换时间
     */
    pieAuto: function (curChart, chartLength, timer) {
        var mytimer = timer || 3000;
        var app = {
            currentIndex: -1
        };
        clearInterval(curChart.timer);
        curChart.timer = setInterval(function () {
            var dataLen = chartLength;
            // 取消之前高亮的图形
            curChart.dispatchAction({
                type: 'downplay',
                seriesIndex: 0,
                dataIndex: app.currentIndex
            });
            app.currentIndex = (app.currentIndex + 1) % dataLen;
            // 高亮当前图形
            curChart.dispatchAction({
                type: 'highlight',
                seriesIndex: 0,
                dataIndex: app.currentIndex
            });
            // 显示 tooltip
            curChart.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: app.currentIndex
            });
        }, mytimer);
    },
    /**
     * 美化滚动条
     * @param {*} dom 滚动条容器class或者id
     * @param {*} subdom 直接子元素
     * @param {*} param 滚动条配置参数，不传则使用opt默认样式
     */
    niceScroll: function (dom, subdom, param) {
        var opt = $.extend({
            cursorwidth: '6px',
            cursorborder: 0,
            cursorcolor: '#00b9e7',
            background: 'rgba(37,144,235,0.4)',
            autohidemode: false
        }, param);
        if (subdom !== '') {
            dom.niceScroll(subdom, opt);
        } else {
            dom.niceScroll(opt);
        }
    },
    /**
     * 重置滚动条
     * @param {*} dom 滚动条容器class或者id
     */
    resetNiceScroll: function (dom) {
        dom.getNiceScroll().resize();
    },
    /**
     * 按照格式输出日期，如：yyyy-MM-dd HH:mm:ss
     * @param {*} date 日期对象
     * @param {*} fmt 格式
     */
    dateFormat: function (date, fmt) {
        var o = {
            'M+': date.getMonth() + 1, //月份
            'd+': date.getDate(), //日
            'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, //小时
            'H+': date.getHours(), //小时
            'm+': date.getMinutes(), //分
            's+': date.getSeconds(), //秒
            'q+': Math.floor((date.getMonth() + 3) / 3), //季度
            'S': date.getMilliseconds() //毫秒
        };
        var week = {
            '0': '\u65e5',
            '1': '\u4e00',
            '2': '\u4e8c',
            '3': '\u4e09',
            '4': '\u56db',
            '5': '\u4e94',
            '6': '\u516d'
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        if (/(E+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[date.getDay() + '']);
        }
        for (var k in o) {
            if (new RegExp('(' + k + ')').test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
            }
        }
        return fmt;
    },

    // 是否为移动端
    isMobile: function () {
        var ua = navigator.userAgent;

        var detect = {
            // 是否为移动终端
            mobile: !!ua.match(/AppleWebKit.*Mobile.*/),
            // ios终端
            ios: !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
            // android终端或者uc浏览器
            android: ua.indexOf('Android') > -1 || ua.indexOf('Linux') > -1,
            // 是否为iPhone或者QQHD浏览器
            iPhone: ua.indexOf('iPhone') > -1,
            // 是否iPad
            iPad: ua.indexOf('iPad') > -1
        };

        return (detect.mobile || detect.ios || detect.android || detect.iPhone || detect.iPad);
    },
    /**
     * 数组排序
     * @param {*} data 数组
     * @param {*} key 排序字段，默认"value"
     * @param {*} order 排序顺序，默认降序"0"
     */
    sort: function (data, sortField, order) {
        var o = order || 0,
            s = sortField || 'value';
        var compare = function (key) {
            return function (value1, value2) {
                var val1 = value1[key];
                var val2 = value2[key];
                if (o === 0) {
                    return val2 - val1;
                // eslint-disable-next-line no-else-return
                } else {
                    return val1 - val2;
                }
            };
        };
        return data.sort(compare(s));
    },
    /**
     * 进度条动画
     * @param {*} space 命名空间
     * @param {*} speed 速度，默认200
     * @param {*} callback 回调
     */
    progressBar: function (space, speed, callback) {
        $('.' + space + '-' + 'percent').each(function () {
            $(this).stop().animate({
                'width': $(this).attr('data-width')
            }, speed || 200, function () {
                callback();
            });
        });
    },
    /**
     * @name 判断数据是否为数组
     * @param {Object|Array} data
     * @return {Booleam} 返回值
     */
    isArray: function (data) {
        return Object.prototype.toString.call(data) === '[object Array]';
    },
    /**
     * Mustache 模板渲染
     * @param {String} tpl 模板，可以是模板字符串，也可以是定义模板的父元素的 id 选择器，即形如 "#tplid"
     * @param {Object} data 模板数据
     * @param {String} target 可选参数。要渲染到的目标对象，可以是目标对象的 jQuery 选择器，也可以是 dom 对象。如果不传该参数，则模板不会自动渲染。
     * @returns {String} 生成的模板字符串
     */
    render: function (tpl, data, target) {
        var html = '';
        if (tpl.indexOf('#') === 0) {
            tpl = Util.clearHtml($(tpl).html());
        }

        html = Mustache.render(tpl, data);

        if (target) {
            $(target).html(html);
        }
        return html;
    },
    /**
     * @name 为状态添加显隐判断
     * @param {Object|Array} data
     */
    setStatusVisible: function (data, key, status) {
        if (Util.isArray(data)) {
            $(data).each(function () {
                Util.setStatusVisible(this, key, status);
            });
        } else {
            for (var k in status) {
                if (Util.isArray(status[k])) {
                    $(status[k]).each(function () {
                        if (this === data[key]) {
                            data[k] = true;
                        }
                    });
                } else {
                    data[k] = status[k] === data[key];
                }
            }
        }
    },
    /**
     * @name 为状态添加文字表述
     * @param {Object|Array} data
     * @example
     *      var data= [{status:1},{status:2},...]
     *      Util.setStatusText(data,'status','statusText',{
     *          1:'待提交',
     *          2:'提交完成'
     *      })
     *      // [{status:1,statusText:'待提交'},{status:2,statusText:'提交完成'},...]
     */
    setStatusText: function (data, key, name, status) {
        if (Util.isArray(data)) {
            $(data).each(function () {
                Util.setStatusText(this, key, name, status);
            });
        } else {
            for (var k in status) {
                if (data[key] === k) data[name] = status[k];
            }
        }
    },
    /**
     * 页面resize事件优化
     * @param {*} callback 回调
     * @param {*} time 响应时间
     */
    pageResize: function (callback, time) {
        var resizeTimer = null;
        $(window).on('resize', function () {
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }
            resizeTimer = setTimeout(function () {
                callback();
            }, time || 400);
        });
    },
    /**
     * chosen下拉框通用渲染方法
     * @param {*} dom id或class
     * @param {*} data 数据
     */
    setChosenData: function (dom, data) {
        var $dom = $(dom),
            tips = $dom.attr('data-placeholder');
        $dom.empty();
        if (!(tips === '' || tips === undefined)) {
            $dom.html('<option value=""></option>');
        }
        $.each(data, function (i, e) {
            $dom.append('<option value="' + e.value + '">' + e.name + '</option>');
        });
        $dom.trigger('chosen:updated'); //更新
    }
});