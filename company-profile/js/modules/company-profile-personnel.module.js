'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    function filterByName(list, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var rows = [];
        var index = 0;
        if (!kw) {
            return list.slice();
        }
        for (index = 0; index < list.length; index += 1) {
            if (String(list[index].name || '').toLowerCase().indexOf(kw) >= 0) {
                rows.push(list[index]);
            }
        }
        return rows;
    }

    function buildTable(rows) {
        var htmlParts = ['<table class="enterprise-personnel-table"><thead><tr><th>序号</th><th>姓名</th><th>职位</th><th>持股比例</th><th>任职实际开始时间</th></tr></thead><tbody>'];
        var index = 0;
        if (rows.length === 0) {
            htmlParts.push('<tr><td colspan="5" class="enterprise-shareholder-empty">未匹配到符合条件的人员</td></tr>');
        } else {
            for (index = 0; index < rows.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + utils.escapeHtml(rows[index].name) + '</td><td>' + utils.escapeHtml(rows[index].position) + '</td><td>' + utils.escapeHtml(rows[index].shareRatio) + '</td><td>' + utils.escapeHtml(rows[index].startDate) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.personnel = {
        label: '主要人员',
        render: function (company, context) {
            var data = win.companyProfileDataProvider.getPersonnel(company);
            var isHistory = !!context.personnelHistory;
            var activeRows = [];
            var index = 0;
            for (index = 0; index < data.rows.length; index += 1) {
                if (data.rows[index].isHistory === isHistory) {
                    activeRows.push(data.rows[index]);
                }
            }
            var filteredRows = filterByName(activeRows, context.personnelKeyword);
            var pageKey = isHistory ? 'personnelHistory' : 'personnel';
            var paged = utils.paginate(filteredRows, context.paginationState[pageKey], context.pageSize);
            var resetVisible = context.personnelKeyword ? '' : ' is-hidden';

            return '<section class="enterprise-personnel-card">'
                + '<div class="enterprise-personnel-head">'
                + '<div class="enterprise-personnel-switch">'
                + '<button type="button" class="' + (isHistory ? '' : 'is-active') + '" data-enterprise-personnel-history="false">主要人员</button>'
                + '<button type="button" class="' + (isHistory ? 'is-active' : '') + '" data-enterprise-personnel-history="true">历史主要人员</button>'
                + '</div>'
                + '<div class="enterprise-shareholder-search enterprise-personnel-search">'
                + '<button type="button" class="enterprise-shareholder-search-trigger" data-personnel-search-trigger title="搜索">' + utils.buildUiIcon('search') + '</button>'
                + '<input type="text" placeholder="搜索人员姓名" value="' + utils.escapeHtml(context.personnelKeyword) + '" data-personnel-search-input>'
                + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-personnel-search-reset title="清除">×</button>'
                + '</div></div>'
                + buildTable(paged.rows)
                + utils.buildPaginationHtml(pageKey, paged.page, paged.totalPages)
                + '</section>';
        }
    };
})(window);

