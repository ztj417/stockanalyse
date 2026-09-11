'use strict';
(function (win) {
    function getPatentPrefix(company) {
        if (company.name && company.name.indexOf('建设') >= 0) {
            return '土石料';
        }
        return '工程材料';
    }

    win.getMockCompanyPatentData = function (company) {
        var prefix = getPatentPrefix(company);
        var rows = [
            { name: '一种改性明胶和铜掺杂二氧化锰低甲醛脲醛胶及制备方法', type: '中国发明专利', status: '未授权', applyNo: 'CN202610044763.9', applyDate: '2026-01-14', summary: '本发明涉及胶黏剂制备技术领域，公开了一种铜掺杂二氧化锰低甲醛脲醛胶和制备方法。' },
            { name: '一种用于市政工程的抑尘喷淋装置', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202522453663.5', applyDate: '2025-11-19', summary: '本实用新型提供了一种抑尘喷淋技术方案，解决施工现场扬尘控制和喷雾覆盖效率问题。' },
            { name: '一种市政管道工程的沟槽支护结构', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202522419910.X', applyDate: '2025-11-14', summary: '本实用新型提供了一种沟槽支护结构，提高管道施工过程中的支撑稳定性。' },
            { name: '一种建筑施工用的铝模板底角成型结构', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202521988010.0', applyDate: '2025-09-16', summary: '本实用新型公开了一种建筑施工模板构件，改善底角连接和成型质量。' },
            { name: prefix + '全自动智能筛分计量装置用上料机构', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202521593880.8', applyDate: '2025-07-29', summary: '本实用新型公开了一种上料机构，包括横向移载部件和计量输送部件。' }
        ];
        return { total: 179, rows: rows };
    };
})(window);
