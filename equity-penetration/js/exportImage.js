/* ============================================================
 * 图片导出工具 exportImage.js
 * 作用范围：把渲染节点 + bus 母线绘制到 canvas，
 *           导出为 PNG 文件
 * 设计原则：绘制效果与页面"当前系统"视觉完全一致：
 *   - 节点卡片：浅蓝渐变背景 + 圆角 + 天蓝边 + 深色字（根节点深蓝）
 *   - 比例徽章：白底 / 浅蓝边 / 蓝比例字 / 蓝向下箭头（非粉红边+红字）
 *   - 所有箭头：蓝色，不再是红色
 *   - 分支布局：比例标签紧贴父节点下方，箭头置于比例框正下方（与页面结构一致）
 * ============================================================ */
'use strict';

(function (win) {
    //把整棵树绘制到 canvas 并触发下载
    function exportTreeAsPng(companyName, renderNodes, busGroups, bounds, showShortName, showWatermark) {
        var canvas = win.document.createElement('canvas');
        var padding = 80;
        var width = bounds.maxX - bounds.minX + padding * 2;
        var height = bounds.maxY - bounds.minY + padding * 2 + 60;

        //2 倍 Retina 分辨率，保证高清
        var scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;

        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.scale(scale, scale);

        //背景
        ctx.fillStyle = '#fafbfc';
        ctx.fillRect(0, 0, width, height);

        //平移坐标系原点，便于直接使用渲染坐标
        var originX = -bounds.minX + padding;
        var originY = -bounds.minY + padding + 60;

        //绘制水印：若开启则铺满整张图
        if (showWatermark) {
            ctx.save();
            ctx.font = '13px sans-serif';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.rotate((-22 * Math.PI) / 180);
            var stepX = 260;
            var stepY = 120;
            for (var x = -width; x < width * 2; x += stepX) {
                for (var y = -height; y < height * 2; y += stepY) {
                    ctx.fillText('寻源询价 | 国泰新点软件股份有限公司 版权智', x, y);
                }
            }
            ctx.restore();
        }

        //绘制标题（与系统中页面左上角风格一致：深色标题+灰色副文字）
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 18px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('股权穿透图 - ' + companyName, padding, 40);

        ctx.fillStyle = '#374151';
        ctx.font = '12px "Noto Sans SC", sans-serif';
        ctx.fillText('生成时间：' + new Date().toLocaleDateString('zh-CN') + ' | 持股流向：箭头指向被投资企业', padding, 58);

        //连接线默认色：灰色
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;

        for (var g = 0; g < busGroups.length; g++) {
            var group = busGroups[g];
            var isDownward = group.type === 'down';

            //母线主干：父节点底部 -> bus 横线
            ctx.beginPath();
            ctx.moveTo(originX + group.parentX, originY + group.parentY);
            ctx.lineTo(originX + group.parentX, originY + group.busY);
            ctx.stroke();

            //向上组：母线终点处再加一个指向根节点的蓝色箭头
            if (!isDownward) {
                ctx.fillStyle = '#0284c7';
                ctx.beginPath();
                ctx.moveTo(originX + group.parentX - 5.5, originY + group.parentY - 8);
                ctx.lineTo(originX + group.parentX + 5.5, originY + group.parentY - 8);
                ctx.lineTo(originX + group.parentX, originY + group.parentY);
                ctx.closePath();
                ctx.fill();
            }

            //横向母线
            if (group.branches.length > 0) {
                ctx.beginPath();
                ctx.moveTo(originX + group.minBusX, originY + group.busY);
                ctx.lineTo(originX + group.maxBusX, originY + group.busY);
                ctx.stroke();
            }

            //每一条分支：竖线 + 比例标签（紧贴父节点） + 箭头
            for (var b = 0; b < group.branches.length; b++) {
                var branch = group.branches[b];

                if (isDownward) {
                    drawDownwardBranch(ctx, originX, originY, group, branch);
                } else {
                    drawUpwardBranch(ctx, originX, originY, group, branch);
                }
            }
        }

        //绘制节点卡片
        for (var n = 0; n < renderNodes.length; n++) {
            drawNodeCard(ctx, originX, originY, renderNodes[n], showShortName);
        }

        //触发下载：通过临时创建的 a 标签，避免污染 DOM
        var link = win.document.createElement('a');
        link.download = '股权穿透图_' + companyName + '_' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    //绘制向下分支：母线横线 → 比例标签（紧贴横线下） → 竖线 → 箭头 → 子节点顶部
    //  与 renderDownwardBranch DOM 结构对齐
    function drawDownwardBranch(ctx, originX, originY, group, branch) {
        var badgeHeight = 28;
        var badgeWidth = (branch.ratio && branch.ratio.length > 4) ? 54 : 46;
        var badgeTopY = group.busY + 6;
        var arrowTipY = branch.childY;
        var arrowBaseY = arrowTipY - 8;

        //竖线1：母线横线 → 比例标签顶部
        ctx.beginPath();
        ctx.moveTo(originX + branch.childX, originY + group.busY);
        ctx.lineTo(originX + branch.childX, originY + badgeTopY);
        ctx.stroke();

        //白底蓝边比例标签（紧贴母线下）
        drawRatioBadge(ctx, originX, originY, branch.childX, badgeTopY, badgeWidth, badgeHeight, branch.ratio);

        //竖线2：比例标签底部 → 箭头基座上方
        ctx.beginPath();
        ctx.moveTo(originX + branch.childX, originY + (badgeTopY + badgeHeight));
        ctx.lineTo(originX + branch.childX, originY + arrowBaseY);
        ctx.stroke();

        //向下蓝色箭头：尖端对齐子节点顶部
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(originX + branch.childX - 5.5, originY + arrowBaseY);
        ctx.lineTo(originX + branch.childX + 5.5, originY + arrowBaseY);
        ctx.lineTo(originX + branch.childX, originY + arrowTipY);
        ctx.closePath();
        ctx.fill();
    }

    //绘制向上分支：子节点底部 → 比例标签（紧贴节点下） → 箭头 → bus 横线
    function drawUpwardBranch(ctx, originX, originY, group, branch) {
        var badgeHeight = 28;
        var badgeWidth = (branch.ratio && branch.ratio.length > 4) ? 54 : 46;
        var badgeTopY = branch.childY + 6;
        var arrowTipY = badgeTopY + badgeHeight + 10;
        var arrowBaseY = arrowTipY - 8;

        //竖线1：子节点底部 → 比例标签顶部
        ctx.beginPath();
        ctx.moveTo(originX + branch.childX, originY + branch.childY);
        ctx.lineTo(originX + branch.childX, originY + badgeTopY);
        ctx.stroke();

        //白底蓝边比例标签（紧贴子节点底部下方）
        drawRatioBadge(ctx, originX, originY, branch.childX, badgeTopY, badgeWidth, badgeHeight, branch.ratio);

        //蓝色向下箭头（紧跟比例标签下方）
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(originX + branch.childX - 5.5, originY + arrowBaseY);
        ctx.lineTo(originX + branch.childX + 5.5, originY + arrowBaseY);
        ctx.lineTo(originX + branch.childX, originY + arrowTipY);
        ctx.closePath();
        ctx.fill();

        //竖线2：箭头下方 → bus 横线
        ctx.beginPath();
        ctx.moveTo(originX + branch.childX, originY + arrowTipY);
        ctx.lineTo(originX + branch.childX, originY + group.busY);
        ctx.stroke();
    }

    //绘制比例标签：白底 浅蓝边 + 蓝色比例文字（非旧的红/粉边）
    function drawRatioBadge(ctx, originX, originY, childX, badgeTopY, badgeWidth, badgeHeight, ratio) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#bae6fd';  // 天蓝浅边（与页面 SVG badge 浅蓝边一致）
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(originX + childX - badgeWidth / 2, originY + badgeTopY, badgeWidth, badgeHeight, 4);
        } else {
            ctx.rect(originX + childX - badgeWidth / 2, originY + badgeTopY, badgeWidth, badgeHeight);
        }
        ctx.fill();
        ctx.stroke();
        // 恢复全局线色
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;

        //蓝色比例文字
        if (ratio) {
            ctx.fillStyle = '#0284c7';
            ctx.font = '600 11.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ratio, originX + childX, originY + badgeTopY + badgeHeight / 2);
        }
    }

    //绘制节点卡片（与"系统中"外观一致）：
    //  - 根节点：#1e3a8a 深蓝背景 + 白字（旧ef4444红已废弃）
    //  - 普通节点：浅蓝渐变 + 圆角16px + 天蓝边 2px + 深蓝字 + 阴影
    function drawNodeCard(ctx, originX, originY, node, showShortName) {
        var isRoot = node.type === 'root';
        var cardX = originX + node.x - node.width / 2;
        var cardY = originY + node.y - node.height / 2;
        var displayName = (showShortName && node.shortName) ? node.shortName : node.name;

        if (isRoot) {
            // 根节点：深蓝色背景 + 白色文字 + 柔和阴影
            ctx.save();
            ctx.shadowColor = 'rgba(30, 58, 138, 0.28)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = '#1e3a8a';
            roundRect(ctx, cardX, cardY, node.width, node.height, 6);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#ffffff';
            ctx.font = '500 13.5px "Noto Sans SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayName, cardX + node.width / 2, cardY + node.height / 2);
        } else {
            // 普通节点：浅蓝纵向渐变背景 + 天蓝边 2px + 16 圆角 + 深蓝字 + 阴影
            ctx.save();
            ctx.shadowColor = 'rgba(2, 132, 199, 0.18)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 2;
            var grad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + node.height);
            grad.addColorStop(0, '#f0f9ff');
            grad.addColorStop(1, '#e0f2fe');
            ctx.fillStyle = grad;
            roundRect(ctx, cardX, cardY, node.width, node.height, 16);
            ctx.fill();
            ctx.restore();

            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 2;
            roundRect(ctx, cardX, cardY, node.width, node.height, 16);
            ctx.stroke();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#cbd5e1';

            ctx.fillStyle = '#0c4a6e';
            ctx.font = '500 13px "Noto Sans SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            //长名称换行：超过 13 字符则对半截断
            if (displayName.length > 13) {
                var mid = Math.ceil(displayName.length / 2);
                var line1 = displayName.slice(0, mid);
                var line2 = displayName.slice(mid);
                ctx.fillText(line1, cardX + node.width / 2, cardY + node.height / 2 - 9);
                ctx.fillText(line2, cardX + node.width / 2, cardY + node.height / 2 + 9);
            } else {
                ctx.fillText(displayName, cardX + node.width / 2, cardY + node.height / 2);
            }
        }

        //绘制展开按钮（+/-）指示：白圈 + 天蓝边 + 蓝字（与系统中外观一致）
        if (node.hasExpandable) {
            var circleY = node.direction === 'up' ? cardY : cardY + node.height;
            var circleX = cardX + node.width / 2;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(circleX, circleY, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;

            ctx.fillStyle = '#0284c7';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.isExpanded ? '-' : '+', circleX, circleY);
        }
    }

    // 工具函数：圆角矩形路径（兼容无 roundRect 的环境）
    function roundRect(ctx, x, y, w, h, r) {
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
            return;
        }
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    //对外暴露
    win.exportImage = {
        exportTreeAsPng: exportTreeAsPng
    };
})(window);
