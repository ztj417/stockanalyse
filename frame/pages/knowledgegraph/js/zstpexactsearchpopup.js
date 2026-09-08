'use strict';

/* global go */

(function () {
    var $ = go.GraphObject.make,
        graphData = window.stockProjectUnitGraphData || { graphs: [] },
        selectedCodes = [],
        graph,
        diagram,
        searchInput = document.getElementById('projectSearchInput'),
        searchResults = document.getElementById('projectSearchResults'),
        searchClear = document.getElementById('projectSearchClear'),
        bidderFilter = document.getElementById('bidderFilter'),
        bidderFilterToggle = document.getElementById('bidderFilterToggle'),
        bidderFilterMenu = document.getElementById('bidderFilterMenu'),
        bidderFilterLabel = document.getElementById('bidderFilterLabel'),
        ruleFilter = document.getElementById('ruleFilter'),
        ruleFilterToggle = document.getElementById('ruleFilterToggle'),
        ruleFilterMenu = document.getElementById('ruleFilterMenu'),
        ruleFilterLabel = document.getElementById('ruleFilterLabel'),
        graphNodeTooltip = document.getElementById('graphNodeTooltip'),
        activeRuleId = 'all',
        activeBidderKey = 'all',
        focusedNode = null,
        tooltipHideTimer = null;

    function isPerson(data) {
        var name = (data.name || data.text || '').replace(/\s/g, '');
        return !/(有限责任公|股份有限公|有限公|公司|集团|企业|银行|中心|事务所|学院|大学|医院|协会|局|厅|院|所|站|厂|店|社|队)$/.test(name);
    }

    function getIcon(data, hovered) {
        var prefix,
            center;
        if (data.type === '疑似联系方式') {
            return './css/images/icon_phone' + (hovered ? '_hover.png' : '_default.png');
        }
        if (data.type === '相同地址') {
            return './css/images/icon_adress' + (hovered ? '_hover.png' : '_default.png');
        }
        prefix = isPerson(data) ? 'personnel' : 'business';
        center = data.base ? 'center' : '';
        if (prefix === 'personnel' && center && hovered) {
            return './css/images/icon_personnelcenter,_hover.png';
        }
        return './css/images/icon_' + prefix + center + (hovered ? '_hover.png' : '_default.png');
    }

    function refreshNodeIcon(node, hovered) {
        var icon = node.findObject('nodeIcon');
        if (icon) icon.source = getIcon(node.data, hovered);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[character];
        });
    }

    function getTooltipIcon(type) {
        if (type === '疑似联系方式') {
            return '<span class="graph-tooltip-icon graph-tooltip-icon-phone">' +
                '<img class="part-1" src="./css/images/modal-phone-part-1.svg" alt="">' +
                '<img class="part-2" src="./css/images/modal-phone-part-2.svg" alt="">' +
                '<img class="part-3" src="./css/images/modal-phone-part-3.svg" alt="">' +
                '</span>';
        }
        if (type === '相同地址') {
            return '<span class="graph-tooltip-icon graph-tooltip-icon-address">' +
                '<img class="part-1" src="./css/images/modal-address-part-1.svg" alt="">' +
                '<img class="part-2" src="./css/images/modal-address-part-2.svg" alt="">' +
                '<img class="part-3" src="./css/images/modal-address-part-3.svg" alt="">' +
                '</span>';
        }
        return '<span class="graph-tooltip-icon graph-tooltip-icon-business">' +
            '<img src="./css/images/modal-business.svg" alt="">' +
            '</span>';
    }

    function getGraphTooltipMarkup(node) {
        var data = node.data || {},
            type = data.type,
            value,
            title,
            subjectType,
            legalRepresentative,
            registeredCapital,
            penetrationRatio;
        if (type === '疑似联系方式' || type === '相同地址') {
            value = data.relationValue || type;
            value = value.replace(new RegExp('^' + type + '\\s*'), '') || type;
            return '<div class="graph-tooltip-compact">' + getTooltipIcon(type) +
                '<span>' + escapeHtml(value) + '</span></div>';
        }
        title = data.name || data.text || '主体';
        subjectType = isPerson(data) ? '核心自然人' : (data.base ? '投标主体' : '关联企业');
        legalRepresentative = data.legalRepresentative || data.legalPerson || data.legalRepresentativeName || '未提供';
        registeredCapital = data.registeredCapital || data.regCapital || '未提供';
        penetrationRatio = data.penetrationRatio || data.associationRatio || '未提供';
        return '<div class="graph-tooltip-title">' + getTooltipIcon('企业') +
            '<span>' + escapeHtml(title) + '</span>' +
            '<span class="graph-tooltip-type">' + subjectType + '</span></div>' +
            '<div class="graph-tooltip-details">' +
            '<div>法定代表人/负责人: <strong>' + escapeHtml(legalRepresentative) + '</strong></div>' +
            '<div>注册资本: <strong>' + escapeHtml(registeredCapital) + '</strong></div>' +
            '<div>已知穿透/关联占比: <strong class="graph-tooltip-highlight">' + escapeHtml(penetrationRatio) + '</strong></div>' +
            '</div><div class="graph-tooltip-risk">识别风险特征:' +
            '<span class="graph-tooltip-risk-tag">' + (data.base ? '投标单位' : '关联企业') + '</span></div>';
    }

    function showGraphTooltip(event, node) {
        var markup,
            point,
            rect,
            left,
            top;
        if (!graphNodeTooltip) return;
        window.clearTimeout(tooltipHideTimer);
        markup = getGraphTooltipMarkup(node);
        if (!markup) return;
        graphNodeTooltip.innerHTML = markup;
        graphNodeTooltip.classList.add('is-visible');
        graphNodeTooltip.setAttribute('aria-hidden', 'false');
        point = event.viewPoint || { x: 0, y: 0 };
        rect = graphNodeTooltip.getBoundingClientRect();
        left = Math.min(point.x + 18, window.innerWidth - rect.width - 12);
        top = Math.min(point.y + 18, window.innerHeight - rect.height - 12);
        graphNodeTooltip.style.left = Math.max(12, left) + 'px';
        graphNodeTooltip.style.top = Math.max(12, top) + 'px';
    }

    function hideGraphTooltip() {
        if (!graphNodeTooltip) return;
        window.clearTimeout(tooltipHideTimer);
        tooltipHideTimer = window.setTimeout(function () {
            graphNodeTooltip.classList.remove('is-visible');
            graphNodeTooltip.setAttribute('aria-hidden', 'true');
        }, 180);
    }

    if (graphNodeTooltip) {
        graphNodeTooltip.addEventListener('mouseenter', function () {
            window.clearTimeout(tooltipHideTimer);
        });
        graphNodeTooltip.addEventListener('mouseleave', hideGraphTooltip);
    }

    function isEquityRelation(link) {
        return /(投资|持股)/.test(link.data.relationType || link.data.text || '');
    }

    function getEquityPercent(link) {
        var matched = (link.data.relationType || link.data.text || '').match(/(?:投资|持股)([\d.]+)%/);
        return matched ? Number(matched[1]) : null;
    }

    function isLowEquityRelation(link) {
        var percent = getEquityPercent(link);
        return isEquityRelation(link) && percent !== null && percent < 5;
    }

    function isPersonNode(node) {
        return !!node && isPerson(node.data || {});
    }

    function matchesActiveRule(link) {
        var relation = link.data.relationType || link.data.text || '',
            percent = getEquityPercent(link),
            hasPerson = isPersonNode(link.fromNode) || isPersonNode(link.toNode),
            hasCompany = !isPersonNode(link.fromNode) || !isPersonNode(link.toNode);
        switch (activeRuleId) {
        case 'direct-control':
        case 'actual-controller':
            return isEquityRelation(link) && percent !== null && percent >= 50;
        case 'indirect-control':
            return isEquityRelation(link) && link.data.segmentIndex > 1;
        case 'equity-participation':
            return isEquityRelation(link) && (percent === null || percent < 50);
        case 'key-personnel':
        case 'management-relation':
            return /(任职|董事|监事|经理|负责人)/.test(relation);
        case 'natural-person-shareholder':
            return isEquityRelation(link) && hasPerson;
        case 'corporate-shareholder':
            return isEquityRelation(link) && hasCompany && !hasPerson;
        case 'legal-representative':
            return /法人/.test(relation);
        case 'actual-beneficiary':
            return /受益/.test(relation);
        case 'annual-report':
            return /年报/.test(relation);
        case 'registered-address':
            return /地址/.test(relation);
        case 'registered-phone':
            return /(电话|联系方式)/.test(relation);
        case 'registered-email':
            return /邮箱/.test(relation);
        default:
            return true;
        }
    }

    function getBidderComponentNodes() {
        var result = new go.Set(go.Node),
            pending = [],
            node;
        if (activeBidderKey === 'all') return null;
        node = diagram.findNodeForKey(activeBidderKey);
        if (!node) return result;
        result.add(node);
        pending.push(node);
        while (pending.length) {
            node = pending.shift();
            node.findLinksConnected().each(function (link) {
                var adjacent = link.fromNode === node ? link.toNode : link.fromNode;
                if (!result.contains(adjacent)) {
                    result.add(adjacent);
                    pending.push(adjacent);
                }
            });
        }
        return result;
    }

    function renderBidderOptions() {
        var bidders = [],
            html = '<button type="button" class="is-selected" data-bidder-key="all" role="menuitem">全部投标单位关联拓扑（全景图）</button>';
        diagram.nodes.each(function (node) {
            if (node.data.base) bidders.push(node.data);
        });
        bidders.forEach(function (bidder) {
            html += '<button type="button" data-bidder-key="' + escapeHtml(bidder.key) + '" role="menuitem">' + escapeHtml(bidder.name || bidder.text) + '</button>';
        });
        bidderFilterMenu.innerHTML = html;
        bidderFilterLabel.textContent = '全部投标单位关联拓扑（全景图）';
        activeBidderKey = 'all';
    }

    function applyGraphFilters() {
        var ruleNodes = new go.Set(go.Node),
            bidderNodes = getBidderComponentNodes(),
            focusNodes = new go.Set(go.Node);
        if (focusedNode) focusNodes.add(focusedNode);
        diagram.links.each(function (link) {
            var ruleMatches = matchesActiveRule(link),
                bidderMatches = !bidderNodes || (bidderNodes.contains(link.fromNode) && bidderNodes.contains(link.toNode)),
                focusMatches = !focusedNode || link.fromNode === focusedNode || link.toNode === focusedNode;
            if (ruleMatches && bidderMatches) {
                ruleNodes.add(link.fromNode);
                ruleNodes.add(link.toNode);
            }
            if (focusedNode && focusMatches) {
                focusNodes.add(link.fromNode);
                focusNodes.add(link.toNode);
            }
            link.visible = ruleMatches && bidderMatches;
            link.opacity = focusMatches ? 1 : 0.1;
        });
        diagram.nodes.each(function (node) {
            var matchesRule = activeRuleId === 'all' || ruleNodes.contains(node),
                matchesBidder = !bidderNodes || bidderNodes.contains(node),
                matchesFocus = !focusedNode || focusNodes.contains(node);
            node.visible = matchesRule && matchesBidder;
            node.opacity = matchesFocus ? 1 : 0.1;
        });
    }

    function resetGraphFocus() {
        focusedNode = null;
        applyGraphFilters();
    }

    function setGraphFocus(node) {
        focusedNode = node || null;
        applyGraphFilters();
    }

    try {
        selectedCodes = JSON.parse(window.sessionStorage.getItem('stbmArr') || '[]');
    } catch (error) {
        selectedCodes = [];
    }

    graph = graphData.graphs.filter(function (item) {
        return item.projectCode === selectedCodes[0];
    })[0] || graphData.graphs[0] || { nodeDataArray: [], linkDataArray: [] };

    diagram = $(go.Diagram, 'myDiagramDiv', {
        initialContentAlignment: go.Spot.Center,
        'toolManager.mouseWheelBehavior': go.ToolManager.WheelZoom,
        allowDelete: false,
        allowCopy: false,
        allowMove: true,
        hasHorizontalScrollbar: false,
        hasVerticalScrollbar: false,
        layout: $(go.LayeredDigraphLayout, {
            direction: 90,  // 自上而下
            layerSpacing: 80,  // 层与层之间的间距
            columnSpacing: 40,  // 同一层节点之间的间距
            layeringOption: go.LayeredDigraphLayout.LayerLongestPathSource,
            aggressiveOption: go.LayeredDigraphLayout.AggressiveLess,
            cycleRemoveOption: go.LayeredDigraphLayout.CycleDepthFirst,
            initializeOption: go.LayeredDigraphLayout.InitDepthFirstOut
        })
    });

    function getNodeStyle(data) {
        if (data.type === '核心自然人' || isPerson(data)) {
            return {
                border: '#a855f7', bg1: '#ffffff', bg2: '#f3e8ff', bg3: '#e9d5ff',
                badgeText: '核心关联自然人', badgeBg: '#f3e8ff', badgeBorder: '#c4b5fd', badgeColor: '#6b21a8'
            };
        }
        if (data.base) {
            if (data.isHighRisk) {
                return {
                    border: '#ef4444', bg1: '#ffffff', bg2: '#fff1f2', bg3: '#fee2e2',
                    badgeText: '参评投标单位', badgeBg: '#fecaca', badgeBorder: '#fca5a5', badgeColor: '#991b1b'
                };
            }
            return {
                border: '#cbd5e1', bg1: '#ffffff', bg2: '#ffffff', bg3: '#ffffff',
                badgeText: '参评投标单位', badgeBg: '#f1f5f9', badgeBorder: '#e2e8f0', badgeColor: '#475569'
            };
        }
        return {
            border: '#fbbf24', bg1: '#ffffff', bg2: '#fffbeb', bg3: '#fef3c7',
            badgeText: '持股平台 / 关联企业', badgeBg: '#fef3c7', badgeBorder: '#fcd34d', badgeColor: '#92400e'
        };
    }

    function getLinkStyle(data) {
        var rtype = data.relationType || data.text || '';
        if (/相同地址/.test(rtype)) {
            return { stroke: '#0891b2', fill: '#0891b2', dash: 'none' };
        }
        if (/疑似联系/.test(rtype)) {
            return { stroke: '#db2777', fill: '#db2777', dash: 'none' };
        }
        if (/分支/.test(rtype)) {
            return { stroke: '#0284c7', fill: '#0284c7', dash: 'none' };
        }
        if (/历史/.test(rtype)) {
            return { stroke: '#f59e0b', fill: '#f59e0b', dash: '6,4' };
        }
        if (/法人/.test(rtype)) {
            return { stroke: '#e11d48', fill: '#e11d48', dash: 'none' };
        }
        if (/任职/.test(rtype)) {
            return { stroke: '#6366f1', fill: '#6366f1', dash: '4,4' };
        }
        return { stroke: '#ef4444', fill: '#ef4444', dash: 'none' };
    }

    diagram.nodeTemplate = $(
        go.Node,
        'Vertical',
        {
            locationSpot: go.Spot.Center,
            cursor: 'pointer',
            selectionAdorned: false,
            mouseEnter: function (event, node) {
                showGraphTooltip(event, node);
            },
            mouseLeave: function (event, node) {
                hideGraphTooltip();
            },
            click: function (event, node) {
                refreshNodeIcon(node, true);
            }
        },
        $(go.Panel, 'Auto',
            $(go.Shape, 'RoundedRectangle',
                {
                    name: 'NODE_BG',
                    fill: '#fff',
                    stroke: '#ccc',
                    strokeWidth: 2,
                    parameter1: 10
                },
                new go.Binding('fill', '', function (data) {
                    var s = getNodeStyle(data);
                    return $(go.Brush, 'Linear', { 0: s.bg1, 0.5: s.bg2, 1: s.bg3 });
                }),
                new go.Binding('stroke', '', function (data) { return getNodeStyle(data).border; })
            ),
            $(go.Panel, 'Vertical',
                { padding: new go.Margin(10, 14, 10, 14), defaultAlignment: go.Spot.Center, minSize: new go.Size(180, NaN) },
                // Top: Badge
                $(go.Panel, 'Auto',
                    $(go.Shape, 'RoundedRectangle',
                        { fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, parameter1: 4 },
                        new go.Binding('fill', '', function (data) { return getNodeStyle(data).badgeBg; }),
                        new go.Binding('stroke', '', function (data) { return getNodeStyle(data).badgeBorder; })
                    ),
                    $(go.TextBlock,
                        { margin: new go.Margin(2, 8, 2, 8), font: 'bold 9px Microsoft YaHei, sans-serif' },
                        new go.Binding('text', '', function (data) { return getNodeStyle(data).badgeText; }),
                        new go.Binding('stroke', '', function (data) { return getNodeStyle(data).badgeColor; })
                    )
                ),
                // Middle: Company Name
                $(
                    go.TextBlock,
                    {
                        margin: new go.Margin(6, 4, 4, 4),
                        stroke: '#1e293b',
                        font: 'bold 13px Microsoft YaHei, sans-serif',
                        maxSize: new go.Size(170, NaN),
                        textAlign: 'center',
                        overflow: go.TextBlock.OverflowEllipsis,
                        maxLines: 2
                    },
                    new go.Binding('text', 'text')
                ),
                // Bottom: Separator + Info (hidden by default, shown if data has extra fields)
                $(go.Panel, 'Auto',
                    { visible: false, margin: new go.Margin(4, 0, 0, 0) },
                    new go.Binding('visible', '', function (data) {
                        return data.legalPerson && data.legalPerson !== '';
                    }),
                    $(go.Shape, 'LineH', { stroke: '#e2e8f0', strokeWidth: 1, stretch: go.GraphObject.Horizontal }),
                    $(go.TextBlock, { visible: false })
                )
            )
        )
    );

    diagram.linkTemplate = $(
        go.Link,
        {
            routing: go.Link.Normal,
            curve: go.Link.None,
            selectable: false
        },
        $(go.Shape, { isPanelMain: true, strokeWidth: 2, strokeDashArray: [] },
            new go.Binding('stroke', '', function (link) { return getLinkStyle(link).stroke; }),
            new go.Binding('strokeDashArray', '', function (link) {
                var dash = getLinkStyle(link).dash;
                return dash === 'none' ? [] : dash.split(',').map(Number);
            })
        ),
        $(go.Shape, { fromArrow: 'Standard', stroke: null, scale: 0.8, visible: false },
            new go.Binding('visible', 'twoway'),
            new go.Binding('fill', '', function (link) { return getLinkStyle(link).fill; })
        ),
        $(go.Shape, { toArrow: 'Standard', stroke: null, scale: 0.8 },
            new go.Binding('fill', '', function (link) { return getLinkStyle(link).fill; })
        ),
        $(
            go.Panel,
            'Auto',
            { segmentFraction: 0.5 },
            $(go.Shape, 'RoundedRectangle', { fill: '#fff', stroke: null }),
            $(
                go.TextBlock,
                    { margin: 3, font: '12px Microsoft YaHei, sans-serif' },
                    new go.Binding('text', 'text'),
                    new go.Binding('stroke', '', function (link) { return getLinkStyle(link).stroke; })
            )
        )
    );

    function showGraph(nextGraph) {
        var model = new go.GraphLinksModel(),
            allLinks,
            retainedLinks,
            retainedNodeKeys = {};
        graph = nextGraph || { nodeDataArray: [], linkDataArray: [] };
        allLinks = graph.linkDataArray || [];
        retainedLinks = allLinks.filter(function (link) {
            var isLowEquity = isLowEquityRelation({ data: link });
            return !isLowEquity;
        });
        retainedLinks.forEach(function (link) {
            retainedNodeKeys[link.from] = true;
            retainedNodeKeys[link.to] = true;
        });
        model.linkKeyProperty = 'relationId';
        model.nodeDataArray = (graph.nodeDataArray || []).filter(function (node) {
            // 低于 5% 的投资/持股关系移除后，以及源数据本身没有关系的单位，均不展示孤立节点。
            if (!retainedNodeKeys[node.key]) return false;
            // 所有在图谱中可见的投标单位都有关联关系，统一标记为高风险
            if (node.base) node.isHighRisk = true;
            return true;
        });
        model.linkDataArray = retainedLinks;
        diagram.model = model;
        // 分层布局根据节点数量调整层间距和列间距
        var layout = diagram.layout,
            nodeCount = model.nodeDataArray.length;
        layout.layerSpacing = Math.max(60, 100 - nodeCount * 0.5);
        layout.columnSpacing = Math.max(30, 50 - nodeCount * 0.3);
        diagram.layoutDiagram(true);
        diagram.commandHandler.zoomToFit();
        renderBidderOptions();
        resetGraphFocus();
    }

    function filteredGraphs(keyword) {
        keyword = (keyword || '').replace(/^\s+|\s+$/g, '');
        return graphData.graphs.filter(function (item) {
            return !keyword || item.projectName.indexOf(keyword) !== -1;
        });
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function closeResults() {
        searchResults.className = 'project-search-results';
        searchInput.setAttribute('aria-expanded', 'false');
    }

    function renderResults(keyword) {
        var items = filteredGraphs(keyword),
            html = '';
        if (items.length) {
            items.forEach(function (item) {
                html += '<li class="project-search-result" role="option" data-project-code="' + escapeHtml(item.projectCode) + '" aria-selected="' + (item.projectCode === graph.projectCode) + '">' + escapeHtml(item.projectName) + '</li>';
            });
        } else {
            html = '<li class="project-search-empty">未找到匹配的项目</li>';
        }
        searchResults.innerHTML = html;
        searchResults.className = 'project-search-results is-open';
        searchInput.setAttribute('aria-expanded', 'true');
    }

    function selectProject(projectCode) {
        var nextGraph = graphData.graphs.filter(function (item) {
            return item.projectCode === projectCode;
        })[0];
        if (!nextGraph) return;
        searchInput.value = nextGraph.projectName;
        window.sessionStorage.setItem('stbmArr', JSON.stringify([nextGraph.projectCode]));
        showGraph(nextGraph);
        closeResults();
    }

    searchInput.value = graph.projectName || '';
    searchInput.addEventListener('focus', function () {
        searchInput.select();
        renderResults('');
    });
    searchInput.addEventListener('input', function () {
        renderResults(searchInput.value);
    });
    searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            var first = searchResults.querySelector('.project-search-result');
            if (first) selectProject(first.getAttribute('data-project-code'));
        } else if (event.key === 'Escape') {
            closeResults();
        }
    });
    searchResults.addEventListener('mousedown', function (event) {
        var item = event.target;
        if (item.className.indexOf('project-search-result') !== -1) {
            selectProject(item.getAttribute('data-project-code'));
        }
    });
    searchClear.addEventListener('click', function () {
        searchInput.value = '';
        searchInput.focus();
        renderResults('');
    });
    ruleFilterToggle.addEventListener('click', function () {
        var isOpen = ruleFilterMenu.className.indexOf('is-open') !== -1;
        ruleFilterMenu.className = isOpen ? 'rule-filter-menu' : 'rule-filter-menu is-open';
        ruleFilterToggle.className = isOpen ? 'rule-filter-toggle' : 'rule-filter-toggle is-open';
        ruleFilterToggle.setAttribute('aria-expanded', String(!isOpen));
    });
    bidderFilterToggle.addEventListener('click', function () {
        var isOpen = bidderFilterMenu.className.indexOf('is-open') !== -1;
        bidderFilterMenu.className = isOpen ? 'toolbar-menu bidder-filter-menu' : 'toolbar-menu bidder-filter-menu is-open';
        bidderFilterToggle.className = isOpen ? 'toolbar-select' : 'toolbar-select is-open';
        bidderFilterToggle.setAttribute('aria-expanded', String(!isOpen));
    });
    bidderFilterMenu.addEventListener('click', function (event) {
        var button = event.target,
            key;
        if (!button || !button.getAttribute('data-bidder-key')) return;
        key = button.getAttribute('data-bidder-key');
        activeBidderKey = key;
        bidderFilterLabel.textContent = button.textContent;
        Array.prototype.forEach.call(bidderFilterMenu.querySelectorAll('button[data-bidder-key]'), function (item) {
            item.className = item.getAttribute('data-bidder-key') === key ? 'is-selected' : '';
        });
        bidderFilterMenu.className = 'toolbar-menu bidder-filter-menu';
        bidderFilterToggle.className = 'toolbar-select';
        bidderFilterToggle.setAttribute('aria-expanded', 'false');
        resetGraphFocus();
    });
    ruleFilterMenu.addEventListener('click', function (event) {
        var button = event.target;
        while (button && button !== ruleFilterMenu && !button.getAttribute('data-rule-id')) {
            button = button.parentNode;
        }
        if (!button || button === ruleFilterMenu) return;
        activeRuleId = button.getAttribute('data-rule-id');
        ruleFilterLabel.textContent = '规则分类：' + button.textContent.replace('✓', '');
        Array.prototype.forEach.call(ruleFilterMenu.querySelectorAll('button[data-rule-id]'), function (item) {
            item.className = (item.getAttribute('data-rule-id') === 'all' ? 'rule-filter-all' : '') +
                (item.getAttribute('data-rule-id') === activeRuleId ? ' is-selected' : '');
        });
        ruleFilterMenu.className = 'rule-filter-menu';
        ruleFilterToggle.className = 'rule-filter-toggle';
        ruleFilterToggle.setAttribute('aria-expanded', 'false');
        applyGraphFilters();
    });
    document.addEventListener('mousedown', function (event) {
        if (!document.getElementById('projectSearch').contains(event.target)) closeResults();
        if (!bidderFilter.contains(event.target)) {
            bidderFilterMenu.className = 'toolbar-menu bidder-filter-menu';
            bidderFilterToggle.className = 'toolbar-select';
            bidderFilterToggle.setAttribute('aria-expanded', 'false');
        }
        if (!ruleFilter.contains(event.target)) {
            ruleFilterMenu.className = 'rule-filter-menu';
            ruleFilterToggle.className = 'rule-filter-toggle';
            ruleFilterToggle.setAttribute('aria-expanded', 'false');
        }
    });

    showGraph(graph);
    diagram.addDiagramListener('ChangedSelection', function (event) {
        event.diagram.nodes.each(function (node) {
            refreshNodeIcon(node, node.isSelected || node.isHighlighted);
        });
        setGraphFocus(event.diagram.selection.first());
    });
    diagram.addDiagramListener('BackgroundSingleClicked', function () {
        diagram.clearSelection();
        resetGraphFocus();
    });
})();
