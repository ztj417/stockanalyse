'use strict';
(function (win) {
    win.getMockCompanyRegistrationData = function (company) {
        var utils = win.companyProfileModuleUtils;
        var creditCode = utils.getCreditCode(company);
        var establishDate = utils.getEstablishDate(company);
        var capital = company.registeredCapital || '-';
        var address = company.address || '-';
        var industry = utils.getIndustry(company);
        return {
            companyName: company.name || '-',
            creditCode: creditCode,
            legalPerson: company.legalPerson || '-',
            status: company.status || '存续（在营、开业、在册）',
            establishDate: establishDate,
            registeredCapital: capital,
            paidCapital: utils.getPaidCapital(capital),
            enterpriseType: utils.getEnterpriseType(company),
            businessTerm: establishDate + '至无固定期限',
            orgCode: utils.getOrgCode(creditCode),
            registerNo: utils.getRegisterNo(creditCode),
            taxpayerNo: creditCode,
            taxpayerQualification: '一般纳税人',
            staffSize: '-',
            socialSecurityCount: '-',
            approveDate: utils.getApproveDate(),
            area: utils.getArea(address),
            registry: utils.getRegistry(address),
            importExportCode: '-',
            industry: industry,
            industryCode: utils.getIndustryCode(industry),
            englishName: '-',
            coordinate: utils.getCoordinate(address),
            registerAddress: address,
            contactAddress: address
        };
    };
})(window);
