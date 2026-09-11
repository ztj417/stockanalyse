'use strict';
(function (win, doc) {
    var pageContext = {};
    var companyListData = [];
    var filteredCompanyList = [];
    var companyListPage = 1;
    var COMPANY_LIST_PAGE_SIZE = 10;
    var companySearchKeyword = '';

    var $companyKeywordInput = null;
    var $companySearchReset = null;
    var $companyListBody = null;
    var $companyListPagination = null;

    initPage();

    function initPage() {
        cachePageNodes();
        bindPageEvents();
        loadInitialData();
    }

    function cachePageNodes() {
        $companyKeywordInput = doc.getElementById('companyKeyword');
        $companySearchReset = doc.getElementById('companySearchReset');
        $companyListBody = doc.getElementById('companyListBody');
        $companyListPagination = doc.getElementById('companyListPagination');
    }

    function bindPageEvents() {
        $companyKeywordInput.addEventListener('input', onCompanyKeywordInput);
        $companySearchReset.addEventListener('click', onCompanySearchResetClick);
        $companyListBody.addEventListener('click', onCompanyListClick);
        $companyListPagination.addEventListener('click', onCompanyListPaginationClick);
    }

    function loadInitialData() {
        pageContext = buildPageContext();
        renderCompanyListLoading();

        if (win.pageConfig.useMock) {
            handleCompanyListResponse(win.getMockCompanyListData(pageContext.sectionId));
            return;
        }
        requestCompanyListData();
    }

    function buildPageContext() {
        return {
            sectionId: getUrlParam('sectionId'),
            code: getUrlParam('code'),
            name: getUrlParam('name'),
            riskLevel: getUrlParam('riskLevel') || 'low',
            companyCount: parseInt(getUrlParam('companyCount') || '0', 10) || 0,
            riskCount: parseInt(getUrlParam('riskCount') || '0', 10) || 0
        };
    }

    function requestCompanyListData() {
        var requestUrl = win.pageConfig.getCompanyListData;
        var request = new XMLHttpRequest();
        var urlWithParams = requestUrl + '?sectionId=' + encodeURIComponent(pageContext.sectionId || '');

        request.open('GET', urlWithParams, true);
        request.setRequestHeader('Accept', 'application/json');
        request.onreadystatechange = function () {
            var responseData = null;

            if (request.readyState !== 4) {
                return;
            }
            if (request.status < 200 || request.status >= 300) {
                renderCompanyListFailure('投标单位列表接口异常，请稍后重试');
                return;
            }
            try {
                responseData = JSON.parse(request.responseText);
            } catch (error) {
                renderCompanyListFailure('投标单位接口返回数据格式不正确');
                return;
            }
            handleCompanyListResponse(responseData);
        };
        request.onerror = function () {
            renderCompanyListFailure('网络连接失败，投标单位列表加载失败');
        };
        request.send(null);
    }

    function handleCompanyListResponse(responseData) {
        var rawList = [];

        if (!responseData || responseData.success === false) {
            renderCompanyListFailure(responseData && responseData.message ? responseData.message : '投标单位数据加载失败，请稍后重试');
            return;
        }
        if (responseData.data && Object.prototype.toString.call(responseData.data) === '[object Array]') {
            rawList = responseData.data;
        } else if (Object.prototype.toString.call(responseData) === '[object Array]') {
            rawList = responseData;
        }
        companyListData = transformCompanyListData(rawList);
        applyCompanySearchFilter();
        renderCompanyList();
    }

    function transformCompanyListData(rawList) {
        var result = [];
        var index = 0;

        for (index = 0; index < rawList.length; index += 1) {
            result.push(normalizeCompanyData(rawList[index]));
        }
        return result;
    }

    function normalizeCompanyData(rawCompany) {
        return {
            id: rawCompany.id || '',
            name: rawCompany.name || '',
            legalPerson: rawCompany.legalPerson || '',
            registeredCapital: rawCompany.registeredCapital || '',
            phone: rawCompany.phone || '',
            email: rawCompany.email || '',
            address: rawCompany.address || '',
            creditCode: rawCompany.creditCode || rawCompany.unifiedSocialCreditCode || '',
            establishDate: rawCompany.establishDate || '',
            shareholders: rawCompany.shareholders || []
        };
    }

    function renderCompanyListLoading() {
        $companyListBody.innerHTML = renderTemplate('company-empty-row-temp', { message: '投标单位数据加载中...' });
    }

    function renderCompanyListFailure(message) {
        companyListData = [];
        filteredCompanyList = [];
        $companyListBody.innerHTML = renderTemplate('company-empty-row-temp', { message: message });
        $companyListPagination.innerHTML = '';
    }

    function onCompanyKeywordInput() {
        companySearchKeyword = $companyKeywordInput.value;
        applyCompanySearchFilter();
        renderCompanyList();
        $companySearchReset.classList.toggle('is-hidden', companySearchKeyword === '');
    }

    function onCompanySearchResetClick() {
        $companyKeywordInput.value = '';
        companySearchKeyword = '';
        applyCompanySearchFilter();
        renderCompanyList();
        $companySearchReset.classList.add('is-hidden');
        $companyKeywordInput.focus();
    }

    function applyCompanySearchFilter() {
        filteredCompanyList = win.companyProfileListModule.filter(companyListData, companySearchKeyword);
        companyListPage = 1;
    }

    function renderCompanyList() {
        var total = filteredCompanyList.length;
        var totalPages = Math.max(1, Math.ceil(total / COMPANY_LIST_PAGE_SIZE));
        var start = 0;
        var end = 0;
        var pagedRows = [];

        companyListPage = Math.min(Math.max(1, companyListPage), totalPages);
        start = (companyListPage - 1) * COMPANY_LIST_PAGE_SIZE;
        end = Math.min(start + COMPANY_LIST_PAGE_SIZE, total);
        pagedRows = filteredCompanyList.slice(start, end);

        $companyListBody.innerHTML = win.companyProfileListModule.renderRows(pagedRows, companyListData.length);
        $companyListPagination.innerHTML = win.companyProfileListModule.renderPagination(companyListPage, totalPages);
    }

    function onCompanyListPaginationClick(event) {
        var target = findParentButton(event.target, $companyListPagination);
        var dir = '';
        var num = '';

        if (!target || target.getAttribute('data-page-nav') !== 'mainList') {
            return;
        }
        dir = target.getAttribute('data-page-dir');
        num = target.getAttribute('data-page-num');
        if (dir === 'prev') {
            companyListPage = Math.max(1, companyListPage - 1);
        } else if (dir === 'next') {
            companyListPage += 1;
        } else if (num) {
            companyListPage = parseInt(num, 10) || 1;
        }
        renderCompanyList();
    }

    function onCompanyListClick(event) {
        var target = findParentButton(event.target, $companyListBody);
        var profileId = '';
        var company = null;

        if (!target) {
            return;
        }
        profileId = target.getAttribute('data-view-profile');
        if (!profileId) {
            return;
        }
        company = findCompanyByProfileId(profileId);
        openCompanyDetailPage(profileId, company ? company.name : '');
    }

    function openCompanyDetailPage(profileId, companyName) {
        var detailUrl = buildCompanyDetailUrl('./company-profile-detail.html', profileId);
        var parentDetailUrl = buildCompanyDetailUrl('./company-profile/company-profile-detail.html', profileId);

        if (isInIframe()) {
            win.parent.postMessage({
                type: 'openCompanyDetailModal',
                profileId: profileId,
                companyName: companyName || '',
                detailUrl: parentDetailUrl,
                sectionId: pageContext.sectionId || '',
                code: pageContext.code || '',
                name: pageContext.name || '',
                riskLevel: pageContext.riskLevel || '',
                companyCount: pageContext.companyCount || 0,
                riskCount: pageContext.riskCount || 0
            }, '*');
            return;
        }
        if (openCompanyDetailDialog(companyName || '企业档案', detailUrl)) {
            return;
        }
        win.location.href = detailUrl;
    }

    function buildCompanyDetailUrl(baseUrl, profileId) {
        return baseUrl
            + '?companyId=' + encodeURIComponent(profileId || '')
            + '&sectionId=' + encodeURIComponent(pageContext.sectionId || '')
            + '&code=' + encodeURIComponent(pageContext.code || '')
            + '&name=' + encodeURIComponent(pageContext.name || '')
            + '&riskLevel=' + encodeURIComponent(pageContext.riskLevel || '')
            + '&companyCount=' + encodeURIComponent(pageContext.companyCount || '')
            + '&riskCount=' + encodeURIComponent(pageContext.riskCount || '');
    }

    function openCompanyDetailDialog(title, url) {
        if (!win.epoint || typeof win.epoint.openDialog !== 'function') {
            return false;
        }
        win.epoint.openDialog(title || '企业档案', url, null, {
            width: 1400,
            height: 820,
            allowResize: true
        });
        return true;
    }

    function isInIframe() {
        try {
            return win.top !== win.self;
        } catch (error) {
            return true;
        }
    }

    function findCompanyByProfileId(profileId) {
        var index = 0;
        for (index = 0; index < companyListData.length; index += 1) {
            if (companyListData[index].id === profileId || companyListData[index].name === profileId) {
                return companyListData[index];
            }
        }
        return null;
    }

    function getUrlParam(name) {
        var query = win.location.search.substring(1);
        var parts = query.split('&');
        var index = 0;
        var pair = [];

        for (index = 0; index < parts.length; index += 1) {
            pair = parts[index].split('=');
            if (pair[0] === name && pair.length > 1) {
                return decodeURIComponent(pair[1].replace(/\+/g, ' '));
            }
        }
        return '';
    }

    function findParentButton(target, boundary) {
        while (target && target !== boundary) {
            if (target.tagName === 'BUTTON') {
                return target;
            }
            target = target.parentNode;
        }
        return null;
    }

    function renderTemplate(templateId, data) {
        var templateNode = doc.getElementById(templateId);
        var html = templateNode.innerHTML;
        var key = '';
        for (key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                html = html.replace(new RegExp('{{' + key + '}}', 'g'), data[key]);
            }
        }
        return html;
    }
})(window, document);
