'use strict';
(function (win, doc) {
    var utils = win.companyProfileModuleUtils;

    function renderTemplate(templateId, data) {
        var templateNode = doc.getElementById(templateId);
        var html = templateNode.innerHTML;
        var key = '';
        for (key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                var reg = new RegExp('{{' + key + '}}', 'g');
                html = html.replace(reg, data[key]);
            }
        }
        return html;
    }

    function isMatched(company, keyword) {
        var shareholders = company.shareholders || [];
        var index = 0;
        if (!keyword) {
            return true;
        }
        if (String(company.name || '').toLowerCase().indexOf(keyword) >= 0) {
            return true;
        }
        if (String(company.legalPerson || '').toLowerCase().indexOf(keyword) >= 0) {
            return true;
        }
        for (index = 0; index < shareholders.length; index += 1) {
            if (String(shareholders[index].name || '').toLowerCase().indexOf(keyword) >= 0) {
                return true;
            }
        }
        return false;
    }

    win.companyProfileListModule = {
        label: '投标单位画像列表',
        filter: function (companyList, keyword) {
            var normalizedKeyword = String(keyword || '').trim().toLowerCase();
            var rows = [];
            var index = 0;
            for (index = 0; index < companyList.length; index += 1) {
                if (isMatched(companyList[index], normalizedKeyword)) {
                    rows.push(companyList[index]);
                }
            }
            return rows;
        },
        renderRows: function (companyList, totalSourceCount) {
            var htmlParts = [];
            var index = 0;
            var company = null;
            var profileId = '';
            var renderData = {};
            var emptyMessage = '';

            if (companyList.length === 0) {
                emptyMessage = totalSourceCount === 0 ? '当前范围暂无投标单位数据' : '未匹配到符合搜索条件的投标单位';
                return renderTemplate('company-empty-row-temp', { message: emptyMessage });
            }
            for (index = 0; index < companyList.length; index += 1) {
                company = companyList[index];
                profileId = company.id || company.name;
                renderData.profileId = utils.escapeHtml(profileId);
                renderData.name = utils.escapeHtml(company.name || '未登记');
                renderData.legalPerson = utils.escapeHtml(company.legalPerson || '未登记');
                renderData.registeredCapital = utils.escapeHtml(company.registeredCapital || '未登记');
                renderData.creditCode = utils.escapeHtml(utils.getCreditCode(company));
                renderData.establishDate = utils.escapeHtml(utils.getEstablishDate(company));
                renderData.phone = utils.escapeHtml(company.phone || '未登记');
                renderData.email = utils.escapeHtml(company.email || '未登记');
                renderData.address = utils.escapeHtml(company.address || '未登记');
                htmlParts.push(renderTemplate('company-row-temp', renderData));
            }
            return htmlParts.join('');
        },
        renderPagination: function (page, totalPages) {
            return utils.buildPaginationHtml('mainList', page, totalPages);
        }
    };
})(window, document);
