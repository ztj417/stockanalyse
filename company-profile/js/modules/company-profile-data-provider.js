'use strict';
(function (win) {
    var provider = {};

    function readModuleData(company, key) {
        if (!company || !company.moduleData) {
            return null;
        }
        return company.moduleData[key] || null;
    }

    provider.getBasicInfo = function (company) {
        return readModuleData(company, 'basic') || win.getMockCompanyBasicInfoData(company);
    };

    provider.getRegistration = function (company) {
        return readModuleData(company, 'registration') || win.getMockCompanyRegistrationData(company);
    };

    provider.getShareholders = function (company) {
        return readModuleData(company, 'shareholders') || win.getMockCompanyShareholderData(company);
    };

    provider.getPersonnel = function (company) {
        return readModuleData(company, 'personnel') || win.getMockCompanyPersonnelData(company);
    };

    provider.getAnnualReports = function (company) {
        return readModuleData(company, 'annualReports') || win.getMockCompanyAnnualReportData(company);
    };

    provider.getTopology = function (company) {
        return readModuleData(company, 'topology') || win.getMockCompanyTopologyData(company);
    };

    provider.getRisks = function (company) {
        return readModuleData(company, 'risks') || win.getMockCompanyRiskData(company);
    };

    provider.getPatents = function (company) {
        return readModuleData(company, 'patents') || win.getMockCompanyPatentData(company);
    };

    provider.getCopyrights = function (company) {
        return readModuleData(company, 'copyrights') || win.getMockCompanyCopyrightData(company);
    };

    provider.getDomains = function (company) {
        return readModuleData(company, 'domains') || win.getMockCompanyDomainData(company);
    };

    win.companyProfileDataProvider = provider;
})(window);
