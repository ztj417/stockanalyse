'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    function filterBySectionName(list, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var rows = [];
        var index = 0;
        if (!kw) {
            return list.slice();
        }
        for (index = 0; index < list.length; index += 1) {
            if (String(list[index].sectionName || '').toLowerCase().indexOf(kw) >= 0) {
                rows.push(list[index]);
            }
        }
        return rows;
    }

    function buildTable(rows) {
        var htmlParts = ['<table class="enterprise-risk-table"><thead><tr><th>序号</th><th>标段名称</th><th>标段编号</th><th>问题类型</th><th>涉及单位</th><th>关联路径</th></tr></thead><tbody>'];
        var index = 0;
        if (rows.length === 0) {
            htmlParts.push('<tr><td colspan="6" class="enterprise-shareholder-empty">未匹配到符合条件的风险记录</td></tr>');
        } else {
            for (index = 0; index < rows.length; index += 1) {
                htmlParts.push('<tr>'
                    + '<td>' + (index + 1) + '</td>'
                    + '<td>' + utils.escapeHtml(rows[index].sectionName) + '</td>'
                    + '<td>' + utils.escapeHtml(rows[index].sectionCode) + '</td>'
                    + '<td>' + utils.escapeHtml(rows[index].riskType) + '</td>'
                    + '<td>' + utils.escapeHtml(rows[index].companyName) + '</td>'
                    + '<td>' + utils.escapeHtml(rows[index].relatedPath) + '</td>'
                    + '</tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.risks = {
        label: '风险情况',
        render: function (company, context) {
            var data = win.companyProfileDataProvider.getRisks(company);
            var filteredRows = filterBySectionName(data.rows, context.riskKeyword);
            var paged = utils.paginate(filteredRows, context.paginationState.risk, context.pageSize);
            var resetVisible = context.riskKeyword ? '' : ' is-hidden';

            return '<section class="enterprise-risk-card">'
                + '<div class="enterprise-risk-head">'
                + '<h3>风险情况</h3>'
                + '<div class="enterprise-shareholder-search enterprise-risk-search">'
                + '<button type="button" class="enterprise-shareholder-search-trigger" data-risk-search-trigger title="搜索">' + utils.buildUiIcon('search') + '</button>'
                + '<input type="text" placeholder="搜索标段名称" value="' + utils.escapeHtml(context.riskKeyword) + '" data-risk-search-input>'
                + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-risk-search-reset title="清除">×</button>'
                + '</div></div>'
                + buildTable(paged.rows)
                + utils.buildPaginationHtml('risk', paged.page, paged.totalPages)
                + '</section>';
        }
    };
})(window);

