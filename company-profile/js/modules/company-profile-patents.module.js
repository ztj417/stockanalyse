'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    function filterByApplyNo(rows, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var result = [];
        var index = 0;
        if (!kw) {
            return rows.slice();
        }
        for (index = 0; index < rows.length; index += 1) {
            if (String(rows[index].applyNo || '').toLowerCase().indexOf(kw) >= 0) {
                result.push(rows[index]);
            }
        }
        return result;
    }

    function buildTable(rows) {
        var htmlParts = ['<table class="enterprise-ip-table enterprise-ip-table--patent"><thead><tr><th>序号</th><th>专利名称</th><th>专利类型</th><th>授权状态</th><th>专利申请号</th><th>专利申请日</th><th>摘要</th></tr></thead><tbody>'];
        var index = 0;
        if (rows.length === 0) {
            htmlParts.push('<tr><td colspan="7" class="enterprise-shareholder-empty">未匹配到符合条件的专利</td></tr>');
        } else {
            for (index = 0; index < rows.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + utils.escapeHtml(rows[index].name) + '</td><td>' + utils.escapeHtml(rows[index].type) + '</td><td>' + utils.escapeHtml(rows[index].status) + '</td><td>' + utils.escapeHtml(rows[index].applyNo) + '</td><td>' + utils.escapeHtml(rows[index].applyDate) + '</td><td>' + utils.escapeHtml(rows[index].summary) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.patents = {
        label: '专利信息',
        render: function (company, context) {
            var data = win.companyProfileDataProvider.getPatents(company);
            var filteredRows = filterByApplyNo(data.rows, context.patentKeyword);
            var paged = utils.paginate(filteredRows, context.paginationState.patent, context.pageSize);
            var resetVisible = context.patentKeyword ? '' : ' is-hidden';
            return '<section class="enterprise-ip-card">'
                + '<div class="enterprise-ip-toolbar enterprise-ip-toolbar--standalone"><div></div>'
                + '<div class="enterprise-shareholder-search enterprise-ip-search">'
                + '<button type="button" class="enterprise-shareholder-search-trigger" data-patent-search-trigger title="搜索">' + utils.buildUiIcon('search') + '</button>'
                + '<input type="text" placeholder="搜索专利申请号" value="' + utils.escapeHtml(context.patentKeyword) + '" data-patent-search-input>'
                + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-patent-search-reset title="清除">×</button>'
                + '</div></div>'
                + buildTable(paged.rows)
                + utils.buildPaginationHtml('patent', paged.page, paged.totalPages)
                + '</section>';
        }
    };
})(window);

