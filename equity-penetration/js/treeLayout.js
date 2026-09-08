/* ============================================================
 * 树布局工具 treeLayout.js
 * 作用范围：把 CompanyNode 树结构计算为 RenderNode 列表、
 *           BusGroup 母线分组、整体 bounds 边界
 * 设计原则：保持纯函数，避免依赖外部 DOM；
 *           for 循环 + if 顺序展开，便于后续运维排查
 * ============================================================ */
'use strict';

(function (win) {
    //卡片尺寸常量：与原 treeLayout.ts 保持完全一致，避免渲染错位
    var CARD_WIDTH = 240;
    var CARD_HEIGHT = 64;
    var ROOT_HEIGHT = 50;
    var GAP_X = 36;
    var LEVEL_HEIGHT = 160;

    //计算向下子树宽度：仅展开 expandedIds 中的节点
    function computeDownwardSubtree(node, expandedIds) {
        var isExpanded = expandedIds.has(node.id);
        var children = [];
        if (isExpanded && node.children && node.children.length > 0) {
            for (var i = 0; i < node.children.length; i++) {
                var childSubtree = computeDownwardSubtree(node.children[i], expandedIds);
                children.push(childSubtree);
            }
        }

        if (children.length === 0) {
            return {
                node: node,
                width: CARD_WIDTH + GAP_X,
                children: []
            };
        }

        var childrenWidth = 0;
        for (var c = 0; c < children.length; c++) {
            childrenWidth += children[c].width;
        }
        var width = Math.max(CARD_WIDTH + GAP_X, childrenWidth);

        return {
            node: node,
            width: width,
            children: children
        };
    }

    //计算向上子树宽度：逻辑同向下，但读取的是 parents 字段
    function computeUpwardSubtree(node, expandedIds) {
        var isExpanded = expandedIds.has(node.id);
        var parents = [];
        if (isExpanded && node.parents && node.parents.length > 0) {
            for (var i = 0; i < node.parents.length; i++) {
                var parentSubtree = computeUpwardSubtree(node.parents[i], expandedIds);
                parents.push(parentSubtree);
            }
        }

        if (parents.length === 0) {
            return {
                node: node,
                width: CARD_WIDTH + GAP_X,
                children: []
            };
        }

        var parentsWidth = 0;
        for (var p = 0; p < parents.length; p++) {
            parentsWidth += parents[p].width;
        }
        var width = Math.max(CARD_WIDTH + GAP_X, parentsWidth);

        return {
            node: node,
            width: width,
            children: parents
        };
    }

    //递归分配向下 X 坐标：让父节点位于所有子节点中间
    function assignDownwardX(subtree, leftX) {
        if (subtree.children.length === 0) {
            subtree.x = leftX + subtree.width / 2;
            return;
        }

        var currentLeft = leftX;
        for (var i = 0; i < subtree.children.length; i++) {
            assignDownwardX(subtree.children[i], currentLeft);
            currentLeft += subtree.children[i].width;
        }

        var firstChildX = subtree.children[0].x;
        var lastChildX = subtree.children[subtree.children.length - 1].x;
        subtree.x = (firstChildX + lastChildX) / 2;
    }

    //递归分配向上 X 坐标：逻辑同向下
    function assignUpwardX(subtree, leftX) {
        if (subtree.children.length === 0) {
            subtree.x = leftX + subtree.width / 2;
            return;
        }

        var currentLeft = leftX;
        for (var i = 0; i < subtree.children.length; i++) {
            assignUpwardX(subtree.children[i], currentLeft);
            currentLeft += subtree.children[i].width;
        }

        var firstParentX = subtree.children[0].x;
        var lastParentX = subtree.children[subtree.children.length - 1].x;
        subtree.x = (firstParentX + lastParentX) / 2;
    }

    //构建一个 RenderNode 对象：统一字段映射，避免渲染层直接消费后端历史字段
    function buildRenderNode(node, x, y, direction, isExpanded) {
        var hasExpandable = false;
        var childCount = 0;
        if (direction === 'up') {
            childCount = (node.parents && node.parents.length) || 0;
            hasExpandable = childCount > 0;
        } else if (direction === 'down') {
            childCount = (node.children && node.children.length) || 0;
            hasExpandable = childCount > 0;
        }

        var type = 'subsidiary';
        if (direction === 'root') {
            type = 'root';
        } else if (direction === 'up') {
            type = 'shareholder';
        }

        var height = direction === 'root' ? ROOT_HEIGHT : CARD_HEIGHT;

        return {
            id: node.id,
            name: node.name,
            shortName: node.shortName,
            ratio: node.ratio,
            amount: node.amount,
            level: node.level,
            type: type,
            legalPerson: node.legalPerson,
            registeredCapital: node.registeredCapital,
            creditCode: node.creditCode,
            status: node.status,
            establishDate: node.establishDate,
            province: node.province,
            x: x,
            y: y,
            width: CARD_WIDTH,
            height: height,
            direction: direction,
            hasExpandable: hasExpandable,
            isExpanded: isExpanded,
            childCount: childCount,
            rawNode: node
        };
    }

    //处理向下层级的 bus 母线和节点：每层生成一个 BusGroup
    function processDownwardLevel(subtrees, parentNodeId, parentX, parentY, parentHeight, level, expandedIds, renderNodes, links, busGroups) {
        if (subtrees.length === 0) {
            return;
        }

        var parentContactY = parentY + parentHeight / 2;
        var childContactY = level * LEVEL_HEIGHT - CARD_HEIGHT / 2;
        var busY = parentContactY + 45;

        //计算 bus 母线左右端点：覆盖所有子节点和父节点 X
        var minX = parentX;
        var maxX = parentX;
        for (var i = 0; i < subtrees.length; i++) {
            var subtreeX = subtrees[i].x;
            if (subtreeX < minX) {
                minX = subtreeX;
            }
            if (subtreeX > maxX) {
                maxX = subtreeX;
            }
        }

        var group = {
            id: 'down-bus-' + parentX + '-' + parentY,
            type: 'down',
            parentNodeId: parentNodeId,
            parentX: parentX,
            parentY: parentContactY,
            busY: busY,
            minBusX: minX,
            maxBusX: maxX,
            branches: []
        };

        for (var s = 0; s < subtrees.length; s++) {
            var node = subtrees[s].node;
            var x = subtrees[s].x;
            var y = level * LEVEL_HEIGHT;
            var isExpanded = expandedIds.has(node.id);

            var rNode = buildRenderNode(node, x, y, 'down', isExpanded);
            renderNodes.push(rNode);

            group.branches.push({
                childId: node.id,
                childX: x,
                childY: childContactY,
                ratio: node.ratio
            });

            //links 仅为可访问性参考，渲染层使用 busGroups，不直接消费
            links.push({
                id: 'link-down-' + node.id,
                sourceId: level === 1 ? '' : '',
                targetId: node.id,
                ratio: node.ratio,
                direction: 'down',
                level: level
            });

            if (isExpanded && subtrees[s].children.length > 0) {
                processDownwardLevel(subtrees[s].children, node.id, x, y, CARD_HEIGHT, level + 1, expandedIds, renderNodes, links, busGroups);
            }
        }

        busGroups.push(group);
    }

    //处理向上层级的 bus 母线和节点
    function processUpwardLevel(subtrees, childNodeId, childX, childY, childHeight, level, expandedIds, renderNodes, links, busGroups) {
        if (subtrees.length === 0) {
            return;
        }

        var childContactY = childY - childHeight / 2;
        var parentContactY = level * LEVEL_HEIGHT + CARD_HEIGHT / 2;
        var busY = childContactY - 45;

        var minX = childX;
        var maxX = childX;
        for (var i = 0; i < subtrees.length; i++) {
            var subtreeX = subtrees[i].x;
            if (subtreeX < minX) {
                minX = subtreeX;
            }
            if (subtreeX > maxX) {
                maxX = subtreeX;
            }
        }

        var group = {
            id: 'up-bus-' + childX + '-' + childY,
            type: 'up',
            parentNodeId: childNodeId,
            parentX: childX,
            parentY: childContactY,
            busY: busY,
            minBusX: minX,
            maxBusX: maxX,
            branches: []
        };

        for (var s = 0; s < subtrees.length; s++) {
            var node = subtrees[s].node;
            var x = subtrees[s].x;
            var y = level * LEVEL_HEIGHT;
            var isExpanded = expandedIds.has(node.id);

            var rNode = buildRenderNode(node, x, y, 'up', isExpanded);
            renderNodes.push(rNode);

            group.branches.push({
                childId: node.id,
                childX: x,
                childY: parentContactY,
                ratio: node.ratio
            });

            links.push({
                id: 'link-up-' + node.id,
                sourceId: node.id,
                targetId: '',
                ratio: node.ratio,
                direction: 'up',
                level: level
            });

            if (isExpanded && subtrees[s].children.length > 0) {
                processUpwardLevel(subtrees[s].children, node.id, x, y, CARD_HEIGHT, level - 1, expandedIds, renderNodes, links, busGroups);
            }
        }

        busGroups.push(group);
    }

    //主入口：计算整棵树的渲染数据
    function computeTreeLayout(rootNode, upwardRoots, downwardRoots, expandedIds) {
        var renderNodes = [];
        var links = [];
        var busGroups = [];

        //向下子树宽度计算 + X 分配
        var downwardSubtrees = [];
        var totalDownWidth = 0;
        for (var i = 0; i < downwardRoots.length; i++) {
            var subtree = computeDownwardSubtree(downwardRoots[i], expandedIds);
            downwardSubtrees.push(subtree);
            totalDownWidth += subtree.width;
        }
        var downStartX = -totalDownWidth / 2;
        for (var d = 0; d < downwardSubtrees.length; d++) {
            assignDownwardX(downwardSubtrees[d], downStartX);
            downStartX += downwardSubtrees[d].width;
        }

        //向上子树宽度计算 + X 分配
        var upwardSubtrees = [];
        var totalUpWidth = 0;
        for (var j = 0; j < upwardRoots.length; j++) {
            var upSubtree = computeUpwardSubtree(upwardRoots[j], expandedIds);
            upwardSubtrees.push(upSubtree);
            totalUpWidth += upSubtree.width;
        }
        var upStartX = -totalUpWidth / 2;
        for (var u = 0; u < upwardSubtrees.length; u++) {
            assignUpwardX(upwardSubtrees[u], upStartX);
            upStartX += upwardSubtrees[u].width;
        }

        //根节点：固定在原点
        var rootRenderNode = buildRenderNode(rootNode, 0, 0, 'root', true);
        renderNodes.push(rootRenderNode);

        //向下展开第一层和向上展开第一层
        processDownwardLevel(downwardSubtrees, rootNode.id, 0, 0, ROOT_HEIGHT, 1, expandedIds, renderNodes, links, busGroups);
        processUpwardLevel(upwardSubtrees, rootNode.id, 0, 0, ROOT_HEIGHT, -1, expandedIds, renderNodes, links, busGroups);

        //整体边界：用于画布缩放和图片导出
        var minX = -400;
        var maxX = 400;
        var minY = -300;
        var maxY = 300;

        for (var n = 0; n < renderNodes.length; n++) {
            var node = renderNodes[n];
            var leftBoundary = node.x - node.width / 2 - 60;
            var rightBoundary = node.x + node.width / 2 + 60;
            var topBoundary = node.y - node.height / 2 - 80;
            var bottomBoundary = node.y + node.height / 2 + 80;
            if (leftBoundary < minX) {
                minX = leftBoundary;
            }
            if (rightBoundary > maxX) {
                maxX = rightBoundary;
            }
            if (topBoundary < minY) {
                minY = topBoundary;
            }
            if (bottomBoundary > maxY) {
                maxY = bottomBoundary;
            }
        }

        return {
            renderNodes: renderNodes,
            links: links,
            busGroups: busGroups,
            bounds: { minX: minX, maxX: maxX, minY: minY, maxY: maxY }
        };
    }

    //对外暴露：常量和方法
    win.treeLayout = {
        CARD_WIDTH: CARD_WIDTH,
        CARD_HEIGHT: CARD_HEIGHT,
        ROOT_HEIGHT: ROOT_HEIGHT,
        GAP_X: GAP_X,
        LEVEL_HEIGHT: LEVEL_HEIGHT,
        computeTreeLayout: computeTreeLayout
    };
})(window);
