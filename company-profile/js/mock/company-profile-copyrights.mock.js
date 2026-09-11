'use strict';
(function (win) {
    win.getMockCompanyCopyrightData = function () {
        var rows = [
            { name: '虚拟女主持人', registerNo: '国作登字-2020-F-01062563', category: '美术', publishDate: '2019-12-20', registerDate: '2020-07-01' },
            { name: '虚拟男主持人', registerNo: '国作登字-2020-F-01062562', category: '美术', publishDate: '2019-12-20', registerDate: '2020-07-01' },
            { name: '新点投标一体机系列版权', registerNo: '国作登字-2019-L-00836042', category: '其他', publishDate: '2019-06-20', registerDate: '2019-09-12' },
            { name: '新点投标一体机（投标文件制作软件）系列版权', registerNo: '国作登字-2019-L-00836041', category: '其他', publishDate: '2019-06-20', registerDate: '2019-09-12' },
            { name: '新点投标一体机（造价软件）系列版权', registerNo: '国作登字-2019-L-00836044', category: '其他', publishDate: '2019-06-20', registerDate: '2019-09-12' },
            { name: 'Epoint新点', registerNo: '国作登字-2018-F-00673505', category: '美术', publishDate: '2018-10-08', registerDate: '2018-12-14' },
            { name: '小桥系列图形', registerNo: '国作登字-2018-F-00661396', category: '美术', publishDate: '2017-12-03', registerDate: '2018-11-08' }
        ];
        return { total: rows.length, rows: rows };
    };
})(window);
