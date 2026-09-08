/**
 * jQuery MiniUI v3.0
 * 
 * Web Site : http://www.miniui.com
 *
 * Commercial License : http://www.miniui.com/license
 *
 * Copyright(c) 2012 All Rights Reserved. Shanghai PusSoft Co., Ltd (上海普加软件有限公司) [ services@plusoft.com.cn ]. 
 * 
 */


mini.locale = "zh_CN";


/* Date
-----------------------------------------------------------------------------*/

mini.dateInfo = {
    monthsLong: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    daysLong: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    daysShort: ["日", "一", "二", "三", "四", "五", "六"],
    quarterLong: ['一季度', '二季度', '三季度', '四季度'],
    quarterShort: ['Q1', 'Q2', 'Q2', 'Q4'],
    halfYearLong: ['上半年', '下半年'],
    patterns: {
        "d": "yyyy-M-d",
        "D": "yyyy年M月d日",
        "f": "yyyy年M月d日 H:mm",
        "F": "yyyy年M月d日 H:mm:ss",
        "g": "yyyy-M-d H:mm",
        "G": "yyyy-M-d H:mm:ss",
        "m": "MMMd日",
        "o": "yyyy-MM-ddTHH:mm:ss.fff",
        "s": "yyyy-MM-ddTHH:mm:ss",
        "t": "H:mm",
        "T": "H:mm:ss",
        "U": "yyyy年M月d日 HH:mm:ss",
        "y": "yyyy年MM月"
    },
    tt: {
        "AM": "上午",
        "PM": "下午"
    },
    ten: {
        "Early": "上旬",
        "Mid": "中旬",
        "Late": "下旬"
    },
    today: '今天',
    clockType: 24
};

/* Number
-----------------------------------------------------------------------------*/
mini.cultures["zh-CN"] = {
    name: "zh-CN",
    numberFormat: {
        number: {
            pattern: ["n", "-n"],
            decimals: 2,
            decimalsSeparator: ".",
            groupSeparator: ",",
            groupSize: [3]
        },
        percent: {
            pattern: ["n%", "-n%"],
            decimals: 2,
            decimalsSeparator: ".",
            groupSeparator: ",",
            groupSize: [3],
            symbol: "%"
        },
        currency: {
            pattern: ["$n", "$-n"],
            decimals: 2,
            decimalsSeparator: ".",
            groupSeparator: ",",
            groupSize: [3],
            symbol: "¥"
        }
    }
}
mini.culture("zh-CN");

/* MessageBox
-----------------------------------------------------------------------------*/
if (mini.MessageBox) {
    mini.copyTo(mini.MessageBox, {
        alertTitle: "提醒",
        confirmTitle: "确认",
        prompTitle: "输入",
        prompMessage: "请输入内容：",
        buttonText: {
            ok: "确定", //"OK",
            cancel: "取消", //"Cancel",
            yes: "是", //"Yes",
            no: "否" //"No"
        }
    });
};

/* Calendar
-----------------------------------------------------------------------------*/
if (mini.Calendar) {
    mini.copyTo(mini.Calendar.prototype, {
        firstDayOfWeek: 0,
        yesterdayText: "昨天",
        todayText: "今天",
        clearText: "清除",
        okText: "确定",
        cancelText: "取消",
        daysShort: ["日", "一", "二", "三", "四", "五", "六"],
        format: "yyyy年MM月",

        timeFormat: 'H:mm'
    });
}


/* required | loadingMsg
-----------------------------------------------------------------------------*/
for (var id in mini) {
    var clazz = mini[id];
    if (clazz && clazz.prototype && clazz.prototype.isControl) {
        clazz.prototype.requiredErrorText = "不能为空";
        clazz.prototype.loadingMsg = "Loading...";
    }

}
/* VTypes
-----------------------------------------------------------------------------*/
if (mini.VTypes) {
    mini.copyTo(mini.VTypes, {
        minDateErrorText: '不能小于日期 {0}',
        maxDateErrorText: '不能大于日期 {0}',

        uniqueErrorText: "字段不能重复",
        requiredErrorText: "不能为空",
        emailErrorText: "请输入邮件格式",
        urlErrorText: "请输入URL格式",
        floatErrorText: "请输入数字",
        intErrorText: "请输入整数",
        dateErrorText: "请输入日期格式 {0}",
        maxLengthErrorText: "不能超过 {0} 个字符",
        minLengthErrorText: "不能少于 {0} 个字符",
        maxErrorText: "数字不能大于 {0} ",
        minErrorText: "数字不能小于 {0} ",
        rangeLengthErrorText: "字符长度必须在 {0} 到 {1} 之间",
        rangeCharErrorText: "字符数必须在 {0} 到 {1} 之间",
        rangeErrorText: "数字必须在 {0} 到 {1} 之间"
    });
}

/* Pager
-----------------------------------------------------------------------------*/
if (mini.Pager) {
    mini.copyTo(mini.Pager.prototype, {
        firstText: "首页",
        prevText: "上一页",
        nextText: "下一页",
        lastText: "尾页",
        pageInfoText: "每页 {0} 条, 共 {1} 条"
    });
}

/* DataGrid
-----------------------------------------------------------------------------*/
if (mini.DataGrid) {
    mini.copyTo(mini.DataGrid.prototype, {
        emptyText: "没有返回的数据"
    });
}

/* WebUploader
-----------------------------------------------------------------------------*/
if (mini.WebUploader) {
    mini.copyTo(mini.WebUploader.prototype, {
        pickerText: '选择文件',
        startText: '开始上传',
        pauseText: '暂停上传',
        numLimitErrorText: '选择的文件过多！</br>最多可上传{0}个文件',
        sizeLimitErrorText: '选择的文件过大！</br>最多可上传{0}KB文件',
        typeDeniedErrorText: '选择的文件类型错误！</br>可上传的文件类型为：{0}',
        sizeErrorText: '选择的文件过大！</br>可上传的单文件最大为{0}KB'
    });
}

/* DataExport
-----------------------------------------------------------------------------*/
if (mini.DataExport) {
    mini.copyTo(mini.DataExport.prototype, {
        expandText: '关闭导出面板',
        collapseText: '打开导出面板',
        exportText: '导 出',
        panelTitle: '导出列配置',
        leftListTitle: '待选列',
        rightListTitle: '已选列',
        tipInfo: '不填页码即导出当前页',
        pageNumInfo: '页导出到第',
        pageText: '页'
    });
}

/**
 * Epoint F9
 * 
 */

/* condition search button
-----------------------------------------------------------------------------*/
var epoint_search_text = '搜索';
var epoint_search_title = '展开更多条件';
