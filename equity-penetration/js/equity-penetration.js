/* ============================================================
 * 页面主脚本 equity-penetration.js
 * 作用范围：股权穿透图页面所有业务逻辑
 * 组织顺序（符合规范 3.3）：
 *   1. 页面变量  2. 初始化入口  3. 事件绑定
 *   4. 接口请求  5. 数据处理  6. 渲染方法  7. 工具方法
 * 设计原则：
 *   - IIFE 包裹，业务函数不挂 window；
 *   - 一步一变量、一行一件事，不嵌套函数调用；
 *   - 渲染层只消费 transformXxxData 的结果，不直接依赖后端历史字段；
 *   - jQuery 统一负责 DOM 缓存、事件绑定、显隐切换、内容更新；
 *   - 文件 input.files、requestFullscreen 等浏览器底层能力保留原生 DOM。
 * ============================================================ */
'use strict';
(function (win, $) {
    /* =========================================================
     * 1. 页面变量
     * ========================================================= */

    //jQuery 节点缓存：统一在这里查找页面常用容器，避免重复查询
    var $appContainer = $('#equity-penetration-app');
    var $headerBar = $('#header-bar');
    var $canvasMain = $('#canvas-main');
    var $canvasViewport = $('#penetration-canvas-viewport');
    var $canvasWorld = $('#canvas-world-transform');
    var $svgTreeConnections = $('#svg-tree-connections');
    var $nodeCardsContainer = $('#node-cards-container');
    var $currentCompanyName = $('#current-company-name');

    //详情弹窗节点缓存
    var $detailModalOverlay = $('#company-detail-modal-overlay');
    var $detailModalTitle = $('#detail-modal-title');
    var $detailModalShortName = $('#detail-modal-short-name');
    var $detailModalTypeTag = $('#detail-modal-type-tag');
    var $detailModalStatusTag = $('#detail-modal-status-tag');
    var $detailModalEquityOverview = $('#detail-modal-equity-overview');
    var $detailModalRatio = $('#detail-modal-ratio');
    var $detailModalAmountWrap = $('#detail-modal-amount-wrap');
    var $detailModalAmount = $('#detail-modal-amount');
    var $detailModalLegalPerson = $('#detail-modal-legal-person');
    var $detailModalRegisteredCapital = $('#detail-modal-registered-capital');
    var $detailModalCreditCode = $('#detail-modal-credit-code');
    var $detailModalEstablishDate = $('#detail-modal-establish-date');
    var $detailModalProvince = $('#detail-modal-province');
    var $detailModalParentsCount = $('#detail-modal-parents-count');
    var $detailModalChildrenCount = $('#detail-modal-children-count');

    //添加节点弹窗节点缓存
    var $addNodeModalOverlay = $('#add-node-modal-overlay');
    var $addNodeForm = $('#add-node-form');
    var $selectTargetCompany = $('#select-target-company');
    var $inputCompanyName = $('#input-company-name');
    var $inputShortName = $('#input-short-name');
    var $inputCompanyRatio = $('#input-company-ratio');
    var $inputLegalPerson = $('#input-legal-person');
    var $inputAmount = $('#input-amount');

    //水印背景常量：与原 PenetrationCanvas 完全一致，避免改动视觉
    var WATERMARK_TEXT = '寻源询价 | 国泰新点软件股份有限公司 版权智';
    var WATERMARK_SVG_DATA_URI = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'320\' height=\'160\' viewBox=\'0 0 320 160\'%3E%3Ctext x=\'20\' y=\'90\' fill=\'%23000000\' font-size=\'13\' font-family=\'sans-serif\' transform=\'rotate(-22 20 90)\'%3E' + encodeURIComponent(WATERMARK_TEXT) + '%3C/text%3E%3C/svg%3E")';

    //treeData 当前页面渲染的整棵树数据：来自 Mock 或后续后台接口
    var treeData = null;

    //expandedNodeIds 当前展开的节点 id 集合：初始为空集合，让加号可点击展开
    var expandedNodeIds = {};

    //视口状态：zoom 缩放、pan 平移
    var zoom = 1;
    var pan = { x: 0, y: 0 };

    //显示状态：是否显示简称、是否显示水印、是否全屏
    var showShortName = false;
    var showWatermark = true;
    var isFullscreen = false;

    //当前选中的节点：用于详情弹窗
    var selectedNode = null;

    //画布拖拽状态：原生鼠标事件需要保留原生 e.button / e.clientX 等字段
    var isDragging = false;
    var dragStart = { x: 0, y: 0 };

    /* =========================================================
     * 2. 初始化入口
     * ========================================================= */
    //统一初始化页面：先加载水印、绑定事件，再加载首屏数据
    function initPage() {
        initWatermarkLayer();
        //同步按钮初始状态：水印/全屏按钮在数据加载前就需显示正确
        updateWatermarkVisibility();
        updateFullscreenButton();
        bindPageEvents();
        loadInitialData();
    }

    /* =========================================================
     * 3. 事件绑定
     * ========================================================= */
    //集中绑定所有固定控件事件，避免交互逻辑散落
    function bindPageEvents() {
        //顶部操作按钮
        $('#btn-toggle-fullscreen').on('click', onToggleFullscreenClick);
        $('#btn-save-image').on('click', onSaveImageClick);
        // 移除右上角“添加节点”按钮后，不再绑定其点击事件

        //右下角控件
        $('#btn-expand-all').on('click', onExpandAllClick);
        $('#btn-collapse-all').on('click', onCollapseAllClick);
        $('#btn-toggle-watermark').on('click', onToggleWatermarkClick);
        $('#btn-center-root').on('click', onCenterRootClick);
        $('#btn-zoom-in').on('click', onZoomInClick);
        $('#btn-zoom-percent').on('click', onZoomPercentClick);
        $('#btn-zoom-out').on('click', onZoomOutClick);
        $('#btn-fit-view').on('click', onFitViewClick);
        $('#btn-reset-view').on('click', onResetViewClick);

        //画布拖拽：原生 mousedown/mousemove/mouseup，需要保留原生 e.clientX 等字段
        var canvasViewportElement = $canvasViewport[0];
        canvasViewportElement.addEventListener('mousedown', onCanvasMouseDown);
        win.addEventListener('mousemove', onCanvasMouseMove);
        win.addEventListener('mouseup', onCanvasMouseUp);
        //滚轮缩放：原生 wheel 事件需要 preventDefault 与 e.deltaY
        canvasViewportElement.addEventListener('wheel', onCanvasWheel, { passive: false });

        //节点卡片：事件委托统一处理点击展开按钮、点击节点、hover虚线路径高亮
        $nodeCardsContainer
            .on('click', '.node-expand-btn', onExpandButtonClick)
            // 点击节点卡片不再弹出详情弹窗
            .on('mouseenter', '.node-card-wrap', onNodeCardMouseEnter)
            .on('mouseleave', '.node-card-wrap', onNodeCardMouseLeave);

        //详情弹窗
        $('#btn-close-modal').on('click', onDetailModalClose);
        $('#btn-close-modal-footer').on('click', onDetailModalClose);
        $('#btn-set-root-company').on('click', onSetAsRootClick);
        $detailModalOverlay.on('click', onDetailOverlayClick);

        //添加节点弹窗
        $('#btn-close-add-modal').on('click', onAddModalClose);
        $('#btn-cancel-add').on('click', onAddModalClose);
        $addNodeModalOverlay.on('click', onAddOverlayClick);
        $addNodeForm.on('submit', onAddNodeFormSubmit);
        //关系类型单选：通过事件委托处理 .form-radio-card 的点击
        $('.form-radio-card').on('click', onFormRadioCardClick);

        //全屏变化：监听原生 fullscreenchange 事件
        win.document.addEventListener('fullscreenchange', onFullscreenChange);
    }

    /* =========================================================
     * 4. 接口请求
     * ========================================================= */

    //加载首屏数据：只负责组织入口，不夹杂复杂业务
    function loadInitialData() {
        loadTreeData();
    }

    //请求穿透图谱数据：Mock 分支与正式分支分开，正式分支必须真正发起 ajax
    function loadTreeData() {
        if (win.pageConfig.useMock) {
            //【mock获取数据,后续根据实际业务调用后台获取：穿透图谱数据】开发联调阶段从 equity-penetration.mock.js 读取
            var mockResponseData = getMockTreeData();
            var transformedData = transformTreeData(mockResponseData);
            setTreeData(transformedData);
            return;
        }

        var queryParams = buildTreeQueryParams();
        var requestData = {};
        requestData.params = JSON.stringify(queryParams);

        //正式分支：使用 Util.ajax 发起请求（保留等价调用入口，等待接入后台）
        if (win.Util && win.Util.ajax) {
            win.Util.ajax({
                url: win.pageConfig.getTreeData,
                data: requestData,
                success: function (responseData) {
                    var transformedData = transformTreeData(responseData);
                    setTreeData(transformedData);
                },
                error: function () {
                    renderLoadError();
                }
            });
        } else {
            renderLoadError();
        }
    }

    /* =========================================================
     * 5. 数据处理
     * ========================================================= */

    //单独组装请求参数：方便后续扩展和排查
    function buildTreeQueryParams() {
        var companyId = getCurrentCompanyId();
        return {
            companyId: companyId || ''
        };
    }

    //把后端/Mock 返回的数据映射成页面使用的结构，避免渲染层依赖历史字段
    function transformTreeData(responseData) {
        if (!responseData) {
            return null;
        }
        //Mock 与正式接口都按 { root, upward, downward } 结构返回，直接透传
        return {
            root: responseData.root,
            upward: responseData.upward || [],
            downward: responseData.downward || []
        };
    }

    //构建所有节点列表：用于搜索框补全，遍历整棵树
    function buildAllNodesList() {
        var list = [];
        if (!treeData) {
            return list;
        }

        //根节点入列表
        list.push({
            id: treeData.root.id,
            name: treeData.root.name,
            node: treeData.root
        });

        //递归遍历向上和向下的所有节点
        appendNodesToList(treeData.upward, list);
        appendNodesToList(treeData.downward, list);

        return list;
    }

    //递归把节点和子节点都加入 list
    function appendNodesToList(nodes, list) {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            list.push({ id: node.id, name: node.name, node: node });
            //向下递归子节点
            if (node.children) {
                appendNodesToList(node.children, list);
            }
            //向上递归股东
            if (node.parents) {
                appendNodesToList(node.parents, list);
            }
        }
    }

    //扫描整棵树，收集所有可展开节点的 id
    function buildAllExpandableIds() {
        var ids = {};
        if (!treeData) {
            return ids;
        }
        scanUpwardForExpandable(treeData.upward, ids);
        scanDownwardForExpandable(treeData.downward, ids);
        return ids;
    }

    function scanUpwardForExpandable(nodes, ids) {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.parents && node.parents.length > 0) {
                ids[node.id] = true;
                scanUpwardForExpandable(node.parents, ids);
            }
        }
    }

    function scanDownwardForExpandable(nodes, ids) {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.children && node.children.length > 0) {
                ids[node.id] = true;
                scanDownwardForExpandable(node.children, ids);
            }
        }
    }

    //把节点添加到树中指定位置
    function attachNodeToTree(targetNodeId, direction, completeNode) {
        if (!treeData) {
            return;
        }

        //目标就是根节点：直接挂在 root 的 upward 或 downward 上
        if (targetNodeId === treeData.root.id) {
            if (direction === 'shareholder') {
                treeData.upward.push(completeNode);
            } else {
                treeData.downward.push(completeNode);
            }
            return;
        }

        //递归向上或向下查找目标节点
        attachNodeInNodes(treeData.upward, targetNodeId, direction, completeNode);
        attachNodeInNodes(treeData.downward, targetNodeId, direction, completeNode);
    }

    function attachNodeInNodes(nodes, targetNodeId, direction, completeNode) {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.id === targetNodeId) {
                if (direction === 'shareholder') {
                    if (!node.parents) {
                        node.parents = [];
                    }
                    node.parents.push(completeNode);
                } else {
                    if (!node.children) {
                        node.children = [];
                    }
                    node.children.push(completeNode);
                }
                return;
            }
            //递归
            if (node.parents) {
                attachNodeInNodes(node.parents, targetNodeId, direction, completeNode);
            }
            if (node.children) {
                attachNodeInNodes(node.children, targetNodeId, direction, completeNode);
            }
        }
    }

    //以新节点为根重新构造树
    function buildNewTreeFromRoot(newRootNode) {
        if (!treeData) {
            return null;
        }

        var prevRoot = treeData.root;
        var newRoot = $.extend({}, newRootNode, {
            level: 0,
            type: 'root'
        });

        var newUpward = newRootNode.parents || [];
        var newDownward = newRootNode.children || [
            {
                id: 'sub-derived-' + Date.now(),
                name: prevRoot.name,
                shortName: prevRoot.shortName,
                ratio: newRootNode.ratio || '100%',
                amount: newRootNode.amount,
                level: 1,
                type: 'subsidiary',
                legalPerson: prevRoot.legalPerson,
                registeredCapital: prevRoot.registeredCapital
            }
        ];

        return {
            root: newRoot,
            upward: newUpward,
            downward: newDownward
        };
    }

    //构建添加节点表单的完整数据
    function buildNewNodeFromForm(formData) {
        var completeNode = {
            id: 'node-' + Date.now(),
            name: formData.name || '新建关联企业',
            shortName: formData.shortName || undefined,
            ratio: formData.ratio || '10%',
            amount: formData.amount || '1000.00万元',
            level: formData.direction === 'shareholder' ? -1 : 1,
            type: formData.direction,
            legalPerson: formData.legalPerson || undefined,
            registeredCapital: formData.registeredCapital || undefined,
            status: '存续'
        };
        return completeNode;
    }

    /* =========================================================
     * 6. 渲染方法
     * ========================================================= */

    //设置当前树数据，并触发重新渲染
    function setTreeData(newTreeData) {
        treeData = newTreeData;
        renderPage();
    }

    //统一渲染入口：更新头部企业名、重算布局、重渲节点和连线、居中
    function renderPage() {
        if (!treeData) {
            return;
        }
        renderCurrentCompanyName();
        renderTreeCanvas();
        //首次渲染后延迟居中，等待 DOM 完成
        setTimeout(centerOnRoot, 0);
    }

    //更新头部当前企业名
    function renderCurrentCompanyName() {
        var companyName = '';
        if (treeData && treeData.root) {
            companyName = treeData.root.name;
        }
        $currentCompanyName.text(companyName);
    }

    //渲染整棵树：先算布局，再画连线和节点
    function renderTreeCanvas() {
        if (!treeData) {
            return;
        }

        var layoutResult = computeTreeLayoutForCurrent();
        renderBusGroups(layoutResult.busGroups);
        renderNodeCards(layoutResult.renderNodes);
    }

    //计算当前布局：调用 treeLayout.computeTreeLayout
    function computeTreeLayoutForCurrent() {
        var expandedIds = buildExpandedSet();
        return win.treeLayout.computeTreeLayout(
            treeData.root,
            treeData.upward,
            treeData.downward,
            expandedIds
        );
    }

    //渲染 SVG 连接线和母线
    function renderBusGroups(busGroups) {
        var htmlParts = [];
        //保留 defs（marker）
        htmlParts.push('<defs><marker id="arrow-down-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444"></path></marker></defs>');

        for (var i = 0; i < busGroups.length; i++) {
            htmlParts.push(renderBusGroupSvg(busGroups[i], i));
        }

        $svgTreeConnections.html(htmlParts.join(''));
    }

    //渲染单个 bus group：母线、分支线、比例标签、箭头
    function renderBusGroupSvg(group, groupIndex) {
        var parts = [];
        var isDownward = group.type === 'down';
        var groupKey = 'bus-' + group.type + '-' + group.parentX + '-' + group.parentY;
        var pnid = group.parentNodeId || '';
        var gi = (typeof groupIndex === 'number') ? groupIndex : -1;
        parts.push('<g class="tree-bus-group" data-parent-node-id="' + escapeAttr(pnid) + '" data-bus-type="' + group.type + '" data-group-index="' + gi + '" key="' + groupKey + '">');

        //母线主干
        parts.push('<line class="bus-trunk-line" data-parent-node-id="' + escapeAttr(pnid) + '" x1="' + group.parentX + '" y1="' + group.parentY + '" x2="' + group.parentX + '" y2="' + group.busY + '" stroke="#cbd5e1" stroke-width="1.5"></line>');

        //向上组：在 parentY 处补一个指向根节点的蓝色箭头
        if (!isDownward) {
            parts.push('<polygon class="bus-arrow" data-parent-node-id="' + escapeAttr(pnid) + '" points="' + (group.parentX - 5.5) + ',' + (group.parentY - 8) + ' ' + (group.parentX + 5.5) + ',' + (group.parentY - 8) + ' ' + group.parentX + ',' + group.parentY + '" fill="#0284c7"></polygon>');
        }

        //横向母线
        if (group.branches.length > 0) {
            parts.push('<line class="bus-h-line" data-parent-node-id="' + escapeAttr(pnid) + '" x1="' + group.minBusX + '" y1="' + group.busY + '" x2="' + group.maxBusX + '" y2="' + group.busY + '" stroke="#cbd5e1" stroke-width="1.5"></line>');
        }

        //各分支
        for (var b = 0; b < group.branches.length; b++) {
            var branch = group.branches[b];
            if (isDownward) {
                parts.push(renderDownwardBranch(group, branch));
            } else {
                parts.push(renderUpwardBranch(group, branch));
            }
        }

        parts.push('</g>');
        return parts.join('');
    }

    //渲染向下分支：母线横接点 → 比例标签（靠上） → 箭头 → 子节点顶部接触点
    function renderDownwardBranch(group, branch) {
        var badgeHeight = 28;
        var badgeWidth = (branch.ratio && branch.ratio.length > 4) ? 54 : 46;
        //比例标签紧跟在 bus 横线下方
        var badgeTopY = group.busY + 6;
        var badgeMidY = badgeTopY + badgeHeight / 2;
        //箭头放在比例标签正下方一点，指向子节点顶部
        var arrowTipY = branch.childY;
        var arrowBaseY = arrowTipY - 8;
        var parts = [];
        var pnid = group.parentNodeId || '';
        var cid = branch.childId || '';

        parts.push('<g class="branch-group branch-down-group" data-parent-node-id="' + escapeAttr(pnid) + '" data-child-node-id="' + escapeAttr(cid) + '" key="branch-down-' + cid + '">');
        //竖线1：从母线横线 → 比例标签顶部
        parts.push('<line class="branch-line" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x1="' + branch.childX + '" y1="' + group.busY + '" x2="' + branch.childX + '" y2="' + badgeTopY + '" stroke="#cbd5e1" stroke-width="1.5"></line>');
        //白底蓝边标签（比例框位于bus横线下方紧贴）
        parts.push('<rect class="branch-badge" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x="' + (branch.childX - badgeWidth / 2) + '" y="' + badgeTopY + '" width="' + badgeWidth + '" height="' + badgeHeight + '" rx="4" fill="#ffffff" stroke="#bae6fd" stroke-width="1.5"></rect>');
        //比例文字：蓝色
        if (branch.ratio) {
            parts.push('<text class="branch-ratio-text" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x="' + branch.childX + '" y="' + badgeMidY + '" fill="#0284c7" font-size="11.5" font-weight="600" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">' + escapeXml(branch.ratio) + '</text>');
        }
        //竖线2：从比例标签底部 → 箭头基座上方
        parts.push('<line class="branch-line" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x1="' + branch.childX + '" y1="' + (badgeTopY + badgeHeight) + '" x2="' + branch.childX + '" y2="' + arrowBaseY + '" stroke="#cbd5e1" stroke-width="1.5"></line>');
        //最终箭头：紧贴子节点顶部上方（指向子节点接触点）
        parts.push('<polygon class="branch-arrow-end" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" points="' + (branch.childX - 5.5) + ',' + arrowBaseY + ' ' + (branch.childX + 5.5) + ',' + arrowBaseY + ' ' + branch.childX + ',' + arrowTipY + '" fill="#0284c7"></polygon>');
        parts.push('</g>');

        return parts.join('');
    }

    //渲染向上分支：股东节点底部 → 比例标签（紧贴节点下方） → 箭头 → bus 横线
    function renderUpwardBranch(group, branch) {
        var badgeHeight = 28;
        var badgeWidth = (branch.ratio && branch.ratio.length > 4) ? 54 : 46;
        //比例标签紧贴股东节点底部
        var badgeTopY = branch.childY + 6;
        var badgeMidY = badgeTopY + badgeHeight / 2;
        //比例标签下方的箭头（向下，指向更下方的 bus 横线方向→根节点方向）
        var arrowTipY = badgeTopY + badgeHeight + 10;
        var arrowBaseY = arrowTipY - 8;
        var parts = [];
        var pnid = group.parentNodeId || '';
        var cid = branch.childId || '';

        parts.push('<g class="branch-group branch-up-group" data-parent-node-id="' + escapeAttr(pnid) + '" data-child-node-id="' + escapeAttr(cid) + '" key="branch-up-' + cid + '">');
        //竖线1：股东节点底部 → 比例标签顶部
        parts.push('<line class="branch-line" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x1="' + branch.childX + '" y1="' + branch.childY + '" x2="' + branch.childX + '" y2="' + badgeTopY + '" stroke="#cbd5e1" stroke-width="1.5"></line>');
        //白底蓝边比例标签（紧贴节点底部下方）
        parts.push('<rect class="branch-badge" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x="' + (branch.childX - badgeWidth / 2) + '" y="' + badgeTopY + '" width="' + badgeWidth + '" height="' + badgeHeight + '" rx="4" fill="#ffffff" stroke="#bae6fd" stroke-width="1.5"></rect>');
        //比例文字：蓝色
        if (branch.ratio) {
            parts.push('<text class="branch-ratio-text" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x="' + branch.childX + '" y="' + badgeMidY + '" fill="#0284c7" font-size="11.5" font-weight="600" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">' + escapeXml(branch.ratio) + '</text>');
        }
        //向下箭头（紧跟比例标签下方，指向根节点方向）
        parts.push('<polygon class="branch-arrow-end branch-arrow-downward" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" points="' + (branch.childX - 5.5) + ',' + arrowBaseY + ' ' + (branch.childX + 5.5) + ',' + arrowBaseY + ' ' + branch.childX + ',' + arrowTipY + '" fill="#0284c7"></polygon>');
        //竖线2：从箭头下方 → bus 横线
        parts.push('<line class="branch-line" data-node-ids="' + escapeAttr(pnid) + ',' + escapeAttr(cid) + '" x1="' + branch.childX + '" y1="' + arrowTipY + '" x2="' + branch.childX + '" y2="' + group.busY + '" stroke="#cbd5e1" stroke-width="1.5"></line>');
        parts.push('</g>');

        return parts.join('');
    }

    //渲染所有节点卡片
    function renderNodeCards(renderNodes) {
        var htmlParts = [];
        for (var i = 0; i < renderNodes.length; i++) {
            var renderNode = renderNodes[i];
            var cardHtml = renderNodeCard(renderNode);
            htmlParts.push(cardHtml);
        }
        $nodeCardsContainer.html(htmlParts.join(''));

        //重新渲染后刷新 Lucide 图标
        refreshLucideIcons();
    }

    //渲染单个节点卡片：包含展开按钮和卡片本体
    function renderNodeCard(node) {
        var isRoot = node.type === 'root';
        var displayName = node.name;

        //cardClass 状态拼接：根节点/普通节点
        var cardClass = isRoot ? 'is-root' : 'is-normal';

        //展开按钮：向上节点按钮在顶部，向下节点按钮在底部
        var expandButtonHtml = '';
        if (node.hasExpandable) {
            var positionClass = node.direction === 'up' ? 'is-position-top' : 'is-position-bottom';
            var iconName = node.isExpanded ? 'minus' : 'plus';
            var buttonTitle = node.isExpanded
                ? (node.direction === 'up' ? '收起股东' : '收起对外投资')
                : (node.direction === 'up' ? '展开股东 (' + node.childCount + '家)' : '展开对外投资 (' + node.childCount + '家)');

            expandButtonHtml = renderTemplate('#expand-button-temp', {
                id: node.id,
                positionClass: positionClass,
                title: buttonTitle,
                iconName: iconName
            });
        }

        //节点位置：通过 left/top 定位，便于后续拖拽和缩放
        var left = node.x - node.width / 2;
        var top = node.y - node.height / 2;

        var cardHtml = renderTemplate('#node-card-temp', {
            id: node.id,
            direction: node.direction,
            left: left,
            top: top,
            width: node.width,
            height: node.height,
            expandButtonHtml: expandButtonHtml,
            cardClass: cardClass,
            title: node.name,
            displayName: displayName
        });
        return cardHtml;
    }

    //渲染企业详情弹窗：把 selectedNode 字段映射到弹窗 UI
    function renderCompanyDetailModal() {
        if (!selectedNode) {
            $detailModalOverlay.addClass('hidden');
            return;
        }

        var node = selectedNode;

        //类型标签：根据 type 切换样式
        var typeText = '核心穿透企业';
        var typeClass = 'is-root';
        if (node.type === 'shareholder') {
            typeText = '股东企业';
            typeClass = 'is-shareholder';
        } else if (node.type === 'subsidiary') {
            typeText = '对外投资企业';
            typeClass = 'is-subsidiary';
        }
        $detailModalTypeTag.text(typeText).attr('class', 'detail-modal-type-tag ' + typeClass);

        //状态标签
        $detailModalStatusTag.text(node.status || '存续（在营）');

        //标题与简称
        $detailModalTitle.text(node.name || '');
        if (node.shortName) {
            $detailModalShortName.text('简称：' + node.shortName).removeClass('hidden');
        } else {
            $detailModalShortName.addClass('hidden');
        }

        //持股概览：ratio 或 amount 任一存在则显示
        if (node.ratio || node.amount) {
            $detailModalEquityOverview.removeClass('hidden');
            $detailModalRatio.text(node.ratio || '-');
            if (node.amount) {
                $detailModalAmount.text(node.amount);
                $detailModalAmountWrap.removeClass('hidden');
            } else {
                $detailModalAmountWrap.addClass('hidden');
            }
        } else {
            $detailModalEquityOverview.addClass('hidden');
        }

        //关键信息：保留原 React 的默认值逻辑
        $detailModalLegalPerson.text(node.legalPerson || '李建波');
        $detailModalRegisteredCapital.text(node.registeredCapital || '100000.00万人民币');
        $detailModalCreditCode.text(node.creditCode || '91530000216524184W');
        $detailModalEstablishDate.text(node.establishDate || '1990-03-24');
        $detailModalProvince.text(node.province || '云南省昆明市高新区滇缅大道2411号');

        //关联分支数量
        var parentsCount = (node.parents && node.parents.length) || 0;
        var childrenCount = (node.children && node.children.length) || 0;
        $detailModalParentsCount.text(parentsCount + ' 家');
        $detailModalChildrenCount.text(childrenCount + ' 家');

        $detailModalOverlay.removeClass('hidden');
        refreshLucideIcons();
    }

    //渲染添加节点弹窗：填充目标企业下拉
    function renderAddNodeModal() {
        var allNodesList = buildAllNodesList();
        var htmlParts = [];
        for (var i = 0; i < allNodesList.length; i++) {
            var node = allNodesList[i];
            htmlParts.push('<option value="' + escapeAttr(node.id) + '">' + escapeHtml(node.name) + '</option>');
        }
        $selectTargetCompany.html(htmlParts.join(''));

        //重置单选为 subsidiary
        setFormDirection('subsidiary');

        //重置输入框到默认值
        $inputCompanyName.val('');
        $inputShortName.val('');
        $inputCompanyRatio.val('10%');
        $inputLegalPerson.val('张明');
        $inputAmount.val('1000.00万元');

        $addNodeModalOverlay.removeClass('hidden');
        refreshLucideIcons();
    }

    //渲染失败态：给出业务语义提示，不只写"请求失败"
    function renderLoadError() {
        $nodeCardsContainer.html('<div class="empty-state"><p class="empty-state-title">图谱数据加载失败</p><p class="empty-state-desc">请稍后重试或检查接口连接</p></div>');
    }

    /* =========================================================
     * 7. 工具方法
     * ========================================================= */

    //初始化水印层背景图：保留原 PenetrationCanvas 的 SVG 数据 URI
    function initWatermarkLayer() {
        $('#canvas-watermark-layer').css('background-image', WATERMARK_SVG_DATA_URI);
    }

    //模板渲染：统一入口，{{key}} 替换为对应值
    function renderTemplate(templateSelector, data) {
        var templateHtml = $(templateSelector).html();
        return replaceTemplatePlaceholders(templateHtml, data);
    }

    //模板占位符替换：保留安全场景下的简单字符串替换
    function replaceTemplatePlaceholders(templateHtml, data) {
        var result = templateHtml;
        for (var key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key)) {
                continue;
            }
            var placeholder = '{{' + key + '}}';
            var value = data[key];
            if (value === undefined || value === null) {
                value = '';
            }
            result = result.split(placeholder).join(String(value));
        }
        return result;
    }

    //HTML 转义：用户输入、接口返回文本必须转义后再插入
    function escapeHtml(text) {
        if (text === undefined || text === null) {
            return '';
        }
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    //XML 转义：SVG text 节点专用
    function escapeXml(text) {
        if (text === undefined || text === null) {
            return '';
        }
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    //data-* 属性转义：防止 id 含引号时破坏属性结构，直接复用 escapeHtml
    function escapeAttr(text) {
        return escapeHtml(text);
    }

    //刷新 Lucide 图标：DOM 渲染后统一调用，让 data-lucide 转成 svg
    function refreshLucideIcons() {
        if (win.lucide && win.lucide.createIcons) {
            win.lucide.createIcons();
        }
    }

    //读取当前企业 id：根据 sampleCompanies 匹配当前企业名
    function getCurrentCompanyId() {
        var sampleCompanies = getMockSampleCompanies();
        var currentName = treeData && treeData.root ? treeData.root.name : '';
        for (var i = 0; i < sampleCompanies.length; i++) {
            if (sampleCompanies[i].name === currentName) {
                return sampleCompanies[i].id;
            }
        }
        return '';
    }

    //读取 Mock 数据：通过 win.mockReader 统一访问
    function getMockTreeData() {
        return win.mockReader.getMockInitialTreeData();
    }

    function getMockSampleCompanies() {
        return win.mockReader.getMockSampleCompanies();
    }

    function getMockTreeDataByCompanyId(companyId) {
        return win.mockReader.getMockTreeDataByCompanyId(companyId);
    }

    //把 expandedNodeIds 对象转成 Set 风格结构供 treeLayout 使用
    function buildExpandedSet() {
        var set = {
            _items: {}
        };
        for (var id in expandedNodeIds) {
            if (Object.prototype.hasOwnProperty.call(expandedNodeIds, id)) {
                set._items[id] = true;
            }
        }
        //提供 has 方法，兼容 treeLayout 内部的 .has 调用
        set.has = function (id) {
            return !!set._items[id];
        };
        return set;
    }

    //居中到根节点
    function centerOnRoot() {
        var containerElement = $canvasMain[0];
        var clientWidth = containerElement.clientWidth;
        var clientHeight = containerElement.clientHeight;
        //头部约 90px 高
        var centerY = (clientHeight - 90) / 2 + 90;
        var centerX = clientWidth / 2;

        pan = { x: centerX, y: centerY };
        zoom = 1;
        updateCanvasTransform();
    }

    //适应视图：根据 bounds 自动缩放
    function fitView() {
        var containerElement = $canvasMain[0];
        var clientWidth = containerElement.clientWidth;
        var clientHeight = containerElement.clientHeight;

        var layoutResult = computeTreeLayoutForCurrent();
        var bounds = layoutResult.bounds;
        var contentWidth = bounds.maxX - bounds.minX + 80;
        var contentHeight = bounds.maxY - bounds.minY + 80;

        var scaleX = (clientWidth - 80) / contentWidth;
        var scaleY = (clientHeight - 160) / contentHeight;
        var targetZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.3);

        var midX = (bounds.minX + bounds.maxX) / 2;
        var midY = (bounds.minY + bounds.maxY) / 2;

        zoom = targetZoom;
        pan = {
            x: clientWidth / 2 - midX * targetZoom,
            y: (clientHeight - 90) / 2 + 90 - midY * targetZoom
        };
        updateCanvasTransform();
    }

    //更新画布变换：translate + scale
    function updateCanvasTransform() {
        var transformValue = 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')';
        $canvasWorld.css('transform', transformValue);
        //更新右下角缩放百分比
        $('#btn-zoom-percent').text(Math.round(zoom * 100) + '%');
    }

    //更新水印层显隐
    function updateWatermarkVisibility() {
        var $watermarkLayer = $('#canvas-watermark-layer');
        var $watermarkBtn = $('#btn-toggle-watermark');
        if (showWatermark) {
            $watermarkLayer.removeClass('hidden');
            $watermarkBtn.addClass('is-active');
        } else {
            $watermarkLayer.addClass('hidden');
            $watermarkBtn.removeClass('is-active');
        }
    }

    //更新全屏按钮文案与图标：同上，重建图标元素
    function updateFullscreenButton() {
        var $btn = $('#btn-toggle-fullscreen');
        var $text = $('#fullscreen-btn-text');
        var iconName = isFullscreen ? 'minimize-2' : 'maximize-2';
        var textContent = isFullscreen ? '退出全屏' : '全屏查看';

        $text.text(textContent);
        // 同时移除已转换的 svg 与原始 <i> 标签，避免因执行时序导致双重图标
        $btn.children('svg').remove();
        $btn.children('i.icon-action').remove();
        $btn.prepend('<i data-lucide="' + iconName + '" class="icon-action"></i>');
        refreshLucideIcons();
    }

    //设置关系类型单选卡片激活状态
    function setFormDirection(direction) {
        //先清空所有激活状态
        $('.form-radio-card').removeClass('is-active');
        //激活当前选项
        var $targetCard = $('.form-radio-card[data-direction="' + direction + '"]');
        $targetCard.addClass('is-active');
        //同步 radio 的 checked
        $targetCard.find('.form-radio-input').prop('checked', true);
    }

    //获取当前选中的关系类型
    function getFormDirection() {
        var $checked = $('.form-radio-input:checked');
        if ($checked.length === 0) {
            return 'subsidiary';
        }
        return $checked.val();
    }

    //收集添加节点表单数据
    function collectAddNodeFormData() {
        var formData = {};
        formData.targetId = $selectTargetCompany.val();
        formData.direction = getFormDirection();
        formData.name = $inputCompanyName.val().trim();
        formData.shortName = $inputShortName.val().trim();
        formData.ratio = $inputCompanyRatio.val().trim();
        formData.legalPerson = $inputLegalPerson.val().trim();
        formData.amount = $inputAmount.val().trim();
        return formData;
    }

    //导出图片：复用 exportImage 工具
    function exportImage() {
        if (!treeData) {
            return;
        }
        var layoutResult = computeTreeLayoutForCurrent();
        win.exportImage.exportTreeAsPng(
            treeData.root.name,
            layoutResult.renderNodes,
            layoutResult.busGroups,
            layoutResult.bounds,
            showShortName,
            showWatermark
        );
    }

    /* =========================================================
     * 事件处理函数：统一 onXxxClick 命名，便于查找
     * ========================================================= */

    //全屏切换：原生 requestFullscreen/exitFullscreen，需要保留原生 Promise
    function onToggleFullscreenClick() {
        if (!win.document.fullscreenElement) {
            var fullscreenElement = win.document.documentElement;
            var requestPromise = fullscreenElement.requestFullscreen();
            if (requestPromise && requestPromise.then) {
                requestPromise.then(function () {
                    isFullscreen = true;
                    updateFullscreenButton();
                });
            }
        } else {
            var exitPromise = win.document.exitFullscreen();
            if (exitPromise && exitPromise.then) {
                exitPromise.then(function () {
                    isFullscreen = false;
                    updateFullscreenButton();
                });
            }
        }
    }

    //原生 fullscreenchange 回调：同步按钮状态
    function onFullscreenChange() {
        isFullscreen = !!win.document.fullscreenElement;
        updateFullscreenButton();
    }

    //保存图片：直接调用导出工具
    function onSaveImageClick() {
        exportImage();
    }

    //打开添加节点弹窗
    function onOpenAddNodeClick() {
        renderAddNodeModal();
    }

    //全部展开
    function onExpandAllClick() {
        handleExpandAll();
        renderTreeCanvas();
    }

    function handleExpandAll() {
        var allExpandable = buildAllExpandableIds();
        expandedNodeIds = allExpandable;
    }

    //全部收起
    function onCollapseAllClick() {
        expandedNodeIds = {};
        renderTreeCanvas();
    }

    //切换水印
    function onToggleWatermarkClick() {
        showWatermark = !showWatermark;
        updateWatermarkVisibility();
    }

    //回到中心根节点
    function onCenterRootClick() {
        centerOnRoot();
    }

    //放大
    function onZoomInClick() {
        zoom = Math.min(zoom * 1.15, 2.5);
        updateCanvasTransform();
    }

    //缩小
    function onZoomOutClick() {
        zoom = Math.max(zoom * 0.85, 0.25);
        updateCanvasTransform();
    }

    //点击百分比按钮：重置为 100%
    function onZoomPercentClick() {
        zoom = 1;
        centerOnRoot();
    }

    //适应视图
    function onFitViewClick() {
        fitView();
    }

    //重置位置与缩放
    function onResetViewClick() {
        zoom = 1;
        centerOnRoot();
    }

    //画布鼠标按下：开始拖拽，记录起始位置
    function onCanvasMouseDown(e) {
        //仅左键拖拽背景
        if (e.button !== 0) {
            return;
        }
        isDragging = true;
        dragStart = {
            x: e.clientX - pan.x,
            y: e.clientY - pan.y
        };
        $canvasViewport.addClass('is-grabbing');
    }

    //画布鼠标移动：拖拽中实时更新平移
    function onCanvasMouseMove(e) {
        if (!isDragging) {
            return;
        }
        pan = {
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        };
        updateCanvasTransform();
    }

    //画布鼠标抬起：结束拖拽
    function onCanvasMouseUp() {
        isDragging = false;
        $canvasViewport.removeClass('is-grabbing');
    }

    //画布滚轮缩放：以鼠标位置为锚点
    function onCanvasWheel(e) {
        e.preventDefault();
        var container = $canvasViewport[0];
        var rect = container.getBoundingClientRect();
        var mouseX = e.clientX - rect.left;
        var mouseY = e.clientY - rect.top;

        var zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        var newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 2.5);

        //鼠标位置保持不动
        var newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        var newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        zoom = newZoom;
        pan = { x: newPanX, y: newPanY };
        updateCanvasTransform();
    }

    //点击节点卡片上的展开按钮
    function onExpandButtonClick(e) {
        e.stopPropagation();
        var nodeId = $(this).data('node-id');
        handleToggleExpand(nodeId);
    }

    //切换节点展开/收起
    function handleToggleExpand(nodeId) {
        if (expandedNodeIds[nodeId]) {
            delete expandedNodeIds[nodeId];
        } else {
            expandedNodeIds[nodeId] = true;
        }
        renderTreeCanvas();
    }

    //点击节点卡片：打开详情弹窗
    function onNodeCardClick(e) {
        e.stopPropagation();
        var nodeId = $(this).data('node-id');
        var node = findNodeById(nodeId);
        if (!node) {
            return;
        }
        //复制一份，避免后续修改影响原数据
        selectedNode = $.extend(true, {}, node);
        renderCompanyDetailModal();
    }

    //根据 id 查找原始节点数据
    function findNodeById(nodeId) {
        if (!treeData) {
            return null;
        }
        if (treeData.root.id === nodeId) {
            return treeData.root;
        }
        var found = findNodeInList(treeData.upward, nodeId);
        if (found) {
            return found;
        }
        return findNodeInList(treeData.downward, nodeId);
    }

    function findNodeInList(nodes, nodeId) {
        if (!nodes || nodes.length === 0) {
            return null;
        }
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.id === nodeId) {
                return node;
            }
            if (node.parents) {
                var foundUp = findNodeInList(node.parents, nodeId);
                if (foundUp) {
                    return foundUp;
                }
            }
            if (node.children) {
                var foundDown = findNodeInList(node.children, nodeId);
                if (foundDown) {
                    return foundDown;
                }
            }
        }
        return null;
    }

    //点击详情弹窗遮罩关闭
    function onDetailOverlayClick(e) {
        if (e.target === $detailModalOverlay[0]) {
            onDetailModalClose();
        }
    }

    //关闭详情弹窗
    function onDetailModalClose() {
        $detailModalOverlay.addClass('hidden');
        selectedNode = null;
    }

    //以当前节点为根重新穿透
    function onSetAsRootClick() {
        if (!selectedNode) {
            return;
        }
        var newTreeData = buildNewTreeFromRoot(selectedNode);
        expandedNodeIds = {};
        $detailModalOverlay.addClass('hidden');
        setTreeData(newTreeData);
    }

    //点击添加节点弹窗遮罩关闭
    function onAddOverlayClick(e) {
        if (e.target === $addNodeModalOverlay[0]) {
            onAddModalClose();
        }
    }

    //关闭添加节点弹窗
    function onAddModalClose() {
        $addNodeModalOverlay.addClass('hidden');
    }

    //点击关系类型单选卡片：切换激活状态
    function onFormRadioCardClick() {
        var direction = $(this).data('direction');
        setFormDirection(direction);
    }

    //提交添加节点表单
    function onAddNodeFormSubmit(e) {
        e.preventDefault();
        var formData = collectAddNodeFormData();
        //企业名称必填校验
        if (!formData.name) {
            $inputCompanyName.focus();
            return;
        }

        //构建完整节点对象
        var completeNode = buildNewNodeFromForm(formData);

        //加入树中指定位置
        attachNodeToTree(formData.targetId, formData.direction, completeNode);

        //自动展开目标节点，让新节点立即可见
        expandedNodeIds[formData.targetId] = true;

        //关闭弹窗并重新渲染
        $addNodeModalOverlay.addClass('hidden');
        renderTreeCanvas();
    }

    /* =========================================================
     * 节点 hover 高亮：鼠标悬停时，关联路径显示虚线动画
     * 逻辑：分界点（当前 hover 节点）→ 其上一个节点的路径
     *   1. 节点所在的直接分支（竖线 / 比例 / 箭头）
     *   2. 沿每层父链：为"当前 childX → 父节点 parentX"之间的 bus 横线一段生成临时蓝色虚线；
     *      仅点亮该层 bus-trunk-line（从 busY 到父节点接触点那条竖线），
     *      不点亮整条 bus-h-line（避免兄弟分支也被高亮）。
     * 注意：主节点（root）hover 不产生任何路径动画。
     * ========================================================= */

    //沿父链逐级补齐：childX→parentX 一段横线 + 该层主干竖线
    function highlightAncestorBusLine(startNodeId) {
        if (!startNodeId || !treeData || !treeData.root) {
            return;
        }
        var rootId = treeData.root.id;
        if (startNodeId === rootId) {
            return;
        }
        //取当前布局：build  childId → {parentId, childX, busY, parentX, groupIndex} 映射
        // 【关键】groupIndex 唯一对应一个方向的 bus 组，避免上下方向两个组（同 parentId=root）被错选
        var layoutResult = computeTreeLayoutForCurrent();
        var busGroups = layoutResult.busGroups;
        var edgeInfo = {}; // childId -> { parentId, childX, busY, parentX, groupIndex }
        for (var g = 0; g < busGroups.length; g++) {
            var group = busGroups[g];
            var branches = group.branches;
            for (var b = 0; b < branches.length; b++) {
                edgeInfo[branches[b].childId] = {
                    parentId: group.parentNodeId,
                    childX: branches[b].childX,
                    busY: group.busY,
                    parentX: group.parentX,
                    groupIndex: g
                };
            }
        }

        var svgDom = $svgTreeConnections[0];
        var current = startNodeId;
        var guard = 0;
        while (current && current !== rootId && guard < 50) {
            var info = edgeInfo[current];
            if (!info) {
                break;
            }
            var parentId = info.parentId;

            // 1) 用精确的 data-group-index 找到唯一的 bus group（避免上下方向两个组同 parentId 错选）
            var groupSelector = 'g.tree-bus-group[data-group-index="' + info.groupIndex + '"]';
            var $group = $(groupSelector, $svgTreeConnections);
            if ($group.length > 0) {
                $group.children('line.bus-trunk-line').addClass('is-path-hovered');
                $group.children('polygon.bus-arrow').addClass('is-path-hovered');
            }

            // 2) 动态生成 childX→parentX 这一段水平虚线段（不点亮整条 bus-h-line）
            //    这样其他兄弟分支在横线上的部分不会被高亮
            var segmentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            segmentLine.setAttribute('x1', info.childX);
            segmentLine.setAttribute('y1', info.busY);
            segmentLine.setAttribute('x2', info.parentX);
            segmentLine.setAttribute('y2', info.busY);
            segmentLine.setAttribute('class', 'bus-h-line-partial is-path-hovered-temp is-path-hovered');
            segmentLine.setAttribute('stroke', '#0284c7');
            segmentLine.setAttribute('stroke-width', '2.5');
            segmentLine.setAttribute('stroke-dasharray', '6 5');
            segmentLine.setAttribute('stroke-linecap', 'round');
            segmentLine.setAttribute('data-source-child-id', current);
            segmentLine.setAttribute('data-target-parent-id', parentId);
            // 附加动画：与其他 line.is-path-hovered 一致
            segmentLine.style.animation = 'pathDashFlow 0.6s linear infinite';
            // 放在整个连接 SVG 的最末尾，确保在灰色原线条之上
            svgDom.appendChild(segmentLine);

            //沿父链再向上
            current = parentId;
            guard++;
        }
    }

    //根据节点 id 查找直接关联的 SVG 元素并添加 hover 类
    function highlightDirectPathByNodeId(nodeId) {
        if (!nodeId) {
            return;
        }
        //作为子节点：匹配其所在分支组（线/标签/箭头）
        $('.branch-group[data-child-node-id="' + escapeAttr(nodeId) + '"]', $svgTreeConnections).each(function () {
            $(this).addClass('is-path-hovered');
            $(this).children().addClass('is-path-hovered');
        });
        //节点卡片自身（非 root）
        var $card = $nodeCardsContainer.find('.node-card-wrap[data-node-id="' + escapeAttr(nodeId) + '"] .node-card');
        if ($card.length > 0 && !$card.hasClass('is-root')) {
            $card.addClass('is-hovered');
        }
    }

    //清除所有 hover 高亮（包括临时 childX→parentX 段 line）
    function clearAllPathHighlight() {
        $('.is-path-hovered', $svgTreeConnections).removeClass('is-path-hovered');
        //移除动态添加的 childX→parentX 临时横线段
        $('.is-path-hovered-temp', $svgTreeConnections).remove();
        $nodeCardsContainer.find('.node-card.is-hovered').removeClass('is-hovered');
    }

    //鼠标进入节点卡片：添加关联路径的虚线路径动画
    function onNodeCardMouseEnter() {
        var nodeId = $(this).data('node-id');

        //1. 主节点（root）自身不产生任何路径动画
        var $card = $(this).find('.node-card').first();
        if ($card.length > 0 && $card.hasClass('is-root')) {
            return;
        }

        clearAllPathHighlight();

        //2. 直接关联（节点所在分支的竖线 + 比例 + 箭头）
        highlightDirectPathByNodeId(nodeId);

        //3. 沿父链：为每层补齐 childX→parentX 短横线 + trunk 竖线，延伸到主节点
        highlightAncestorBusLine(nodeId);
    }

    //鼠标离开节点卡片：清除所有路径高亮（含临时段）
    function onNodeCardMouseLeave() {
        clearAllPathHighlight();
    }

    /* =========================================================
     * 启动入口：DOM Ready 后初始化页面
     * ========================================================= */
    $(initPage);
})(window, jQuery);
