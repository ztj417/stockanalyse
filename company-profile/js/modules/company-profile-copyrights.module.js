'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    function filterByRegisterNo(rows, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var result = [];
        var index = 0;
        if (!kw) {
            return rows.slice();
        }
        for (index = 0; index < rows.length; index += 1) {
            if (String(rows[index].registerNo || '').toLowerCase().indexOf(kw) >= 0) {
                result.push(rows[index]);
            }
        }
        return result;
    }

    function buildTable(rows) {
        var htmlParts = ['<table class="enterprise-ip-table enterprise-ip-table--copyright"><thead><tr><th>序号</th><th>作品名称</th><th>登记号</th><th>类别</th><th>首次发布日期</th><th>登记日期</th></tr></thead><tbody>'];
        var index = 0;
        if (rows.length === 0) {
            htmlParts.push('<tr><td colspan="6" class="enterprise-shareholder-empty">未匹配到符合条件的著作权</td></tr>');
        } else {
            for (index = 0; index < rows.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + utils.escapeHtml(rows[index].name) + '</td><td>' + utils.escapeHtml(rows[index].registerNo) + '</td><td>' + utils.escapeHtml(rows[index].category) + '</td><td>' + utils.escapeHtml(rows[index].publishDate) + '</td><td>' + utils.escapeHtml(rows[index].registerDate) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.copyrights = {
        label: '著作权信息',
        render: function (company, context) {
            var data = win.companyProfileDataProvider.getCopyrights(company);
            var filteredRows = filterByRegisterNo(data.rows, context.copyrightKeyword);
            var paged = utils.paginate(filteredRows, context.paginationState.copyright, context.pageSize);
            var resetVisible = context.copyrightKeyword ? '' : ' is-hidden';
            return '<section class="enterprise-ip-card">'
                + '<div class="enterprise-ip-toolbar enterprise-ip-toolbar--standalone"><div></div>'
                + '<div class="enterprise-shareholder-search enterprise-ip-search">'
                + '<button type="button" class="enterprise-shareholder-search-trigger" data-copyright-search-trigger title="搜索">' + utils.buildUiIcon('search') + '</button>'
                + '<input type="text" placeholder="搜索登记号" value="' + utils.escapeHtml(context.copyrightKeyword) + '" data-copyright-search-input>'
                + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-copyright-search-reset title="清除">×</button>'
                + '</div></div>'
                + buildTable(paged.rows)
                + utils.buildPaginationHtml('copyright', paged.page, paged.totalPages)
                + '</section>';
        }
    };
})(window);

