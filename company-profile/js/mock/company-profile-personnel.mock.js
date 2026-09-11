'use strict';
(function (win) {
    function getPosition(index, isHistory) {
        if (!isHistory && index === 6) {
            return '董事长,总经理';
        }
        if (isHistory && index % 5 === 0) {
            return '监事';
        }
        if (isHistory && index % 4 === 0) {
            return '经理';
        }
        return '董事';
    }

    function getHistoryDate(index) {
        var dates = ['2023-10-27', '2022-08-15', '2021-04-09', '2020-11-18', '2019-06-30', '2018-03-29'];
        return dates[index % dates.length];
    }

    win.getMockCompanyPersonnelData = function () {
        var currentNames = ['王枫', '管红梅', '邓书超', '赵琼华', '高金秀', '李兴奎', '余绍彬', '赵翰臻', '王燕奎'];
        var currentDates = ['2026-08-13', '2026-06-25', '2025-09-24', '2025-09-24', '2025-09-24', '2024-01-19', '2024-01-19', '2023-10-27', '2018-03-29'];
        var historyNames = ['吴鸣', '马利波', '赵志宏', '李兴奎', '余绍彬', '王燕奎', '赵翰臻', '管红梅', '高金秀', '王枫', '邓书超', '赵琼华', '陈建华', '刘云华', '杨晓东', '张志刚', '李国强', '周明', '孙健', '何平', '罗勇', '段敏', '郭磊', '韩旭', '许峰', '沈青', '唐鹏', '蔡琳', '廖军'];
        var rows = [];
        var index = 0;

        for (index = 0; index < currentNames.length; index += 1) {
            rows.push({
                name: currentNames[index],
                position: getPosition(index, false),
                shareRatio: '-',
                startDate: currentDates[index],
                isHistory: false
            });
        }
        for (index = 0; index < historyNames.length; index += 1) {
            rows.push({
                name: historyNames[index],
                position: getPosition(index, true),
                shareRatio: '-',
                startDate: getHistoryDate(index),
                isHistory: true
            });
        }
        return { total: rows.length, rows: rows };
    };
})(window);
