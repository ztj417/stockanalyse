'use strict';
(function (win, doc) {
    var pageContext = {};
    var currentCompanyDetail = null;
    var selectedEnterpriseMainTab = '基本信息';
    var selectedEnterpriseSubTab = '工商信息';
    var selectedEnterpriseIpSubTab = '专利信息';
    var selectedEnterprisePersonnelHistory = false;
    var selectedEnterpriseShareholderHistory = false;
    var shareholderSearchKeyword = '';
    var personnelSearchKeyword = '';
    var patentSearchKeyword = '';
    var copyrightSearchKeyword = '';
    var riskSearchKeyword = '';
    var PAGINATION_PAGE_SIZE = 5;
    var paginationState = {
        shareholder: 1,
        shareholderHistory: 1,
        personnel: 1,
        personnelHistory: 1,
        patent: 1,
        copyright: 1,
        domain: 1,
        risk: 1
    };
    var ENTERPRISE_DETAIL_MODULES = [
        { key: 'registration', label: '工商信息' },
        { key: 'shareholders', label: '股东信息' },
        { key: 'personnel', label: '主要人员' },
        { key: 'annualReports', label: '企业年报' },
        { key: 'topology', label: '企业图谱' },
        { key: 'risks', label: '风险情况' },
        { key: 'patents', label: '专利信息' },
        { key: 'copyrights', label: '著作权信息' },
        { key: 'domains', label: '域名信息' }
    ];
    var ENTERPRISE_MAIN_TABS = ['基本信息', '企业图谱', '风险情况', '知识产权'];
    var ENTERPRISE_BASIC_TABS = ['工商信息', '股东信息', '主要人员', '企业年报'];
    var ENTERPRISE_IP_TABS = ['专利信息', '著作权信息', '域名信息'];

    var $companyDetailArea = null;

    initPage();

    function initPage() {
        cachePageNodes();
        bindPageEvents();
        loadCompanyDetail();
    }

    function cachePageNodes() {
        $companyDetailArea = doc.getElementById('companyDetailArea');
    }

    function bindPageEvents() {
        $companyDetailArea.addEventListener('click', onCompanyDetailClick);
        $companyDetailArea.addEventListener('input', onCompanyDetailInput);
        $companyDetailArea.addEventListener('keydown', onCompanyDetailKeydown);
    }

    function loadCompanyDetail() {
        pageContext = buildPageContext();
        renderCompanyDetailLoading();

        if (!pageContext.companyId) {
            renderCompanyDetailFailure('未获取到投标单位标识，请从投标单位列表进入。');
            return;
        }
        if (win.pageConfig.useMock) {
            currentCompanyDetail = findCompanyFromMock(pageContext.companyId);
            if (!currentCompanyDetail) {
                renderCompanyDetailFailure('未匹配到该投标单位的画像数据。');
                return;
            }
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        requestCompanyDetailData(pageContext.companyId);
    }

    function buildPageContext() {
        return {
            companyId: getUrlParam('companyId') || getUrlParam('openCompany'),
            sectionId: getUrlParam('sectionId'),
            code: getUrlParam('code'),
            name: getUrlParam('name'),
            riskLevel: getUrlParam('riskLevel') || 'low',
            companyCount: parseInt(getUrlParam('companyCount') || '0', 10) || 0,
            riskCount: parseInt(getUrlParam('riskCount') || '0', 10) || 0
        };
    }

    function findCompanyFromMock(companyId) {
        var responseData = win.getMockCompanyListData(pageContext.sectionId);
        var rawList = responseData && responseData.data ? responseData.data : [];
        var index = 0;
        var company = null;

        for (index = 0; index < rawList.length; index += 1) {
            company = normalizeCompanyData(rawList[index]);
            if (company.id === companyId || company.name === companyId) {
                return company;
            }
        }
        responseData = win.getMockCompanyListData('');
        rawList = responseData && responseData.data ? responseData.data : [];
        for (index = 0; index < rawList.length; index += 1) {
            company = normalizeCompanyData(rawList[index]);
            if (company.id === companyId || company.name === companyId) {
                return company;
            }
        }
        return null;
    }

    function requestCompanyDetailData(companyId) {
        var requestUrl = win.pageConfig.getCompanyDetailData;
        var request = new XMLHttpRequest();
        var urlWithParams = requestUrl + '?companyId=' + encodeURIComponent(companyId || '');

        request.open('GET', urlWithParams, true);
        request.setRequestHeader('Accept', 'application/json');
        request.onreadystatechange = function () {
            var responseData = null;

            if (request.readyState !== 4) {
                return;
            }
            if (request.status < 200 || request.status >= 300) {
                renderCompanyDetailFailure('企业档案接口异常，请稍后重试');
                return;
            }
            try {
                responseData = JSON.parse(request.responseText);
            } catch (error) {
                renderCompanyDetailFailure('企业档案接口返回数据格式不正确');
                return;
            }
            if (!responseData || responseData.success === false) {
                renderCompanyDetailFailure(responseData && responseData.message ? responseData.message : '企业档案数据加载失败');
                return;
            }
            currentCompanyDetail = normalizeCompanyData(responseData.data || responseData);
            renderCompanyDetailContent(currentCompanyDetail);
        };
        request.onerror = function () {
            renderCompanyDetailFailure('网络连接失败，企业档案加载失败');
        };
        request.send(null);
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
            shareholders: rawCompany.shareholders || [],
            moduleData: rawCompany.moduleData || null
        };
    }

    function renderCompanyDetailLoading() {
        $companyDetailArea.innerHTML = '<div class="company-detail-empty"><strong>画像数据加载中...</strong><span>正在读取投标单位画像详情。</span></div>';
    }

    function renderCompanyDetailFailure(message) {
        $companyDetailArea.innerHTML = ''
            + '<div class="company-detail-empty">'
            + '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6M12 17h.01"></path></svg>'
            + '<strong>企业档案加载失败</strong>'
            + '<span>' + escapeHtml(message) + '</span>'
            + '</div>';
    }

    function renderCompanyDetailContent(company) {
        $companyDetailArea.innerHTML = buildEnterpriseProfileHtml(company);
    }

    function resetPaginationOnTabChange() {
        paginationState.shareholder = 1;
        paginationState.shareholderHistory = 1;
        paginationState.personnel = 1;
        paginationState.personnelHistory = 1;
        paginationState.patent = 1;
        paginationState.copyright = 1;
        paginationState.domain = 1;
        paginationState.risk = 1;
    }

    function onCompanyDetailClick(event) {
        var target = findParentButton(event.target, $companyDetailArea);

        if (!target) {
            return;
        }
        if (target.getAttribute('data-enterprise-main-tab')) {
            selectedEnterpriseMainTab = target.getAttribute('data-enterprise-main-tab');
            selectedEnterpriseSubTab = '工商信息';
            selectedEnterpriseIpSubTab = '专利信息';
            selectedEnterprisePersonnelHistory = false;
            selectedEnterpriseShareholderHistory = false;
            resetPaginationOnTabChange();
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        if (target.getAttribute('data-enterprise-sub-tab') !== null) {
            selectedEnterpriseMainTab = '基本信息';
            selectedEnterpriseSubTab = target.getAttribute('data-enterprise-sub-tab');
            selectedEnterprisePersonnelHistory = false;
            selectedEnterpriseShareholderHistory = false;
            resetPaginationOnTabChange();
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        if (target.getAttribute('data-enterprise-ip-sub-tab') !== null) {
            selectedEnterpriseMainTab = '知识产权';
            selectedEnterpriseIpSubTab = target.getAttribute('data-enterprise-ip-sub-tab');
            resetPaginationOnTabChange();
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        if (target.getAttribute('data-enterprise-shareholder-history') !== null) {
            selectedEnterpriseShareholderHistory = target.getAttribute('data-enterprise-shareholder-history') === 'true';
            resetPaginationOnTabChange();
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        if (target.getAttribute('data-enterprise-personnel-history') !== null) {
            selectedEnterprisePersonnelHistory = target.getAttribute('data-enterprise-personnel-history') === 'true';
            resetPaginationOnTabChange();
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        if (target.getAttribute('data-page-nav') !== null) {
            updateEnterprisePagination(target);
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        handleSearchButtonClick(target);
    }

    function handleSearchButtonClick(target) {
        if (target.getAttribute('data-shareholder-search-reset') !== null) {
            shareholderSearchKeyword = '';
        } else if (target.getAttribute('data-personnel-search-reset') !== null) {
            personnelSearchKeyword = '';
        } else if (target.getAttribute('data-patent-search-reset') !== null) {
            patentSearchKeyword = '';
        } else if (target.getAttribute('data-copyright-search-reset') !== null) {
            copyrightSearchKeyword = '';
        } else if (target.getAttribute('data-risk-search-reset') !== null) {
            riskSearchKeyword = '';
        } else if (target.getAttribute('data-shareholder-search-trigger') === null
            && target.getAttribute('data-personnel-search-trigger') === null
            && target.getAttribute('data-patent-search-trigger') === null
            && target.getAttribute('data-copyright-search-trigger') === null
            && target.getAttribute('data-risk-search-trigger') === null) {
            return;
        }
        resetPaginationOnTabChange();
        renderCompanyDetailContent(currentCompanyDetail);
    }

    function updateEnterprisePagination(target) {
        var pageKey = target.getAttribute('data-page-nav');
        var cur = paginationState[pageKey] || 1;
        var dir = target.getAttribute('data-page-dir');
        var num = target.getAttribute('data-page-num');
        if (dir === 'prev') {
            paginationState[pageKey] = Math.max(1, cur - 1);
        } else if (dir === 'next') {
            paginationState[pageKey] = cur + 1;
        } else if (num) {
            paginationState[pageKey] = parseInt(num, 10) || 1;
        }
    }

    function onCompanyDetailInput(event) {
        var input = event.target;
        if (!input) {
            return;
        }
        if (input.getAttribute('data-shareholder-search-input') !== null) {
            shareholderSearchKeyword = input.value;
            return;
        }
        if (input.getAttribute('data-personnel-search-input') !== null) {
            personnelSearchKeyword = input.value;
            return;
        }
        if (input.getAttribute('data-patent-search-input') !== null) {
            patentSearchKeyword = input.value;
            return;
        }
        if (input.getAttribute('data-copyright-search-input') !== null) {
            copyrightSearchKeyword = input.value;
            return;
        }
        if (input.getAttribute('data-risk-search-input') !== null) {
            riskSearchKeyword = input.value;
        }
    }

    function onCompanyDetailKeydown(event) {
        var input = event.target;
        if (!input || event.key !== 'Enter') {
            return;
        }
        if (input.getAttribute('data-shareholder-search-input') !== null
            || input.getAttribute('data-personnel-search-input') !== null
            || input.getAttribute('data-patent-search-input') !== null
            || input.getAttribute('data-copyright-search-input') !== null
            || input.getAttribute('data-risk-search-input') !== null) {
            resetPaginationOnTabChange();
            renderCompanyDetailContent(currentCompanyDetail);
        }
    }

    function buildEnterpriseProfileHtml(company) {
        var modules = win.companyProfileModules || {};
        var headerModule = modules.basic;
        var activeModuleConfig = getEnterpriseActiveModuleConfig();
        var activeModule = modules[activeModuleConfig.key];
        var moduleContext = buildEnterpriseModuleContext();
        var htmlParts = ['<div class="enterprise-detail-page">'];

        if (headerModule && headerModule.renderHeader) {
            htmlParts.push(headerModule.renderHeader(company, moduleContext));
        }
        htmlParts.push(buildEnterpriseMainTabs(selectedEnterpriseMainTab));
        if (selectedEnterpriseMainTab === '基本信息') {
            htmlParts.push(buildEnterpriseSubTabs(selectedEnterpriseSubTab));
        } else if (selectedEnterpriseMainTab === '知识产权') {
            htmlParts.push(buildEnterpriseIpTabs(selectedEnterpriseIpSubTab));
        }
        if (activeModule && activeModule.render) {
            htmlParts.push(activeModule.render(company, moduleContext));
        } else {
            htmlParts.push('<div class="company-detail-empty"><strong>模块未找到</strong><span>当前页面未匹配到可展示的画像模块。</span></div>');
        }
        htmlParts.push('</div>');
        return htmlParts.join('');
    }

    function buildEnterpriseModuleContext() {
        return {
            pageSize: PAGINATION_PAGE_SIZE,
            paginationState: paginationState,
            shareholderHistory: selectedEnterpriseShareholderHistory,
            personnelHistory: selectedEnterprisePersonnelHistory,
            shareholderKeyword: shareholderSearchKeyword,
            personnelKeyword: personnelSearchKeyword,
            patentKeyword: patentSearchKeyword,
            copyrightKeyword: copyrightSearchKeyword,
            riskKeyword: riskSearchKeyword
        };
    }

    function getEnterpriseActiveModuleConfig() {
        var activeLabel = selectedEnterpriseSubTab;
        var index = 0;

        if (selectedEnterpriseMainTab === '企业图谱' || selectedEnterpriseMainTab === '风险情况') {
            activeLabel = selectedEnterpriseMainTab;
        } else if (selectedEnterpriseMainTab === '知识产权') {
            activeLabel = selectedEnterpriseIpSubTab;
        }
        for (index = 0; index < ENTERPRISE_DETAIL_MODULES.length; index += 1) {
            if (ENTERPRISE_DETAIL_MODULES[index].label === activeLabel) {
                return ENTERPRISE_DETAIL_MODULES[index];
            }
        }
        return ENTERPRISE_DETAIL_MODULES[0];
    }

    function buildEnterpriseMainTabs(activeName) {
        var htmlParts = ['<nav class="enterprise-tabs-main">'];
        var index = 0;
        for (index = 0; index < ENTERPRISE_MAIN_TABS.length; index += 1) {
            var activeClass = ENTERPRISE_MAIN_TABS[index] === activeName ? ' is-active' : '';
            htmlParts.push('<button type="button" class="' + activeClass + '" data-enterprise-main-tab="' + escapeHtml(ENTERPRISE_MAIN_TABS[index]) + '">' + escapeHtml(ENTERPRISE_MAIN_TABS[index]) + '</button>');
        }
        htmlParts.push('</nav>');
        return htmlParts.join('');
    }

    function buildEnterpriseSubTabs(activeName) {
        var htmlParts = ['<nav class="enterprise-tabs-sub">'];
        var index = 0;
        for (index = 0; index < ENTERPRISE_BASIC_TABS.length; index += 1) {
            var activeClass = ENTERPRISE_BASIC_TABS[index] === activeName ? ' is-active' : '';
            htmlParts.push('<button type="button" class="' + activeClass + '" data-enterprise-sub-tab="' + escapeHtml(ENTERPRISE_BASIC_TABS[index]) + '">' + escapeHtml(ENTERPRISE_BASIC_TABS[index]) + '</button>');
        }
        htmlParts.push('</nav>');
        return htmlParts.join('');
    }

    function buildEnterpriseIpTabs(activeName) {
        var htmlParts = ['<nav class="enterprise-tabs-sub">'];
        var index = 0;
        for (index = 0; index < ENTERPRISE_IP_TABS.length; index += 1) {
            var activeClass = ENTERPRISE_IP_TABS[index] === activeName ? ' is-active' : '';
            htmlParts.push('<button type="button" class="' + activeClass + '" data-enterprise-ip-sub-tab="' + escapeHtml(ENTERPRISE_IP_TABS[index]) + '">' + escapeHtml(ENTERPRISE_IP_TABS[index]) + '</button>');
        }
        htmlParts.push('</nav>');
        return htmlParts.join('');
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

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})(window, document);
