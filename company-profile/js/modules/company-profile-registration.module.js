'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.registration = {
        label: '工商信息',
        render: function (company) {
            var data = win.companyProfileDataProvider.getRegistration(company);
            var htmlParts = [];
            htmlParts.push('<section class="enterprise-reg-card">');
            htmlParts.push('<table class="enterprise-reg-table"><tbody>');
            htmlParts.push(utils.buildTableRow('企业名称', data.companyName, '统一社会信用代码', data.creditCode, '法定代表人', data.legalPerson));
            htmlParts.push(utils.buildTableRow('登记状态', data.status, '成立日期', data.establishDate, '注册资本', data.registeredCapital));
            htmlParts.push(utils.buildTableRow('实缴资本', data.paidCapital, '企业类型', data.enterpriseType, '营业期限', data.businessTerm));
            htmlParts.push(utils.buildTableRow('组织机构代码', data.orgCode, '工商注册号', data.registerNo, '纳税人识别号', data.taxpayerNo));
            htmlParts.push(utils.buildTableRow('纳税人资质', data.taxpayerQualification, '人员规模', data.staffSize, '参保人数', data.socialSecurityCount));
            htmlParts.push(utils.buildTableRow('核准日期', data.approveDate, '所属地区', data.area, '登记机关', data.registry));
            htmlParts.push(utils.buildTableRow('进出口企业代码', data.importExportCode, '国标行业', data.industry, '行业代码', data.industryCode));
            htmlParts.push(utils.buildTableRow('英文名', data.englishName, '注册地址经纬度', data.coordinate, '注册地址', data.registerAddress));
            htmlParts.push(utils.buildTableRow('通信地址', data.contactAddress));
            htmlParts.push('</tbody></table></section>');
            return htmlParts.join('');
        }
    };
})(window);
