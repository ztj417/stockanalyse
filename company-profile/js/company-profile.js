'use strict';
(function (win, doc) {
    // ============ 页面状态变量（用途说明见各注释） ============

    // pageContext 保存从 URL 传入的标段上下文；没有标段时本页作为“全部投标单位画像库”使用。
    var pageContext = {};

    // companyListData 保存当前范围已加载的全部投标单位（已做字段映射）。
    var companyListData = [];

    // filteredCompanyList 是搜索关键字过滤后的展示列表。
    var filteredCompanyList = [];
    var companyListPage = 1;
    var COMPANY_LIST_PAGE_SIZE = 10;

    // currentCompanyDetail 保存当前正在展示企业档案的单位，首次渲染后不再重复请求。
    var currentCompanyDetail = null;

    // companySearchKeyword 记录列表搜索关键字，输入即过滤。
    var companySearchKeyword = '';

    // 企业档案内部页签状态：与主页面企业档案弹窗的状态语义保持一致。
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

    // 分页状态：每个列表独立维护当前页，切换单位或子页签时重置。
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

    // 关键 DOM 容器缓存，初始化时只查找一次。
    var $sectionContextCard = null;
    var $sectionContextName = null;
    var $sectionContextMeta = null;
    var $companyKeywordInput = null;
    var $companySearchReset = null;
    var $companyCountText = null;
    var $companyListBody = null;
    var $companyDetailArea = null;
    var $companyDetailModal = null;
    var $companyDetailModalClose = null;
    var $companyDetailModalTitle = null;
    var $backLink = null;

    initPage();

    // 页面唯一入口：先缓存节点，再集中绑定事件，最后加载首屏数据。
    function initPage() {
        cachePageNodes();
        bindPageEvents();
        loadInitialData();
    }

    // 页面节点只在初始化阶段查找一次，后续功能统一复用缓存变量。
    function cachePageNodes() {
        $sectionContextCard = doc.getElementById('sectionContextCard');
        $sectionContextName = doc.getElementById('sectionContextName');
        $sectionContextMeta = doc.getElementById('sectionContextMeta');
        $companyKeywordInput = doc.getElementById('companyKeyword');
        $companySearchReset = doc.getElementById('companySearchReset');
        $companyCountText = doc.getElementById('companyCountText');
        $companyListBody = doc.getElementById('companyListBody');
        $companyDetailArea = doc.getElementById('companyDetailArea');
        $companyDetailModal = doc.getElementById('companyDetailModal');
        $companyDetailModalClose = doc.getElementById('companyDetailModalClose');
        $companyDetailModalTitle = doc.getElementById('companyDetailModalTitle');
        $backLink = doc.getElementById('backLink');
    }

    // 静态节点事件统一绑定；动态生成的列表行与档案页签通过容器事件委托处理。
    function bindPageEvents() {
        $companyKeywordInput.addEventListener('input', onCompanyKeywordInput);
        $companySearchReset.addEventListener('click', onCompanySearchResetClick);
        $companyListBody.addEventListener('click', onCompanyListClick);
        doc.getElementById('companyListPagination').addEventListener('click', onCompanyListPaginationClick);
        $companyDetailArea.addEventListener('click', onCompanyDetailClick);
        $companyDetailArea.addEventListener('input', onCompanyDetailInput);
        $companyDetailArea.addEventListener('keydown', onCompanyDetailKeydown);
        $companyDetailModalClose.addEventListener('click', closeCompanyDetailModal);
        $companyDetailModal.addEventListener('click', onCompanyDetailModalMaskClick);
        doc.addEventListener('keydown', onCompanyDetailModalKeydown);
    }

    // 首屏加载：解析上下文 -> 渲染头部 -> 按 useMock 开关选择数据来源。
    function loadInitialData() {
        pageContext = buildPageContext();
        if (win.pageConfig.useMock) {
            // mock 阶段：URL 未带全的标段字段按本地记录回填，保证头部徽标与列表数据一致。
            completePageContextFromSection();
        }
        renderSectionContext();
        renderCompanyListLoading();

        if (win.pageConfig.useMock) {
            // 【mock获取数据,后续根据实际业务调用后台获取：投标单位列表】
            var mockResponseData = win.getMockCompanyListData(pageContext.sectionId);
            handleCompanyListResponse(mockResponseData);
            return;
        }
        requestCompanyListData();
    }

    // 从 URL 读取页面上下文参数，来源见主页面 openCompanyProfilePage 拼装的 query。
    function buildPageContext() {
        var context = {};

        context.sectionId = getUrlParam('sectionId');
        context.code = getUrlParam('code');
        context.name = getUrlParam('name');
        context.riskLevel = getUrlParam('riskLevel') || 'low';
        context.companyCount = parseInt(getUrlParam('companyCount') || '0', 10) || 0;
        context.riskCount = parseInt(getUrlParam('riskCount') || '0', 10) || 0;

        return context;
    }

    // 本地 mock 阶段补充上下文：URL 未带全的字段按 sectionId 在本地标段记录中回填。
    // 这样即使只带 ?sectionId= 直接访问本页，头部徽标也不会出现“0 家/0 项”与列表不符的问题。
    function completePageContextFromSection() {
        var sectionItem = null;
        var sectionList = [];
        var index = 0;
        var urlHasRiskLevel = getUrlParam('riskLevel') !== '';

        if (win.companyProfileMockData) {
            sectionList = win.companyProfileMockData.sectionList || [];
        }
        if (!pageContext.sectionId) {
            return;
        }
        for (index = 0; index < sectionList.length; index += 1) {
            if (sectionList[index].id === pageContext.sectionId) {
                sectionItem = sectionList[index];
                break;
            }
        }
        if (!sectionItem) {
            return;
        }
        // URL 已带全的参数以 URL 为准；缺省字段按本地标段记录补齐。
        if (!pageContext.name) {
            pageContext.name = sectionItem.name || '';
        }
        if (!pageContext.code) {
            pageContext.code = sectionItem.code || '';
        }
        if (!pageContext.companyCount) {
            pageContext.companyCount = sectionItem.companyCount || 0;
        }
        if (!pageContext.riskCount) {
            pageContext.riskCount = sectionItem.riskCount || 0;
        }
        if (!urlHasRiskLevel) {
            pageContext.riskLevel = sectionItem.riskLevel || pageContext.riskLevel;
        }
    }

    // 读取 URL 查询参数，返回值默认为空字符串。
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

    // 渲染页头上下文：页头已移除，此函数保留为空实现以兼容调用链。
    function renderSectionContext() {
    }

    // 根据 URL 里的风险等级生成徽标文字，与主页面风险口径保持一致。
    function getSectionRiskText() {
        if (pageContext.riskLevel === 'high') {
            return '高风险';
        }
        if (pageContext.riskLevel === 'medium') {
            return '中风险';
        }
        if (pageContext.riskCount > 0) {
            return '低风险';
        }
        return '正常';
    }

    // ============ 列表：请求 -> 转换 -> 渲染 ============

    // 正式接口分支：请求当前标段下的投标单位列表。
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

    // 列表响应统一处理入口：先取数组，再映射，再过滤与渲染。
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

        // URL 带 openCompany 参数时，数据加载完成后自动弹出对应档案。
        var openCompanyId = getUrlParam('openCompany');
        if (openCompanyId) {
            openCompanyProfile(openCompanyId);
        }
    }

    // 把后端返回字段映射成页面统一模型，渲染层不再直接消费后端原始字段。
    function transformCompanyListData(rawList) {
        var result = [];
        var index = 0;

        for (index = 0; index < rawList.length; index += 1) {
            result.push(normalizeCompanyData(rawList[index]));
        }
        return result;
    }

    // 统一补齐企业档案对象缺省字段，列表与档案详情共用同一套归一化逻辑。
    function normalizeCompanyData(rawCompany) {
        var company = {};

        company.id = rawCompany.id || '';
        company.name = rawCompany.name || '';
        company.legalPerson = rawCompany.legalPerson || '';
        company.registeredCapital = rawCompany.registeredCapital || '';
        company.phone = rawCompany.phone || '';
        company.email = rawCompany.email || '';
        company.address = rawCompany.address || '';
        company.creditCode = rawCompany.creditCode || rawCompany.unifiedSocialCreditCode || '';
        company.establishDate = rawCompany.establishDate || '';
        company.shareholders = rawCompany.shareholders || [];

        return company;
    }

    // 加载中占位，避免列表区出现空白。
    function renderCompanyListLoading() {
        var loadingRenderData = { message: '投标单位数据加载中...' };

        $companyListBody.innerHTML = renderTemplate('company-empty-row-temp', loadingRenderData);
    }

    // 渲染列表失败态，给出明确业务语义，便于现场排查。
    function renderCompanyListFailure(message) {
        companyListData = [];
        filteredCompanyList = [];
        $companyListBody.innerHTML = renderTemplate('company-empty-row-temp', { message: message });
    }

    // 输入关键字即本地过滤列表并局部刷新，不重建整页。
    function onCompanyKeywordInput() {
        companySearchKeyword = $companyKeywordInput.value;
        applyCompanySearchFilter();
        renderCompanyList();
        $companySearchReset.classList.toggle('is-hidden', companySearchKeyword === '');
    }

    // 清空搜索关键字后恢复全量列表。
    function onCompanySearchResetClick() {
        $companyKeywordInput.value = '';
        companySearchKeyword = '';
        applyCompanySearchFilter();
        renderCompanyList();
        $companySearchReset.classList.add('is-hidden');
        $companyKeywordInput.focus();
    }

    // 按关键字过滤当前范围单位，过滤逻辑见 isCompanyProfileMatched。
    function applyCompanySearchFilter() {
        var keyword = String(companySearchKeyword || '').trim().toLowerCase();
        var index = 0;

        filteredCompanyList = [];
        for (index = 0; index < companyListData.length; index += 1) {
            if (isCompanyProfileMatched(companyListData[index], keyword)) {
                filteredCompanyList.push(companyListData[index]);
            }
        }
        companyListPage = 1;
    }

    // 渲染单位列表区域，同时负责计数与空态展示。
    function renderCompanyList() {
        var htmlParts = [];
        var index = 0;
        var emptyMessage = '';
        var company = null;
        var profileId = '';
        var renderData = {};
        var total = filteredCompanyList.length;
        var totalPages = Math.max(1, Math.ceil(total / COMPANY_LIST_PAGE_SIZE));
        companyListPage = Math.min(Math.max(1, companyListPage), totalPages);
        var start = (companyListPage - 1) * COMPANY_LIST_PAGE_SIZE;
        var end = Math.min(start + COMPANY_LIST_PAGE_SIZE, total);
        var pagedRows = filteredCompanyList.slice(start, end);

        if (total === 0) {
            if (companyListData.length === 0) {
                emptyMessage = '当前范围暂无投标单位数据';
            } else {
                emptyMessage = '未匹配到符合搜索条件的投标单位';
            }
            htmlParts.push(renderTemplate('company-empty-row-temp', { message: emptyMessage }));
        } else {
            for (index = 0; index < pagedRows.length; index += 1) {
                company = pagedRows[index];
                profileId = company.id || company.name;

                renderData.profileId = escapeHtml(profileId);
                renderData.name = escapeHtml(company.name || '未登记');
                renderData.legalPerson = escapeHtml(company.legalPerson || '未登记');
                renderData.registeredCapital = escapeHtml(company.registeredCapital || '未登记');
                renderData.creditCode = escapeHtml(getEnterpriseCreditCode(company));
                renderData.establishDate = escapeHtml(getEnterpriseEstablishDate(company));
                renderData.phone = escapeHtml(company.phone || '未登记');
                renderData.email = escapeHtml(company.email || '未登记');
                renderData.address = escapeHtml(company.address || '未登记');
                htmlParts.push(renderTemplate('company-row-temp', renderData));
            }
        }

        $companyListBody.innerHTML = htmlParts.join('');
        renderCompanyListPagination(total, totalPages);
    }

    // 列表分页控件渲染，复用档案弹窗的 buildPaginationHtml 结构。
    function renderCompanyListPagination(total, totalPages) {
        var container = document.getElementById('companyListPagination');
        if (!container) {
            return;
        }
        container.innerHTML = buildPaginationHtml('mainList', companyListPage, totalPages);
    }

    // 列表分页事件委托（点击页码 / 上一页 / 下一页）。
    function onCompanyListPaginationClick(event) {
        var target = findParentButton(event.target, document.getElementById('companyListPagination'));
        if (!target) {
            return;
        }
        var key = target.getAttribute('data-page-nav');
        if (key !== 'mainList') {
            return;
        }
        var cur = companyListPage;
        var dir = target.getAttribute('data-page-dir');
        var num = target.getAttribute('data-page-num');
        if (dir === 'prev') {
            companyListPage = Math.max(1, cur - 1);
        } else if (dir === 'next') {
            companyListPage = cur + 1;
        } else if (num) {
            companyListPage = parseInt(num, 10) || 1;
        }
        renderCompanyList();
    }

    // ============ 档案详情：选择 -> 请求(可选) -> 渲染 ============

    // 列表行按钮事件委托：点击「查看企业档案」后定位单位并渲染档案区。
    function onCompanyListClick(event) {
        var target = findParentButton(event.target, $companyListBody);

        if (!target) {
            return;
        }
        var profileId = target.getAttribute('data-view-profile');
        if (!profileId) {
            return;
        }
        openCompanyProfile(profileId);
    }

    // 打开单位档案：
    // - iframe 嵌入场景下（被主页面投标单位画像页签内嵌），通过 postMessage 通知父页面
    //   在顶层弹出全屏 modal，modal 内嵌 company-profile.html + openCompany 参数，自动弹出档案。
    // - 独立页面场景下，直接在当前页弹出档案弹窗。
    // - URL 已带 openCompany 参数时（说明已在全屏 modal iframe 中），强制弹窗，不再递归 postMessage。
    function openCompanyProfile(profileId) {
        var company = findCompanyByProfileId(profileId);

        if (!company) {
            return;
        }

        // URL 带 openCompany → 说明已在全屏 modal iframe 中，强制弹窗，不走 postMessage。
        var alreadyInFullscreen = !!getUrlParam('openCompany');

        // try-catch 检测是否在 iframe 中
        var isInIframe = false;
        try {
            isInIframe = win.top !== win.self;
        } catch (err) {
            isInIframe = true;
        }

        if (isInIframe && !alreadyInFullscreen) {
            // postMessage 不检查跨域，file:// 也能正常工作。
            win.parent.postMessage({
                type: 'openCompanyDetailModal',
                profileId: profileId,
                companyName: company.name || ''
            }, '*');
            return;
        }

        currentCompanyDetail = company;
        resetEnterpriseDetailState();
        renderCompanyDetailArea();
        $companyDetailModalTitle.textContent = company.name || '企业档案';
        $companyDetailModal.classList.remove('is-hidden');
        doc.body.style.overflow = 'hidden';
    }

    // 关闭档案弹窗：隐藏弹窗并恢复背景滚动；保留 currentCompanyDetail 以便再次打开时复用。
    function closeCompanyDetailModal() {
        $companyDetailModal.classList.add('is-hidden');
        doc.body.style.overflow = '';
    }

    // 点击遮罩空白区域关闭弹窗（点击面板内部不关闭）。
    function onCompanyDetailModalMaskClick(event) {
        if (event.target === $companyDetailModal) {
            closeCompanyDetailModal();
        }
    }

    // ESC 键关闭弹窗，与主页面企业档案弹窗交互保持一致。
    function onCompanyDetailModalKeydown(event) {
        if (event.key === 'Escape' && !$companyDetailModal.classList.contains('is-hidden')) {
            closeCompanyDetailModal();
        }
    }

    // 按 id（或名称兜底）在当前列表范围内查找单位。
    function findCompanyByProfileId(profileId) {
        var index = 0;
        var company = null;

        for (index = 0; index < companyListData.length; index += 1) {
            company = companyListData[index];
            if (company.id === profileId || company.name === profileId) {
                return company;
            }
        }
        return null;
    }

    // 重置企业档案内部页签状态，每次切换单位都回到「基本信息-工商信息」并清空搜索关键字。
    function resetEnterpriseDetailState() {
        selectedEnterpriseMainTab = '基本信息';
        selectedEnterpriseSubTab = '工商信息';
        selectedEnterpriseIpSubTab = '专利信息';
        selectedEnterprisePersonnelHistory = false;
        selectedEnterpriseShareholderHistory = false;
        shareholderSearchKeyword = '';
        personnelSearchKeyword = '';
        patentSearchKeyword = '';
        copyrightSearchKeyword = '';
        riskSearchKeyword = '';
        paginationState.shareholder = 1;
        paginationState.shareholderHistory = 1;
        paginationState.personnel = 1;
        paginationState.personnelHistory = 1;
        paginationState.patent = 1;
        paginationState.copyright = 1;
        paginationState.domain = 1;
        paginationState.risk = 1;
    }

    // 切换子页签时，将对应列表页码重置为 1。
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

    // 对数组按当前页切片。
    function paginate(list, page) {
        var total = list.length;
        var totalPages = Math.max(1, Math.ceil(total / PAGINATION_PAGE_SIZE));
        var safePage = Math.min(Math.max(1, page), totalPages);
        var start = (safePage - 1) * PAGINATION_PAGE_SIZE;
        var end = Math.min(start + PAGINATION_PAGE_SIZE, total);
        return { total: total, totalPages: totalPages, page: safePage, rows: list.slice(start, end) };
    }

    // 渲染分页控件：< [1] 2 > 样式，选中蓝色。始终显示以便用户看到交互效果。
    function buildPaginationHtml(pageKey, page, totalPages) {
        var htmlParts = ['<div class="enterprise-pagination">'];
        // 上一页
        htmlParts.push('<button type="button" class="enterprise-page-btn enterprise-page-prev' + (page <= 1 ? ' is-disabled' : '') + '" data-page-nav="' + pageKey + '" data-page-dir="prev">‹</button>');
        // 页码
        var i = 0;
        for (i = 1; i <= totalPages; i += 1) {
            htmlParts.push('<button type="button" class="enterprise-page-btn' + (i === page ? ' is-active' : '') + '" data-page-nav="' + pageKey + '" data-page-num="' + i + '">' + i + '</button>');
        }
        // 下一页
        htmlParts.push('<button type="button" class="enterprise-page-btn enterprise-page-next' + (page >= totalPages ? ' is-disabled' : '') + '" data-page-nav="' + pageKey + '" data-page-dir="next">›</button>');
        htmlParts.push('</div>');
        return htmlParts.join('');
    }

    // 渲染档案详情区：未选中单位时显示引导占位；选中后按 useMock 开关选择渲染来源。
    function renderCompanyDetailArea() {
        if (!currentCompanyDetail) {
            $companyDetailArea.innerHTML = buildDetailPlaceholder();
            return;
        }
        if (win.pageConfig.useMock) {
            // 【mock获取数据,后续根据实际业务调用后台获取：企业档案详情】
            // mock 模式下列表单位对象已携带股东/人员/知产等档案字段，直接渲染即可。
            renderCompanyDetailContent(currentCompanyDetail);
            return;
        }
        requestCompanyDetailData(currentCompanyDetail.id, currentCompanyDetail.name);
    }

    // 档案内容渲染入口：重建整个档案区（页签切换时只局部重建该区域）。
    function renderCompanyDetailContent(company) {
        $companyDetailArea.innerHTML = buildEnterpriseProfileHtml(company);
    }

    // 正式接口分支：按单位 id 请求企业档案详情。
    function requestCompanyDetailData(companyId, companyName) {
        var requestUrl = win.pageConfig.getCompanyDetailData;
        var request = new XMLHttpRequest();
        var urlWithParams = requestUrl
            + '?companyId=' + encodeURIComponent(companyId || '')
            + '&companyName=' + encodeURIComponent(companyName || '');

        request.open('GET', urlWithParams, true);
        request.setRequestHeader('Accept', 'application/json');
        request.onreadystatechange = function () {
            var responseData = null;
            var company = null;

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
            company = responseData.data || responseData;
            currentCompanyDetail = transformCompanyDetailData(company);
            renderCompanyDetailContent(currentCompanyDetail);
        };
        request.onerror = function () {
            renderCompanyDetailFailure('网络连接失败，企业档案加载失败');
        };
        request.send(null);
    }

    // 档案详情返回字段同样先归一化再交给渲染层。
    function transformCompanyDetailData(rawCompany) {
        return normalizeCompanyData(rawCompany);
    }

    // 档案区加载失败提示，给出可读业务文案。
    function renderCompanyDetailFailure(message) {
        $companyDetailArea.innerHTML = ''
            + '<div class="company-detail-empty">'
            + '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6M12 17h.01"></path></svg>'
            + '<strong>企业档案加载失败</strong>'
            + '<span>' + escapeHtml(message) + '</span>'
            + '</div>';
    }

    // 档案区初始占位：引导用户从上方列表选择单位。
    function buildDetailPlaceholder() {
        return '<div class="company-detail-empty">'
            + '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"></path><path d="M9 21v-4h6v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"></path></svg>'
            + '<strong>请选择投标单位</strong>'
            + '<span>点击上方列表「查看」按钮，即可查看该单位的企业档案详情。</span>'
            + '</div>';
    }

    // 档案区内页签按钮事件委托：切换页签只更新状态并局部重建档案区，不重新请求列表。
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
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-enterprise-sub-tab')) {
            selectedEnterpriseMainTab = '基本信息';
            selectedEnterpriseSubTab = target.getAttribute('data-enterprise-sub-tab');
            selectedEnterprisePersonnelHistory = false;
            selectedEnterpriseShareholderHistory = false;
            resetPaginationOnTabChange();
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-enterprise-ip-sub-tab')) {
            selectedEnterpriseMainTab = '知识产权';
            selectedEnterpriseIpSubTab = target.getAttribute('data-enterprise-ip-sub-tab');
            resetPaginationOnTabChange();
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-enterprise-shareholder-history')) {
            selectedEnterpriseShareholderHistory = target.getAttribute('data-enterprise-shareholder-history') === 'true';
            resetPaginationOnTabChange();
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-enterprise-personnel-history')) {
            selectedEnterprisePersonnelHistory = target.getAttribute('data-enterprise-personnel-history') === 'true';
            resetPaginationOnTabChange();
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-page-nav')) {
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
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-shareholder-search-reset')) {
            shareholderSearchKeyword = '';
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-shareholder-search-trigger')) {
            triggerShareholderSearch();
            return;
        }
        if (target.getAttribute('data-personnel-search-reset')) {
            personnelSearchKeyword = '';
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-personnel-search-trigger')) {
            triggerPersonnelSearch();
            return;
        }
        if (target.getAttribute('data-patent-search-reset')) {
            patentSearchKeyword = '';
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-patent-search-trigger')) {
            triggerPatentSearch();
            return;
        }
        if (target.getAttribute('data-copyright-search-reset')) {
            copyrightSearchKeyword = '';
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-copyright-search-trigger')) {
            triggerCopyrightSearch();
            return;
        }
        if (target.getAttribute('data-risk-search-reset')) {
            riskSearchKeyword = '';
            renderCompanyDetailArea();
            return;
        }
        if (target.getAttribute('data-risk-search-trigger')) {
            triggerRiskSearch();
            return;
        }
    }

    // 所有搜索框的输入事件：仅同步值到状态变量，不立即过滤。
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

    function triggerShareholderSearch() { renderCompanyDetailArea(); }
    function triggerPersonnelSearch() { renderCompanyDetailArea(); }
    function triggerPatentSearch() { renderCompanyDetailArea(); }
    function triggerCopyrightSearch() { renderCompanyDetailArea(); }
    function triggerRiskSearch() { renderCompanyDetailArea(); }

    // 搜索框键盘事件：按下 Enter 触发对应搜索。
    function onCompanyDetailKeydown(event) {
        var input = event.target;
        if (!input) {
            return;
        }
        if (event.key !== 'Enter') {
            return;
        }
        if (input.getAttribute('data-shareholder-search-input') !== null) { triggerShareholderSearch(); return; }
        if (input.getAttribute('data-personnel-search-input') !== null) { triggerPersonnelSearch(); return; }
        if (input.getAttribute('data-patent-search-input') !== null) { triggerPatentSearch(); return; }
        if (input.getAttribute('data-copyright-search-input') !== null) { triggerCopyrightSearch(); return; }
        if (input.getAttribute('data-risk-search-input') !== null) { triggerRiskSearch(); }
    }

    // ============ 企业档案详情构建（与主页面企业档案弹窗渲染保持一致） ============

    // 构建完整企业档案展示块：头部概览 + 一级页签 + 当前页签内容。
    function buildEnterpriseProfileHtml(company) {
        var logoText = getEnterpriseLogoText(company.name || '');
        var legalPerson = company.legalPerson || '-';
        var capital = company.registeredCapital || '-';
        var phone = company.phone || '-';
        var email = company.email || '-';
        var address = company.address || '-';
        var industry = getEnterpriseIndustry(company);
        var type = getEnterpriseType(company);
        var creditCode = getEnterpriseCreditCode(company);
        var establishDate = getEnterpriseEstablishDate(company);
        var htmlParts = ['<div class="enterprise-detail-page">'];

        htmlParts.push('<section class="enterprise-hero">');
        htmlParts.push('<div class="enterprise-brand-card"><span>' + escapeHtml(logoText.first) + '</span><span>' + escapeHtml(logoText.second) + '</span></div>');
        htmlParts.push('<div class="enterprise-hero-main">');
        htmlParts.push('<div class="enterprise-title-row"><h2>' + escapeHtml(company.name || '企业名称未登记') + '</h2><span class="enterprise-status">存续（在营、开业、在册）</span></div>');
        htmlParts.push('<div class="enterprise-tag-row"><span>小型企业</span><span>地方国企</span><div class="enterprise-update-row">' + buildUiIcon('clock') + '<span>数据更新： ' + escapeHtml(getEnterpriseUpdateDate(company)) + '</span></div></div>');
        htmlParts.push('</div>');
        htmlParts.push('<div class="enterprise-summary-grid">');
        htmlParts.push('<div>' + buildEnterpriseSummaryField('统一社会信用代码', creditCode) + buildEnterpriseSummaryField('法定代表人', legalPerson) + buildEnterpriseSummaryField('注册资本', capital) + buildEnterpriseSummaryField('成立日期', establishDate) + '</div>');
        htmlParts.push('<div>' + buildEnterpriseSummaryField('电话', phone) + buildEnterpriseSummaryField('邮箱', email) + buildEnterpriseSummaryField('官网', getEnterpriseWebsite(company)) + buildEnterpriseSummaryField('地址', address) + '</div>');
        htmlParts.push('<div>' + buildEnterpriseSummaryField('所处行业', industry) + buildEnterpriseSummaryField('企业类型', type) + buildEnterpriseSummaryField('员工人数', getEnterpriseEmployeeCount(company)) + buildEnterpriseSummaryField('经营范围', getEnterpriseScope(company)) + '</div>');

        htmlParts.push('</div></section>');
        htmlParts.push(buildEnterpriseMainTabs(selectedEnterpriseMainTab));
        if (selectedEnterpriseMainTab === '基本信息') {
            htmlParts.push(buildEnterpriseSubTabs(selectedEnterpriseSubTab));
            htmlParts.push(buildEnterpriseActiveSubSectionHtml(company, {
                creditCode: creditCode,
                legalPerson: legalPerson,
                capital: capital,
                establishDate: establishDate,
                address: address,
                industry: industry,
                type: type
            }));
        } else if (selectedEnterpriseMainTab === '企业图谱') {
            // iframe 嵌入股权穿透图页面，传入当前企业名称作为参数。
            var topologyUrl = '../equity-penetration/equity-penetration.html?company=' + encodeURIComponent(company.name || '');
            htmlParts.push('<div class="enterprise-topology-wrap"><iframe class="enterprise-topology-iframe" src="' + topologyUrl + '" title="企业图谱" frameborder="0"></iframe></div>');
        } else if (selectedEnterpriseMainTab === '风险情况') {
            htmlParts.push(buildEnterpriseRiskSectionHtml(company));
        } else if (selectedEnterpriseMainTab === '知识产权') {
            htmlParts.push(buildEnterpriseIntellectualSectionHtml(company));
        } else {
            htmlParts.push(buildEmptyState(selectedEnterpriseMainTab + '待接入', '当前页面已预留模块位置，后续可接入企业档案接口补全。'));
        }
        htmlParts.push('</div>');
        return htmlParts.join('');
    }

    // 概览字段：标签与值保持同一字号、同一字重、同一颜色，不再区分样式。
    function buildEnterpriseSummaryField(label, value) {
        return '<div class="enterprise-summary-field"><span>' + escapeHtml(label) + '：</span><span class="enterprise-summary-value">' + escapeHtml(value || '-') + '</span></div>';
    }

    // 企业档案一级页签：基本信息 / 企业图谱 / 风险情况 / 知识产权。
    function buildEnterpriseMainTabs(activeName) {
        var tabs = [
            ['基本信息', '', activeName === '基本信息'],
            ['企业图谱', '', activeName === '企业图谱'],
            ['风险情况', '', activeName === '风险情况'],
            ['知识产权', '', activeName === '知识产权']
        ];
        var htmlParts = ['<nav class="enterprise-tabs-main">'];
        var index = 0;
        for (index = 0; index < tabs.length; index += 1) {
            var activeClass = tabs[index][2] ? ' is-active' : '';
            htmlParts.push('<button type="button" class="' + activeClass + '" data-enterprise-main-tab="' + escapeHtml(tabs[index][0]) + '">' + escapeHtml(tabs[index][0]) + '</button>');
        }
        htmlParts.push('</nav>');
        return htmlParts.join('');
    }

    // 基本信息下的二级页签：工商/股东/主要人员/企业年报已实现，其余置灰占位。
    function buildEnterpriseSubTabs(activeName) {
        var tabs = [
            ['工商信息', '', activeName === '工商信息'],
            ['股东信息', '', activeName === '股东信息'],
            ['主要人员', '', activeName === '主要人员'],
            ['企业年报', '', activeName === '企业年报']
        ];
        var implementedTabs = ['工商信息', '股东信息', '主要人员', '企业年报'];
        var htmlParts = ['<nav class="enterprise-tabs-sub">'];
        var index = 0;
        for (index = 0; index < tabs.length; index += 1) {
            var activeClass = tabs[index][2] ? ' is-active' : '';
            var disabledClass = implementedTabs.indexOf(tabs[index][0]) >= 0 ? '' : ' is-disabled';
            htmlParts.push('<button type="button" class="' + activeClass + disabledClass + '" data-enterprise-sub-tab="' + escapeHtml(tabs[index][0]) + '">' + escapeHtml(tabs[index][0]) + '</button>');
        }
        htmlParts.push('</nav>');
        return htmlParts.join('');
    }

    // 按二级页签分发到对应内容区块。
    function buildEnterpriseActiveSubSectionHtml(company, data) {
        if (selectedEnterpriseSubTab === '股东信息') {
            return buildEnterpriseShareholderSectionHtml(company);
        }
        if (selectedEnterpriseSubTab === '主要人员') {
            return buildEnterprisePersonnelSectionHtml(company);
        }
        if (selectedEnterpriseSubTab === '企业年报') {
            return buildEnterpriseAnnualReportSectionHtml(company);
        }
        return buildEnterpriseRegistrationSectionHtml(company, data);
    }

    // 企业年报卡片：参照主要人员列表样式，展示历年公示的年报联系方式摘要。
    function buildEnterpriseAnnualReportSectionHtml(company) {
        return '<section class="enterprise-annual-card">'
            + buildEnterpriseAnnualReportTableHtml(getEnterpriseAnnualReportList(company))
            + '</section>';
    }

    // 企业年报表格：序号 / 年报年份 / 电子邮箱 / 企业通信地址 / 企业联系电话。
    function buildEnterpriseAnnualReportTableHtml(reportList) {
        var htmlParts = ['<table class="enterprise-annual-table"><thead><tr><th>序号</th><th>年报年份</th><th>电子邮箱</th><th>企业通信地址</th><th>企业联系电话</th></tr></thead><tbody>'];
        var index = 0;
        for (index = 0; index < reportList.length; index += 1) {
            htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(reportList[index].year) + '</td><td>' + escapeHtml(reportList[index].email) + '</td><td>' + escapeHtml(reportList[index].address) + '</td><td>' + escapeHtml(reportList[index].phone) + '</td></tr>');
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    // 企业年报样例数据：取公司档案的联系方式，生成近三年公示值。
    function getEnterpriseAnnualReportList(company) {
        // 【mock获取数据,后续根据实际业务调用后台获取：企业年报公示列表接口】
        var reportYears = ['2025', '2024', '2023'];
        var email = company.email;
        var phone = company.phone;
        var address = company.address;
        if (!email || email === '无') {
            email = '-';
        }
        if (!phone || phone === '无') {
            phone = '-';
        }
        if (!address) {
            address = '-';
        }
        var result = [];
        var index = 0;
        for (index = 0; index < reportYears.length; index += 1) {
            result.push({
                year: reportYears[index],
                email: email,
                address: address,
                phone: phone
            });
        }
        return result;
    }

    // 风险情况卡片：基于风险类型展示该单位涉及的风险条目，支持按单位名称搜索。
    function buildEnterpriseRiskSectionHtml(company) {
        var riskList = getEnterpriseRiskList(company);
        var filteredList = filterRiskListByCompanyName(riskList, riskSearchKeyword);
        var paged = paginate(filteredList, paginationState.risk);
        var keyword = escapeHtml(riskSearchKeyword);
        var resetVisible = riskSearchKeyword ? '' : ' is-hidden';
        return '<section class="enterprise-risk-card">'
            + '<div class="enterprise-risk-head">'
            + '<h3>风险情况</h3>'
            + '<div class="enterprise-shareholder-search enterprise-risk-search">'
            + '<button type="button" class="enterprise-shareholder-search-trigger" data-risk-search-trigger title="搜索">' + buildUiIcon('search') + '</button>'
            + '<input type="text" placeholder="搜索标段名称" value="' + keyword + '" data-risk-search-input>'
            + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-risk-search-reset title="清除">×</button>'
            + '</div>'
            + '</div>'
            + buildEnterpriseRiskTableHtml(paged.rows)
            + buildPaginationHtml('risk', paged.page, paged.totalPages)
            + '</section>';
    }

    // 风险情况按标段名称模糊过滤。
    function filterRiskListByCompanyName(list, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var index = 0;
        var result = [];
        if (!kw) {
            return list.slice();
        }
        for (index = 0; index < list.length; index += 1) {
            if (String(list[index].sectionName || '').toLowerCase().indexOf(kw) >= 0) {
                result.push(list[index]);
            }
        }
        return result;
    }

    // 风险情况表格：序号 / 标段名称 / 标段编号 / 问题类型 / 涉及单位 / 关联路径；空结果时显示空态。
    function buildEnterpriseRiskTableHtml(riskList) {
        var htmlParts = ['<table class="enterprise-risk-table"><thead><tr><th>序号</th><th>标段名称</th><th>标段编号</th><th>问题类型</th><th>涉及单位</th><th>关联路径</th></tr></thead><tbody>'];
        var index = 0;
        if (riskList.length === 0) {
            htmlParts.push('<tr><td colspan="6" class="enterprise-shareholder-empty">未匹配到符合条件的风险记录</td></tr>');
        } else {
            for (index = 0; index < riskList.length; index += 1) {
                htmlParts.push('<tr>'
                    + '<td>' + (index + 1) + '</td>'
                    + '<td>' + escapeHtml(riskList[index].sectionName) + '</td>'
                    + '<td>' + escapeHtml(riskList[index].sectionCode) + '</td>'
                    + '<td>' + escapeHtml(riskList[index].riskType) + '</td>'
                    + '<td>' + escapeHtml(riskList[index].companyName) + '</td>'
                    + '<td>' + escapeHtml(riskList[index].relatedPath) + '</td>'
                    + '</tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    // 风险情况样例数据：遍历所有标段中匹配该公司名的条目，逐条展开 riskFlags。
    function getEnterpriseRiskList(company) {
        // 【mock获取数据,后续根据实际业务调用后台获取：单位风险情况列表接口】
        var pathTemplates = [
            '该单位法定代表人同时担任同标段另一投标单位股东',
            '该单位联系电话与同标段另一投标单位完全一致',
            '该单位电子邮箱域名与同标段另一投标单位相同，疑似同一主体',
            '该单位注册地址与同标段另一投标单位相邻，存在异常群租'
        ];
        var result = [];
        var sectionList = (win && win.companyProfileMockData && win.companyProfileMockData.sectionList) || [];
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
                    var pathText = pathTemplates[flagIndex % pathTemplates.length];
                    result.push({
                        sectionName: section.name || '-',
                        sectionCode: section.code || '-',
                        riskType: riskFlags[flagIndex],
                        companyName: currentCompany.name || '-',
                        relatedPath: pathText
                    });
                }
            }
        }
        return result;
    }

    // 工商信息登记表。
    function buildEnterpriseRegistrationSectionHtml(company, data) {
        var htmlParts = [];
        htmlParts.push('<section class="enterprise-reg-card">');
        htmlParts.push('<table class="enterprise-reg-table"><tbody>');
        // 每行 3 对字段，确保表格规整。
        htmlParts.push(buildEnterpriseTableRow('企业名称', company.name || '-', '统一社会信用代码', data.creditCode, '法定代表人', data.legalPerson));
        htmlParts.push(buildEnterpriseTableRow('登记状态', '存续（在营、开业、在册）', '成立日期', data.establishDate, '注册资本', data.capital));
        htmlParts.push(buildEnterpriseTableRow('实缴资本', getEnterprisePaidCapital(data.capital), '企业类型', data.type, '营业期限', data.establishDate + '至无固定期限'));
        htmlParts.push(buildEnterpriseTableRow('组织机构代码', getEnterpriseOrgCode(data.creditCode), '工商注册号', getEnterpriseRegisterNo(data.creditCode), '纳税人识别号', data.creditCode));
        htmlParts.push(buildEnterpriseTableRow('纳税人资质', '一般纳税人', '人员规模', '-', '参保人数', '-'));
        htmlParts.push(buildEnterpriseTableRow('核准日期', getEnterpriseApproveDate(), '所属地区', getEnterpriseArea(data.address), '登记机关', getEnterpriseRegistry(data.address)));
        htmlParts.push(buildEnterpriseTableRow('进出口企业代码', '-', '国标行业', data.industry, '行业代码', getEnterpriseIndustryCode(data.industry)));
        htmlParts.push(buildEnterpriseTableRow('英文名', '-', '注册地址经纬度', getEnterpriseCoordinate(data.address), '注册地址', data.address));
        htmlParts.push(buildEnterpriseTableRow('通信地址', data.address));
        htmlParts.push('</tbody></table></section>');
        return htmlParts.join('');
    }

    // 股东信息卡片：当前股东 / 历史股东 切换。
    function buildEnterpriseShareholderSectionHtml(company) {
        var currentList = getEnterpriseShareholderList(company, false);
        var historyList = getEnterpriseShareholderList(company, true);
        var activeList = selectedEnterpriseShareholderHistory ? historyList : currentList;
        var filteredList = filterShareholderListByName(activeList, shareholderSearchKeyword);
        var pageKey = selectedEnterpriseShareholderHistory ? 'shareholderHistory' : 'shareholder';
        var paged = paginate(filteredList, paginationState[pageKey]);
        var keyword = escapeHtml(shareholderSearchKeyword);
        var resetVisible = shareholderSearchKeyword ? '' : ' is-hidden';
        return '<section class="enterprise-shareholder-card">'
            + '<div class="enterprise-shareholder-head">'
            + '<div class="enterprise-shareholder-switch">'
            + '<button type="button" class="' + (selectedEnterpriseShareholderHistory ? '' : 'is-active') + '" data-enterprise-shareholder-history="false">股东信息</button>'
            + '<button type="button" class="' + (selectedEnterpriseShareholderHistory ? 'is-active' : '') + '" data-enterprise-shareholder-history="true">历史股东信息</button>'
            + '</div>'
            + '<div class="enterprise-shareholder-search">'
            + '<button type="button" class="enterprise-shareholder-search-trigger" data-shareholder-search-trigger title="搜索">' + buildUiIcon('search') + '</button>'
            + '<input type="text" placeholder="搜索股东名称" value="' + keyword + '" data-shareholder-search-input>'
            + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-shareholder-search-reset title="清除">×</button>'
            + '</div>'
            + '</div>'
            + buildEnterpriseShareholderTableHtml(paged.rows)
            + buildPaginationHtml(pageKey, paged.page, paged.totalPages)
            + '</section>';
    }

    // 按股东名称关键字过滤股东列表，支持不区分大小写的模糊匹配。
    function filterShareholderListByName(list, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var index = 0;
        var result = [];
        if (!kw) {
            return list.slice();
        }
        for (index = 0; index < list.length; index += 1) {
            if (String(list[index].name || '').toLowerCase().indexOf(kw) >= 0) {
                result.push(list[index]);
            }
        }
        return result;
    }

    // 股东表格行渲染，空结果时显示整行空态提示。
    function buildEnterpriseShareholderTableHtml(shareholderList) {
        var htmlParts = ['<table class="enterprise-shareholder-table"><thead><tr><th>序号</th><th>股东</th><th>持股比例</th><th>认缴出资额</th><th>实缴出资额</th><th>认缴出资日期</th></tr></thead><tbody>'];
        var index = 0;
        if (shareholderList.length === 0) {
            htmlParts.push('<tr><td colspan="6" class="enterprise-shareholder-empty">未匹配到符合条件的股东</td></tr>');
        } else {
            for (index = 0; index < shareholderList.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td><span class="enterprise-shareholder-name">' + escapeHtml(shareholderList[index].name) + '</span></td><td>' + escapeHtml(shareholderList[index].ratio) + '</td><td>' + escapeHtml(shareholderList[index].subscribedAmount) + '</td><td>' + escapeHtml(shareholderList[index].paidAmount) + '</td><td>' + escapeHtml(shareholderList[index].subscribedDate) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    // 按“是否历史”切分股东来源数据。
    function getEnterpriseShareholderList(company, isHistory) {
        var sourceList = getEnterpriseShareholderSourceList(company);
        var result = [];
        var index = 0;
        for (index = 0; index < sourceList.length; index += 1) {
            var shareholder = sourceList[index];
            if (shareholder.isHistory === isHistory) {
                result.push(shareholder);
            }
        }
        return result;
    }

    // 股东来源：优先取单位对象里的 shareholders，缺省时回退到样例股东。
    function getEnterpriseShareholderSourceList(company) {
        var shareholders = company.shareholders || [];
        var result = [];
        var index = 0;
        if (shareholders.length > 0) {
            for (index = 0; index < shareholders.length; index += 1) {
                result.push({
                    name: shareholders[index].name || '未登记',
                    ratio: shareholders[index].ratio || '-',
                    subscribedAmount: getEnterpriseSubscribedAmount(company, shareholders[index].ratio, index),
                    paidAmount: '-',
                    subscribedDate: getEnterpriseShareholderSubscribedDate(index),
                    isHistory: false
                });
            }
        } else {
            result.push({
                name: getEnterpriseFallbackShareholderName(company, 0),
                ratio: '98.23%',
                subscribedAmount: getEnterpriseSubscribedAmount(company, '98.23%', 0),
                paidAmount: '-',
                subscribedDate: '2017-03-15',
                isHistory: false
            });
            result.push({
                name: getEnterpriseFallbackShareholderName(company, 1),
                ratio: '1.77%',
                subscribedAmount: getEnterpriseSubscribedAmount(company, '1.77%', 1),
                paidAmount: '-',
                subscribedDate: '-',
                isHistory: false
            });
        }
        result.push({
            name: '云南省建设投资控股集团有限公司',
            ratio: '98.23%',
            subscribedAmount: getEnterpriseSubscribedAmount(company, '98.23%', 0),
            paidAmount: '-',
            subscribedDate: '2017-03-15',
            isHistory: true
        });
        result.push({
            name: '云南建投第一水利水电建设有限公司',
            ratio: '1.77%',
            subscribedAmount: getEnterpriseSubscribedAmount(company, '1.77%', 1),
            paidAmount: '-',
            subscribedDate: '-',
            isHistory: true
        });
        result.push({
            name: '云南工程建设总承包股份有限公司',
            ratio: '12.50%',
            subscribedAmount: getEnterpriseSubscribedAmount(company, '12.50%', 2),
            paidAmount: '-',
            subscribedDate: '2019-06-21',
            isHistory: true
        });
        return result;
    }

    // 按注册资本与持股比例推算认缴出资额，取不到时回退样例值。
    function getEnterpriseSubscribedAmount(company, ratio, index) {
        var capital = parseFloat(String(company.registeredCapital || '').replace(/,/g, ''));
        var percent = parseFloat(String(ratio || '').replace('%', ''));
        if (!isNaN(capital) && !isNaN(percent)) {
            return formatEnterpriseAmount(capital * percent / 100) + '万人民币';
        }
        if (index === 0) {
            return '60907.535万人民币';
        }
        if (index === 1) {
            return '1099.81万人民币';
        }
        return '-';
    }

    // 金额格式化：去掉多余的小数末尾 0。
    function formatEnterpriseAmount(value) {
        var text = String(Math.round(value * 1000) / 1000);
        return text.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    // 缺省股东名回退。
    function getEnterpriseFallbackShareholderName(company, index) {
        if (index === 0) {
            return '云南省建设投资控股集团有限公司';
        }
        if (company.name && company.name.indexOf('第四') >= 0) {
            return '云南建投第一水利水电建设有限公司';
        }
        return '关联出资单位';
    }

    // 股东认缴出资日期样例回退。
    function getEnterpriseShareholderSubscribedDate(index) {
        if (index === 0) {
            return '2017-03-15';
        }
        if (index === 1) {
            return '-';
        }
        return '2019-06-21';
    }

    // 知识产权卡片：专利搜索申请号、著作权搜索登记号、域名无搜索。
    function buildEnterpriseIntellectualSectionHtml(company) {
        var patentList = getEnterprisePatentList(company);
        var copyrightList = getEnterpriseCopyrightList(company);
        var domainList = getEnterpriseDomainList(company);
        var htmlParts = ['<section class="enterprise-ip-card">'];
        htmlParts.push('<div class="enterprise-ip-toolbar">');
        htmlParts.push('<div class="enterprise-ip-switch">');
        htmlParts.push('<button type="button" class="' + (selectedEnterpriseIpSubTab === '专利信息' ? 'is-active' : '') + '" data-enterprise-ip-sub-tab="专利信息">专利信息</button>');
        htmlParts.push('<button type="button" class="' + (selectedEnterpriseIpSubTab === '作品著作权' ? 'is-active' : '') + '" data-enterprise-ip-sub-tab="作品著作权">作品著作权</button>');
        htmlParts.push('<button type="button" class="' + (selectedEnterpriseIpSubTab === '域名信息' ? 'is-active' : '') + '" data-enterprise-ip-sub-tab="域名信息">域名信息</button>');
        htmlParts.push('</div>');
        if (selectedEnterpriseIpSubTab === '专利信息') {
            htmlParts.push(buildEnterpriseIpSearchHtml(patentSearchKeyword, '搜索专利申请号', 'patent'));
        } else if (selectedEnterpriseIpSubTab === '作品著作权') {
            htmlParts.push(buildEnterpriseIpSearchHtml(copyrightSearchKeyword, '搜索登记号', 'copyright'));
        }
        htmlParts.push('</div>');
        if (selectedEnterpriseIpSubTab === '专利信息') {
            var patentFiltered = filterPatentListByApplyNo(patentList.rows, patentSearchKeyword);
            var patentPaged = paginate(patentFiltered, paginationState.patent);
            htmlParts.push(buildEnterprisePatentTableHtml(patentPaged.rows));
            htmlParts.push(buildPaginationHtml('patent', patentPaged.page, patentPaged.totalPages));
        } else if (selectedEnterpriseIpSubTab === '作品著作权') {
            var copyrightFiltered = filterCopyrightListByRegisterNo(copyrightList.rows, copyrightSearchKeyword);
            var copyrightPaged = paginate(copyrightFiltered, paginationState.copyright);
            htmlParts.push(buildEnterpriseCopyrightTableHtml(copyrightPaged.rows));
            htmlParts.push(buildPaginationHtml('copyright', copyrightPaged.page, copyrightPaged.totalPages));
        } else {
            var domainPaged = paginate(domainList.rows, paginationState.domain);
            htmlParts.push(buildEnterpriseDomainTableHtml(domainPaged.rows));
            htmlParts.push(buildPaginationHtml('domain', domainPaged.page, domainPaged.totalPages));
        }
        htmlParts.push('</section>');
        return htmlParts.join('');
    }

    // 知识产权子搜索框：复用股东搜索框样式。
    function buildEnterpriseIpSearchHtml(keyword, placeholder, scope) {
        var escKeyword = escapeHtml(keyword);
        var resetVisible = keyword ? '' : ' is-hidden';
        var triggerAttr = scope === 'patent' ? 'data-patent-search-trigger' : 'data-copyright-search-trigger';
        var inputAttr = scope === 'patent' ? 'data-patent-search-input' : 'data-copyright-search-input';
        var resetAttr = scope === 'patent' ? 'data-patent-search-reset' : 'data-copyright-search-reset';
        return '<div class="enterprise-shareholder-search enterprise-ip-search">'
            + '<button type="button" class="enterprise-shareholder-search-trigger" ' + triggerAttr + ' title="搜索">' + buildUiIcon('search') + '</button>'
            + '<input type="text" placeholder="' + placeholder + '" value="' + escKeyword + '" ' + inputAttr + '>'
            + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" ' + resetAttr + ' title="清除">×</button>'
            + '</div>';
    }

    // 专利申请号模糊过滤。
    function filterPatentListByApplyNo(rows, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var index = 0;
        var result = [];
        if (!kw) {
            return rows.slice();
        }
        for (index = 0; index < rows.length; index += 1) {
            if (String(rows[index].applyNo || '').toLowerCase().indexOf(kw) >= 0) {
                result.push(rows[index]);
            }
        }
        return result;
    }

    // 著作权登记号模糊过滤。
    function filterCopyrightListByRegisterNo(rows, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var index = 0;
        var result = [];
        if (!kw) {
            return rows.slice();
        }
        for (index = 0; index < rows.length; index += 1) {
            if (String(rows[index].registerNo || '').toLowerCase().indexOf(kw) >= 0) {
                result.push(rows[index]);
            }
        }
        return result;
    }

    // 专利表格行渲染，空结果时显示整行空态提示。
    function buildEnterprisePatentTableHtml(patentList) {
        var htmlParts = ['<table class="enterprise-ip-table enterprise-ip-table--patent"><thead><tr><th>序号</th><th>专利名称</th><th>专利类型</th><th>授权状态</th><th>专利申请号</th><th>专利申请日</th><th>摘要</th></tr></thead><tbody>'];
        var index = 0;
        if (patentList.length === 0) {
            htmlParts.push('<tr><td colspan="7" class="enterprise-shareholder-empty">未匹配到符合条件的专利</td></tr>');
        } else {
            for (index = 0; index < patentList.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(patentList[index].name) + '</td><td>' + escapeHtml(patentList[index].type) + '</td><td>' + escapeHtml(patentList[index].status) + '</td><td>' + escapeHtml(patentList[index].applyNo) + '</td><td>' + escapeHtml(patentList[index].applyDate) + '</td><td>' + escapeHtml(patentList[index].summary) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    // 作品著作权表格行渲染，空结果时显示整行空态提示。
    function buildEnterpriseCopyrightTableHtml(copyrightList) {
        var htmlParts = ['<table class="enterprise-ip-table enterprise-ip-table--copyright"><thead><tr><th>序号</th><th>作品名称</th><th>登记号</th><th>类别</th><th>首次发布日期</th><th>登记日期</th></tr></thead><tbody>'];
        var index = 0;
        if (copyrightList.length === 0) {
            htmlParts.push('<tr><td colspan="6" class="enterprise-shareholder-empty">未匹配到符合条件的著作权</td></tr>');
        } else {
            for (index = 0; index < copyrightList.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(copyrightList[index].name) + '</td><td>' + escapeHtml(copyrightList[index].registerNo) + '</td><td>' + escapeHtml(copyrightList[index].category) + '</td><td>' + escapeHtml(copyrightList[index].publishDate) + '</td><td>' + escapeHtml(copyrightList[index].registerDate) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    // 专利样例数据（研发/运维阶段与正式接口结构保持一致）。
    function getEnterprisePatentList(company) {
        var prefix = getEnterprisePatentPrefix(company);
        return {
            total: 179,
            rows: [
                { name: '一种改性明胶和铜掺杂二氧化锰低甲醛脲醛胶及制备方法', type: '中国发明专利', status: '未授权', applyNo: 'CN202610044763.9', applyDate: '2026-01-14', summary: '本发明涉及胶黏剂制备技术领域，公开了一种铜掺杂二氧化锰低甲醛脲醛胶和制备方法。' },
                { name: '一种用于市政工程的抑尘喷淋装置', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202522453663.5', applyDate: '2025-11-19', summary: '本实用新型提供了一种抑尘喷淋技术方案，解决施工现场扬尘控制和喷雾覆盖效率问题。' },
                { name: '一种市政管道工程的沟槽支护结构', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202522419910.X', applyDate: '2025-11-14', summary: '本实用新型提供了一种沟槽支护结构，提高管道施工过程中的支撑稳定性。' },
                { name: '一种建筑施工用的铝模板底角成型结构', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202521988010.0', applyDate: '2025-09-16', summary: '本实用新型公开了一种建筑施工模板构件，改善底角连接和成型质量。' },
                { name: prefix + '全自动智能筛分计量装置用上料机构', type: '中国实用新型专利', status: '已授权', applyNo: 'CN202521593880.8', applyDate: '2025-07-29', summary: '本实用新型公开了一种上料机构，包括横向移载部件和计量输送部件。' }
            ]
        };
    }

    // 作品著作权样例数据。
    function getEnterpriseCopyrightList(company) {
        return {
            total: 7,
            rows: [
                { name: '虚拟女主持人', registerNo: '国作登字-2020-F-01062563', category: '美术', publishDate: '2019-12-20', registerDate: '2020-07-01' },
                { name: '虚拟男主持人', registerNo: '国作登字-2020-F-01062562', category: '美术', publishDate: '2019-12-20', registerDate: '2020-07-01' },
                { name: '新点投标一体机系列版权', registerNo: '国作登字-2019-L-00836042', category: '其他', publishDate: '2019-06-20', registerDate: '2019-09-12' },
                { name: '新点投标一体机（投标文件制作软件）系列版权', registerNo: '国作登字-2019-L-00836041', category: '其他', publishDate: '2019-06-20', registerDate: '2019-09-12' },
                { name: '新点投标一体机（造价软件）系列版权', registerNo: '国作登字-2019-L-00836044', category: '其他', publishDate: '2019-06-20', registerDate: '2019-09-12' },
                { name: 'Epoint新点', registerNo: '国作登字-2018-F-00673505', category: '美术', publishDate: '2018-10-08', registerDate: '2018-12-14' },
                { name: '小桥系列图形', registerNo: '国作登字-2018-F-00661396', category: '美术', publishDate: '2017-12-03', registerDate: '2018-11-08' }
            ]
        };
    }

    // 域名信息表格行渲染。
    function buildEnterpriseDomainTableHtml(domainRows) {
        var htmlParts = ['<table class="enterprise-ip-table enterprise-ip-table--domain"><thead><tr><th>序号</th><th>域名</th><th>网站备案许可号</th><th>主页URL</th><th>主办单位性质</th><th>核查日期</th></tr></thead><tbody>'];
        var index = 0;
        for (index = 0; index < domainRows.length; index += 1) {
            htmlParts.push('<tr>'
                + '<td>' + (index + 1) + '</td>'
                + '<td>' + escapeHtml(domainRows[index].domain) + '</td>'
                + '<td>' + escapeHtml(domainRows[index].icp) + '</td>'
                + '<td>' + escapeHtml(domainRows[index].homeUrl) + '</td>'
                + '<td>' + escapeHtml(domainRows[index].ownerType) + '</td>'
                + '<td>' + escapeHtml(domainRows[index].checkDate) + '</td>'
                + '</tr>');
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    // 域名信息样例数据：从公司官网字段回退拼装 3 条备案记录。
    function getEnterpriseDomainList(company) {
        // 【mock获取数据,后续根据实际业务调用后台获取：单位域名备案列表接口】
        var rawDomain = (company.website || 'www.unionecredit.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
        var baseDomain = rawDomain.indexOf('www.') === 0 ? rawDomain.substring(4) : rawDomain;
        var ownerName = company.name || '-';
        var rows = [
            { domain: 'www.' + baseDomain, icp: '滇ICP备2023012345号-1', homeUrl: 'https://www.' + baseDomain + '/', ownerType: '企业', checkDate: '2026-05-22' },
            { domain: 'm.' + baseDomain, icp: '滇ICP备2023012345号-2', homeUrl: 'https://m.' + baseDomain + '/', ownerType: '企业', checkDate: '2026-05-22' },
            { domain: 'static.' + baseDomain, icp: '滇ICP备2023012345号-3', homeUrl: 'https://static.' + baseDomain + '/assets/', ownerType: '企业', checkDate: '2026-05-22' }
        ];
        return { total: rows.length, rows: rows };
    }

    // 专利名前缀按企业名称特征回退。
    function getEnterprisePatentPrefix(company) {
        if (company.name && company.name.indexOf('建设') >= 0) {
            return '土石料';
        }
        return '工程材料';
    }

    // 主要人员卡片：当前人员 / 历史人员 切换 + 姓名搜索。
    function buildEnterprisePersonnelSectionHtml(company) {
        var currentList = getEnterprisePersonnelList(company, false);
        var historyList = getEnterprisePersonnelList(company, true);
        var activeList = selectedEnterprisePersonnelHistory ? historyList : currentList;
        var filteredList = filterPersonnelListByName(activeList, personnelSearchKeyword);
        var pageKey = selectedEnterprisePersonnelHistory ? 'personnelHistory' : 'personnel';
        var paged = paginate(filteredList, paginationState[pageKey]);
        var keyword = escapeHtml(personnelSearchKeyword);
        var resetVisible = personnelSearchKeyword ? '' : ' is-hidden';
        return '<section class="enterprise-personnel-card">'
            + '<div class="enterprise-personnel-head">'
            + '<div class="enterprise-personnel-switch">'
            + '<button type="button" class="' + (selectedEnterprisePersonnelHistory ? '' : 'is-active') + '" data-enterprise-personnel-history="false">主要人员</button>'
            + '<button type="button" class="' + (selectedEnterprisePersonnelHistory ? 'is-active' : '') + '" data-enterprise-personnel-history="true">历史主要人员</button>'
            + '</div>'
            + '<div class="enterprise-shareholder-search enterprise-personnel-search">'
            + '<button type="button" class="enterprise-shareholder-search-trigger" data-personnel-search-trigger title="搜索">' + buildUiIcon('search') + '</button>'
            + '<input type="text" placeholder="搜索人员姓名" value="' + keyword + '" data-personnel-search-input>'
            + '<button type="button" class="enterprise-shareholder-search-reset' + resetVisible + '" data-personnel-search-reset title="清除">×</button>'
            + '</div>'
            + '</div>'
            + buildEnterprisePersonnelTableHtml(paged.rows)
            + buildPaginationHtml(pageKey, paged.page, paged.totalPages)
            + '</section>';
    }

    // 按人员姓名关键字过滤人员列表，支持不区分大小写的模糊匹配。
    function filterPersonnelListByName(list, keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        var index = 0;
        var result = [];
        if (!kw) {
            return list.slice();
        }
        for (index = 0; index < list.length; index += 1) {
            if (String(list[index].name || '').toLowerCase().indexOf(kw) >= 0) {
                result.push(list[index]);
            }
        }
        return result;
    }

    // 主要人员表格行渲染，空结果时显示整行空态提示。
    function buildEnterprisePersonnelTableHtml(personnelList) {
        var htmlParts = ['<table class="enterprise-personnel-table"><thead><tr><th>序号</th><th>姓名</th><th>职位</th><th>持股比例</th><th>任职实际开始时间</th></tr></thead><tbody>'];
        var index = 0;
        if (personnelList.length === 0) {
            htmlParts.push('<tr><td colspan="5" class="enterprise-shareholder-empty">未匹配到符合条件的人员</td></tr>');
        } else {
            for (index = 0; index < personnelList.length; index += 1) {
                htmlParts.push('<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(personnelList[index].name) + '</td><td>' + escapeHtml(personnelList[index].position) + '</td><td>' + escapeHtml(personnelList[index].shareRatio) + '</td><td>' + escapeHtml(personnelList[index].startDate) + '</td></tr>');
            }
        }
        htmlParts.push('</tbody></table>');
        return htmlParts.join('');
    }

    // 按“是否历史”切分人员来源数据。
    function getEnterprisePersonnelList(company, isHistory) {
        var sourceList = getEnterprisePersonnelSourceList(company);
        var result = [];
        var index = 0;
        for (index = 0; index < sourceList.length; index += 1) {
            var item = sourceList[index];
            if (item.isHistory === isHistory) {
                result.push(item);
            }
        }
        return result;
    }

    // 主要人员样例数据（当前与历史任职名单）。
    function getEnterprisePersonnelSourceList(company) {
        var currentNames = ['王枫', '管红梅', '邓书超', '赵琼华', '高金秀', '李兴奎', '余绍彬', '赵翰臻', '王燕奎'];
        var currentDates = ['2026-08-13', '2026-06-25', '2025-09-24', '2025-09-24', '2025-09-24', '2024-01-19', '2024-01-19', '2023-10-27', '2018-03-29'];
        var historyNames = ['吴鸣', '马利波', '赵志宏', '李兴奎', '余绍彬', '王燕奎', '赵翰臻', '管红梅', '高金秀', '王枫', '邓书超', '赵琼华', '陈建华', '刘云华', '杨晓东', '张志刚', '李国强', '周明', '孙健', '何平', '罗勇', '段敏', '郭磊', '韩旭', '许峰', '沈青', '唐鹏', '蔡琳', '廖军'];
        var result = [];
        var index = 0;
        for (index = 0; index < currentNames.length; index += 1) {
            result.push({
                name: currentNames[index],
                position: getEnterprisePersonnelPosition(index, false),
                shareRatio: '-',
                startDate: currentDates[index],
                isHistory: false
            });
        }
        for (index = 0; index < historyNames.length; index += 1) {
            result.push({
                name: historyNames[index],
                position: getEnterprisePersonnelPosition(index, true),
                shareRatio: '-',
                startDate: getEnterpriseHistoryPersonnelDate(index),
                isHistory: true
            });
        }
        return result;
    }

    // 人员职位样例回退规则。
    function getEnterprisePersonnelPosition(index, isHistory) {
        if (!isHistory && index === 6) {
            return '董事长,总经理';
        }
        if (isHistory && index % 5 === 0) {
            return '监事';
        }
        if (isHistory && index % 4 === 0) {
            return '经理';
        }
        return '董事';
    }

    // 历史任职开始时间样例回退。
    function getEnterpriseHistoryPersonnelDate(index) {
        var dates = ['2023-10-27', '2022-08-15', '2021-04-09', '2020-11-18', '2019-06-30', '2018-03-29'];
        return dates[index % dates.length];
    }

    // 工商登记表三列结构：支持 1~3 组「标签 + 值」。
    function buildEnterpriseTableRow(label1, value1, label2, value2, label3, value3) {
        var html = '<tr><th>' + escapeHtml(label1 || '') + '</th><td>' + escapeHtml(value1 || '-') + '</td>';
        if (label2) {
            html += '<th>' + escapeHtml(label2) + '</th><td>' + escapeHtml(value2 || '-') + '</td>';
        } else {
            html += '<td colspan="4"></td>';
        }
        if (label3) {
            html += '<th>' + escapeHtml(label3) + '</th><td>' + escapeHtml(value3 || '-') + '</td>';
        } else if (label2) {
            html += '<td colspan="2"></td>';
        }
        html += '</tr>';
        return html;
    }

    // ============ 企业字段派生辅助（缺省回退样例） ============

    // 企业 LOGO 文字：取名称前 2/后 2 个字。
    function getEnterpriseLogoText(companyName) {
        if (companyName.indexOf('联合征信') >= 0) {
            return { first: '联合', second: '征信' };
        }
        var cleanName = (companyName || '企业档案').replace(/(有限责任公司|股份有限公司|有限公司|集团|公司)/g, '');
        return {
            first: cleanName.slice(0, 2) || '企业',
            second: cleanName.slice(2, 4) || '档案'
        };
    }

    // 统一社会信用代码：缺省时回退样例值。
    function getEnterpriseCreditCode(company) {
        return company.creditCode || company.unifiedSocialCreditCode || '91310104MA1FRNWW80';
    }

    function getEnterpriseUpdateDate(company) {
        return company.updateDate || '2026-05-22';
    }

    function getEnterpriseEstablishDate(company) {
        return company.establishDate || '2021-04-09';
    }

    function getEnterpriseIndustry(company) {
        return company.industry || '信用服务';
    }

    function getEnterpriseType(company) {
        return company.enterpriseType || '有限责任公司(国有控股)';
    }

    function getEnterpriseWebsite(company) {
        return company.website || 'www.unionecredit.com';
    }

    function getEnterpriseEmployeeCount(company) {
        return company.employeeCount || '48';
    }

    function getEnterpriseScope(company) {
        return company.businessScope || '许可项目：企业信用征信服务；企业信用评级；企业信用调查；...';
    }

    function getEnterprisePaidCapital(capital) {
        if (capital.indexOf('20000') >= 0) {
            return '10000万人民币';
        }
        return '-';
    }

    function getEnterpriseOrgCode(creditCode) {
        if (creditCode.length >= 10) {
            return creditCode.slice(8, 17);
        }
        return '-';
    }

    function getEnterpriseRegisterNo(creditCode) {
        if (creditCode.length >= 14) {
            return creditCode.slice(2, 16);
        }
        return '-';
    }

    function getEnterpriseArea(address) {
        if (address.indexOf('上海') >= 0) {
            return '上海市徐汇区';
        }
        if (address.indexOf('云南') >= 0) {
            return '云南省';
        }
        return '-';
    }

    function getEnterpriseRegistry(address) {
        if (address.indexOf('上海') >= 0) {
            return '徐汇区市场监督管理局';
        }
        if (address.indexOf('云南') >= 0) {
            return '云南省市场监督管理局';
        }
        return '市场监督管理局';
    }

    function getEnterpriseApproveDate() {
        return '2026-05-21';
    }

    function getEnterpriseIndustryCode(industry) {
        if (industry.indexOf('信用') >= 0) {
            return 'L7295';
        }
        return '-';
    }

    function getEnterpriseCoordinate(address) {
        if (address.indexOf('上海') >= 0) {
            return '经度：121.458110，纬度：31.183143';
        }
        return '-';
    }

    // 列表搜索匹配：按单位名称 / 法定代表人 / 股东名匹配关键字。
    function isCompanyProfileMatched(company, keyword) {
        if (!keyword) {
            return true;
        }
        if (String(company.name || '').toLowerCase().indexOf(keyword) >= 0) {
            return true;
        }
        if (String(company.legalPerson || '').toLowerCase().indexOf(keyword) >= 0) {
            return true;
        }
        var shareholders = company.shareholders || [];
        var index = 0;
        for (index = 0; index < shareholders.length; index += 1) {
            if (String(shareholders[index].name || '').toLowerCase().indexOf(keyword) >= 0) {
                return true;
            }
        }
        return false;
    }

    // ============ 通用工具方法 ============

    // 向上查找带指定 data-* 的按钮，事件委托统一用这个函数收敛。
    function findParentButton(target, boundary) {
        while (target && target !== boundary) {
            if (target.tagName === 'BUTTON') {
                return target;
            }
            target = target.parentNode;
        }
        return null;
    }

    // 简单模板渲染：只替换 {{key}} 占位符，业务数据先在 JS 中整理好再传入。
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

    // HTML 转义：接口返回与用户输入文本必须转义后再插入。
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 内联 SVG 图标集合：与主页面 buildUiIcon 保持一致，避免页面内散落大段图标字符串。
    function buildUiIcon(name) {
        if (name === 'building') {
            return '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"></path><path d="M8 21v-5h8v5M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"></path></svg>';
        }
        if (name === 'users') {
            return '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
        }
        if (name === 'layers') {
            return '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>';
        }
        if (name === 'alert' || name === 'warning') {
            return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6M12 17h.01"></path></svg>';
        }
        if (name === 'shield') {
            return '<svg viewBox="0 0 24 24"><path d="M12 3l8 4v5c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V7l8-4z"></path><path d="M12 8v5M12 16h.01"></path></svg>';
        }
        if (name === 'tag') {
            return '<svg viewBox="0 0 24 24"><path d="M20 13l-7 7-10-10V3h7l10 10z"></path><circle cx="7.5" cy="7.5" r="1"></circle></svg>';
        }
        if (name === 'file') {
            return '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M8 13h8M8 17h8"></path></svg>';
        }
        if (name === 'clock') {
            return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>';
        }
        if (name === 'calendar') {
            return '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>';
        }
        if (name === 'pie') {
            return '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9v9z"></path><path d="M12 3a9 9 0 0 1 9 9h-9z"></path></svg>';
        }
        return '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>';
    }
})(window, document);
