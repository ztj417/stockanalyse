'use strict';
(function (win) {
    function getSubscribedAmount(company, ratio, index) {
        var utils = win.companyProfileModuleUtils;
        var capital = parseFloat(String(company.registeredCapital || '').replace(/,/g, ''));
        var percent = parseFloat(String(ratio || '').replace('%', ''));
        if (!isNaN(capital) && !isNaN(percent)) {
            return utils.formatAmount(capital * percent / 100) + '万人民币';
        }
        if (index === 0) {
            return '60907.535万人民币';
        }
        if (index === 1) {
            return '1099.81万人民币';
        }
        return '-';
    }

    function getFallbackShareholderName(company, index) {
        if (index === 0) {
            return '云南省建设投资控股集团有限公司';
        }
        if (company.name && company.name.indexOf('第四') >= 0) {
            return '云南建投第一水利水电建设有限公司';
        }
        return '关联出资单位';
    }

    function getSubscribedDate(index) {
        if (index === 0) {
            return '2017-03-15';
        }
        if (index === 1) {
            return '-';
        }
        return '2019-06-21';
    }

    win.getMockCompanyShareholderData = function (company) {
        var shareholders = company.shareholders || [];
        var rows = [];
        var index = 0;

        if (shareholders.length > 0) {
            for (index = 0; index < shareholders.length; index += 1) {
                rows.push({
                    name: shareholders[index].name || '未登记',
                    ratio: shareholders[index].ratio || '-',
                    subscribedAmount: getSubscribedAmount(company, shareholders[index].ratio, index),
                    paidAmount: '-',
                    subscribedDate: getSubscribedDate(index),
                    isHistory: false
                });
            }
        } else {
            rows.push({
                name: getFallbackShareholderName(company, 0),
                ratio: '98.23%',
                subscribedAmount: getSubscribedAmount(company, '98.23%', 0),
                paidAmount: '-',
                subscribedDate: '2017-03-15',
                isHistory: false
            });
            rows.push({
                name: getFallbackShareholderName(company, 1),
                ratio: '1.77%',
                subscribedAmount: getSubscribedAmount(company, '1.77%', 1),
                paidAmount: '-',
                subscribedDate: '-',
                isHistory: false
            });
        }

        rows.push({
            name: '云南省建设投资控股集团有限公司',
            ratio: '98.23%',
            subscribedAmount: getSubscribedAmount(company, '98.23%', 0),
            paidAmount: '-',
            subscribedDate: '2017-03-15',
            isHistory: true
        });
        rows.push({
            name: '云南建投第一水利水电建设有限公司',
            ratio: '1.77%',
            subscribedAmount: getSubscribedAmount(company, '1.77%', 1),
            paidAmount: '-',
            subscribedDate: '-',
            isHistory: true
        });
        rows.push({
            name: '云南工程建设总承包股份有限公司',
            ratio: '12.50%',
            subscribedAmount: getSubscribedAmount(company, '12.50%', 2),
            paidAmount: '-',
            subscribedDate: '2019-06-21',
            isHistory: true
        });

        return { total: rows.length, rows: rows };
    };
})(window);
