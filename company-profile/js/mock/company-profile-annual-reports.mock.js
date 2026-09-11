'use strict';
(function (win) {
    win.getMockCompanyAnnualReportData = function (company) {
        var reportYears = ['2025', '2024', '2023'];
        var email = company.email;
        var phone = company.phone;
        var address = company.address;
        var rows = [];
        var index = 0;

        if (!email || email === '无') {
            email = '-';
        }
        if (!phone || phone === '无') {
            phone = '-';
        }
        if (!address) {
            address = '-';
        }
        for (index = 0; index < reportYears.length; index += 1) {
            rows.push({
                year: reportYears[index],
                email: email,
                address: address,
                phone: phone
            });
        }
        return { total: rows.length, rows: rows };
    };
})(window);
