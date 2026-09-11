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
        var htmlParts = ['<table class="enterprise-shareholder-table"><thead><tr><th>序号</th><th>股东</th><th>持股比例</th><th>认缴出资额</th><th>实缴出资额</th><th>认缴出资日期</th></tr></thead><tbody>'];
        var index = 0;
        if (rows.length === 0) {
            htmlParts.push('<tr><td colspan="6" class="enterprise-shareholder-empty">未匹配到符合条件的股东</td></tr>');
        } else {
            for (index = 0; index < rows.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td><span class="enterprise-shareholder-name">' + utils.escapeHtml(rows[index].name) + '</span></td><td>' + utils.escapeHtml(rows[index].ratio) + '</td><td>' + utils.escapeHtml(rows[index].subscribedAmount) + '</td><td>' + utils.escapeHtml(rows[index].paidAmount) + '</td><td>' + utils.escapeHtml(rows[index].subscribedDate) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.shareholders = {
        label: '股东信息',
        render: function (company, context) {
            var data = win.companyProfileDataProvider.getShareholders(company);
            var isHistory = !!context.shareholderHistory;
            var activeRows = [];
            var index = 0;
            for (index = 0; index < data.rows.length; index += 1) {
                if (data.rows[index].isHistory === isHistory) {
                    activeRows.push(data.rows[index]);
                }
            }
            var filteredRows = filterByName(activeRows, context.shareholderKeyword);
            var pageKey = isHistory ? 'shareholderHistory' : 'shareholder';
            var paged = utils.paginate(filteredRows, context.paginationState[pageKey], context.pageSize);
            var resetVisible = context.shareholderKeyword ? '' : ' is-hidden';

            return '<section class="enterprise-shareholder-card">'
                + '<div class="enterprise-shareholder-head">'
                + '<div class="enterprise-shareholder-switch">'
                + '<button type="button" class="' + (isHistory ? '' : 'is-active') + '" data-enterprise-shareholder-history="false">股东信息</button>'
                + '<button type="button" class="' + (isHistory ? 'is-active' : '') + '" data-enterprise-shareholder-history="true">历史股东信息</button>'
                + '</div>'
                + '<div class="enterprise-shareholder-search">'
                + '<button type="button" class="enterprise-shareholder-search-trigger" data-shareholder-search-trigger title="搜索">' + utils.buildUiIcon('search') + '</button>'
                + '<input type="text" placeholder="搜索股东名称" value="' + utils.escapeHtml(context.shareholderKeyword) + '" data-shareholder-search-input>'
                + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-shareholder-search-reset title="清除">×</button>'
                + '</div></div>'
                + buildTable(paged.rows)
                + utils.buildPaginationHtml(pageKey, paged.page, paged.totalPages)
                + '</section>';
        }
    };
})(window);
