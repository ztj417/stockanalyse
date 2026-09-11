'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    function buildSummaryField(label, value) {
        return '<div class="enterprise-summary-field"><span>' + utils.escapeHtml(label) + '：</span><span class="enterprise-summary-value">' + utils.escapeHtml(value || '-') + '</span></div>';
    }

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.basic = {
        label: '单位基本信息',
        renderHeader: function (company) {
            var data = win.companyProfileDataProvider.getBasicInfo(company);
            var logoText = utils.getLogoText(data.name || '');
            var htmlParts = [];
            htmlParts.push('<section class="enterprise-hero">');
            htmlParts.push('<div class="enterprise-brand-card"><span>' + utils.escapeHtml(logoText.first) + '</span><span>' + utils.escapeHtml(logoText.second) + '</span></div>');
            htmlParts.push('<div class="enterprise-hero-main">');
            htmlParts.push('<div class="enterprise-title-row"><h2>' + utils.escapeHtml(data.name) + '</h2><span class="enterprise-status">' + utils.escapeHtml(data.status) + '</span></div>');
            htmlParts.push('<div class="enterprise-tag-row"><span>' + utils.escapeHtml(data.tags[0] || '小型企业') + '</span><span>' + utils.escapeHtml(data.tags[1] || '地方国企') + '</span><div class="enterprise-update-row">' + utils.buildUiIcon('clock') + '<span>数据更新： ' + utils.escapeHtml(data.updateDate) + '</span></div></div>');
            htmlParts.push('</div>');
            htmlParts.push('<div class="enterprise-summary-grid">');
            htmlParts.push('<div>' + buildSummaryField('统一社会信用代码', data.creditCode) + buildSummaryField('法定代表人', data.legalPerson) + buildSummaryField('注册资本', data.registeredCapital) + buildSummaryField('成立日期', data.establishDate) + '</div>');
            htmlParts.push('<div>' + buildSummaryField('电话', data.phone) + buildSummaryField('邮箱', data.email) + buildSummaryField('官网', data.website) + buildSummaryField('地址', data.address) + '</div>');
            htmlParts.push('<div>' + buildSummaryField('所处行业', data.industry) + buildSummaryField('企业类型', data.enterpriseType) + buildSummaryField('员工人数', data.employeeCount) + buildSummaryField('经营范围', data.businessScope) + '</div>');
            htmlParts.push('</div></section>');
            return htmlParts.join('');
        },
        render: function (company) {
            var data = win.companyProfileDataProvider.getBasicInfo(company);
            var htmlParts = [];
            htmlParts.push('<section class="enterprise-reg-card enterprise-basic-card">');
            htmlParts.push('<table class="enterprise-reg-table"><tbody>');
            htmlParts.push(utils.buildTableRow('企业名称', data.name, '统一社会信用代码', data.creditCode, '法定代表人', data.legalPerson));
            htmlParts.push(utils.buildTableRow('登记状态', data.status, '成立日期', data.establishDate, '注册资本', data.registeredCapital));
            htmlParts.push(utils.buildTableRow('联系电话', data.phone, '电子邮箱', data.email, '企业官网', data.website));
            htmlParts.push(utils.buildTableRow('所处行业', data.industry, '企业类型', data.enterpriseType, '员工人数', data.employeeCount));
            htmlParts.push(utils.buildTableRow('通信地址', data.address));
            htmlParts.push('</tbody></table></section>');
            return htmlParts.join('');
        }
    };
})(window);
