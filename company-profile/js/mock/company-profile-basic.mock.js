'use strict';
(function (win) {
    win.getMockCompanyBasicInfoData = function (company) {
        var utils = win.companyProfileModuleUtils || {};
        return {
            name: company.name || '企业名称未登记',
            legalPerson: company.legalPerson || '-',
            registeredCapital: company.registeredCapital || '-',
            creditCode: (utils.getCreditCode ? utils.getCreditCode(company) : company.creditCode) || '-',
            establishDate: (utils.getEstablishDate ? utils.getEstablishDate(company) : company.establishDate) || '-',
            phone: company.phone || '-',
            email: company.email || '-',
            address: company.address || '-',
            industry: (utils.getIndustry ? utils.getIndustry(company) : company.industry) || '-',
            enterpriseType: (utils.getEnterpriseType ? utils.getEnterpriseType(company) : company.enterpriseType) || '-',
            website: (utils.getWebsite ? utils.getWebsite(company) : company.website) || '-',
            employeeCount: (utils.getEmployeeCount ? utils.getEmployeeCount(company) : company.employeeCount) || '-',
            businessScope: (utils.getScope ? utils.getScope(company) : company.businessScope) || '-',
            updateDate: (utils.getUpdateDate ? utils.getUpdateDate(company) : company.updateDate) || '-',
            status: company.status || '存续（在营、开业、在册）',
            tags: company.tags || ['小型企业', '地方国企']
        };
    };
})(window);
