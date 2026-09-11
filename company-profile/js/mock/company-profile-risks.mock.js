'use strict';
(function (win) {
    win.getMockCompanyRiskData = function (company) {
        var pathTemplates = [
            '该单位法定代表人同时担任同标段另一投标单位股东',
            '该单位联系电话与同标段另一投标单位完全一致',
            '该单位电子邮箱域名与同标段另一投标单位相同，疑似同一主体',
            '该单位注册地址与同标段另一投标单位相邻，存在异常群租'
        ];
        var rows = [];
        var sectionList = (win.companyProfileMockData && win.companyProfileMockData.sectionList) || [];
        var sectionIndex = 0;
        var companyIndex = 0;
        var flagIndex = 0;

        for (sectionIndex = 0; sectionIndex < sectionList.length; sectionIndex += 1) {
            var section = sectionList[sectionIndex];
            var companies = section.companies || [];
            for (companyIndex = 0; companyIndex < companies.length; companyIndex += 1) {
                var currentCompany = companies[companyIndex];
                if (!currentCompany || currentCompany.name !== company.name) {
                    continue;
                }
                var riskFlags = currentCompany.riskFlags || [];
                for (flagIndex = 0; flagIndex < riskFlags.length; flagIndex += 1) {
                    rows.push({
                        sectionName: section.name || '-',
                        sectionCode: section.code || '-',
                        riskType: riskFlags[flagIndex],
                        companyName: currentCompany.name || '-',
                        relatedPath: pathTemplates[flagIndex % pathTemplates.length]
                    });
                }
            }
        }
        return { total: rows.length, rows: rows };
    };
})(window);
