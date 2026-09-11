'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    function buildTable(rows) {
        var htmlParts = ['<table class="enterprise-ip-table enterprise-ip-table--domain"><thead><tr><th>序号</th><th>域名</th><th>网站备案许可号</th><th>主页URL</th><th>主办单位性质</th><th>核查日期</th></tr></thead><tbody>'];
        var index = 0;
        for (index = 0; index < rows.length; index += 1) {
            htmlParts.push('<tr>'
                + '<td>' + (index + 1) + '</td>'
                + '<td>' + utils.escapeHtml(rows[index].domain) + '</td>'
                + '<td>' + utils.escapeHtml(rows[index].icp) + '</td>'
                + '<td>' + utils.escapeHtml(rows[index].homeUrl) + '</td>'
                + '<td>' + utils.escapeHtml(rows[index].ownerType) + '</td>'
                + '<td>' + utils.escapeHtml(rows[index].checkDate) + '</td>'
                + '</tr>');
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.domains = {
        label: '域名信息',
        render: function (company, context) {
            var data = win.companyProfileDataProvider.getDomains(company);
            var paged = utils.paginate(data.rows, context.paginationState.domain, context.pageSize);
            return '<section class="enterprise-ip-card">'
                + buildTable(paged.rows)
                + utils.buildPaginationHtml('domain', paged.page, paged.totalPages)
                + '</section>';
        }
    };
})(window);

