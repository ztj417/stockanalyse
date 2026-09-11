'use strict';
(function (win) {
    var utils = {};

    utils.escapeHtml = function (value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    utils.paginate = function (list, page, pageSize) {
        var safeList = list || [];
        var total = safeList.length;
        var totalPages = Math.max(1, Math.ceil(total / pageSize));
        var safePage = Math.min(Math.max(1, page), totalPages);
        var start = (safePage - 1) * pageSize;
        var end = Math.min(start + pageSize, total);
        return { total: total, totalPages: totalPages, page: safePage, rows: safeList.slice(start, end) };
    };

    utils.buildPaginationHtml = function (pageKey, page, totalPages) {
        var htmlParts = ['<div class="enterprise-pagination">'];
        var index = 0;
        htmlParts.push('<button type="button" class="enterprise-page-btn enterprise-page-prev' + (page <= 1 ? ' is-disabled' : '') + '" data-page-nav="' + pageKey + '" data-page-dir="prev">&lsaquo;</button>');
        for (index = 1; index <= totalPages; index += 1) {
            htmlParts.push('<button type="button" class="enterprise-page-btn' + (index === page ? ' is-active' : '') + '" data-page-nav="' + pageKey + '" data-page-num="' + index + '">' + index + '</button>');
        }
        htmlParts.push('<button type="button" class="enterprise-page-btn enterprise-page-next' + (page >= totalPages ? ' is-disabled' : '') + '" data-page-nav="' + pageKey + '" data-page-dir="next">&rsaquo;</button>');
        htmlParts.push('</div>');
        return htmlParts.join('');
    };

    utils.buildUiIcon = function (name) {
        if (name === 'clock') {
            return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>';
        }
        return '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>';
    };

    utils.buildTableRow = function (label1, value1, label2, value2, label3, value3) {
        var html = '<tr><th>' + utils.escapeHtml(label1 || '') + '</th><td>' + utils.escapeHtml(value1 || '-') + '</td>';
        if (label2) {
            html += '<th>' + utils.escapeHtml(label2) + '</th><td>' + utils.escapeHtml(value2 || '-') + '</td>';
        } else {
            html += '<td colspan="4"></td>';
        }
        if (label3) {
            html += '<th>' + utils.escapeHtml(label3) + '</th><td>' + utils.escapeHtml(value3 || '-') + '</td>';
        } else if (label2) {
            html += '<td colspan="2"></td>';
        }
        html += '</tr>';
        return html;
    };

    utils.getLogoText = function (companyName) {
        if (companyName.indexOf('联合征信') >= 0) {
            return { first: '联合', second: '征信' };
        }
        var cleanName = (companyName || '企业档案').replace(/(有限责任公司|股份有限公司|有限公司|集团|公司)/g, '');
        return {
            first: cleanName.slice(0, 2) || '企业',
            second: cleanName.slice(2, 4) || '档案'
        };
    };

    utils.getCreditCode = function (company) {
        return company.creditCode || company.unifiedSocialCreditCode || '91310104MA1FRNWW80';
    };

    utils.getUpdateDate = function (company) {
        return company.updateDate || '2026-05-22';
    };

    utils.getEstablishDate = function (company) {
        return company.establishDate || '2021-04-09';
    };

    utils.getIndustry = function (company) {
        return company.industry || '信用服务';
    };

    utils.getEnterpriseType = function (company) {
        return company.enterpriseType || '有限责任公司(国有控股)';
    };

    utils.getWebsite = function (company) {
        return company.website || 'www.unionecredit.com';
    };

    utils.getEmployeeCount = function (company) {
        return company.employeeCount || '48';
    };

    utils.getScope = function (company) {
        return company.businessScope || '许可项目：企业信用征信服务；企业信用评级；企业信用调查；...';
    };

    utils.getPaidCapital = function (capital) {
        if (String(capital || '').indexOf('20000') >= 0) {
            return '10000万人民币';
        }
        return '-';
    };

    utils.getOrgCode = function (creditCode) {
        if (String(creditCode || '').length >= 10) {
            return String(creditCode).slice(8, 17);
        }
        return '-';
    };

    utils.getRegisterNo = function (creditCode) {
        if (String(creditCode || '').length >= 14) {
            return String(creditCode).slice(2, 16);
        }
        return '-';
    };

    utils.getArea = function (address) {
        if (String(address || '').indexOf('上海') >= 0) {
            return '上海市徐汇区';
        }
        if (String(address || '').indexOf('云南') >= 0) {
            return '云南省';
        }
        return '-';
    };

    utils.getRegistry = function (address) {
        if (String(address || '').indexOf('上海') >= 0) {
            return '徐汇区市场监督管理局';
        }
        if (String(address || '').indexOf('云南') >= 0) {
            return '云南省市场监督管理局';
        }
        return '市场监督管理局';
    };

    utils.getApproveDate = function () {
        return '2026-05-21';
    };

    utils.getIndustryCode = function (industry) {
        if (String(industry || '').indexOf('信用') >= 0) {
            return 'L7295';
        }
        return '-';
    };

    utils.getCoordinate = function (address) {
        if (String(address || '').indexOf('上海') >= 0) {
            return '经度：121.458110，纬度：31.183143';
        }
        return '-';
    };

    utils.formatAmount = function (value) {
        var text = String(Math.round(value * 1000) / 1000);
        return text.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    };

    win.companyProfileModuleUtils = utils;
})(window);
