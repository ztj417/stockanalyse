'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.annualReports = {
        label: '企业年报',
        render: function (company) {
            var data = win.companyProfileDataProvider.getAnnualReports(company);
            var htmlParts = ['<section class="enterprise-annual-card"><table class="enterprise-annual-table"><thead><tr><th>序号</th><th>年报年份</th><th>电子邮箱</th><th>企业通信地址</th><th>企业联系电话</th></tr></thead><tbody>'];
            var index = 0;
            for (index = 0; index < data.rows.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + utils.escapeHtml(data.rows[index].year) + '</td><td>' + utils.escapeHtml(data.rows[index].email) + '</td><td>' + utils.escapeHtml(data.rows[index].address) + '</td><td>' + utils.escapeHtml(data.rows[index].phone) + '</td></tr>');
            }
            htmlParts.push('</tbody></table></section>');
            return htmlParts.join('');
        }
    };
})(window);

