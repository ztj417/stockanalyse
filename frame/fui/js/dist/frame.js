/* frame.js 2019-10-15 14:05:35 */
/* miniui 框架扩展 */
 ;(function () {
mini.overwrite(mini.CheckBoxList, {
    autoLoad: false,
    setUrl: function (url) {
        this.url = url;
        if(this.autoLoad) {
            this._doLoad({});
        }
        
    }

});
mini.overwrite(mini.RadioButtonList, {
    autoLoad: false,
    setUrl: function (url) {
        this.url = url;
        if(this.autoLoad) {
            this._doLoad({});
        }
        
    }

});
mini.overwrite(mini.ComboBox, {
    _createPopup: function () {
        mini.ComboBox.superclass._createPopup.call(this);

        this._listbox = new mini.ListBox();

        this.listbox = this._listbox;

        this._listbox.delimiter = this.delimiter;
        this._listbox.setBorderStyle("border:0;");
        this._listbox.setStyle("width:100%;height:auto;");
        this._listbox.render(this.popup._contentEl);

        this._listbox.on("beforeitemclick", this.__OnBeforeItemClick, this);
        this._listbox.on("itemclick", this.__OnItemClick, this);
        this._listbox.on("drawcell", this.__OnItemDrawCell, this);

        var me = this;
        // 给listbox绑定commondto数据处理机制，解决在表格编辑列中设置url后自己请求数据的问题
        this._listbox.on("beforeload", function (e) {
            window.DtoUtils && window.DtoUtils.processBeforeLoad(e);
            me.fire("beforeload", e);
        }, this);
        this._listbox.on("preload", function (e) {
            me.fire("preload", e);
        }, this);
        this._listbox.on("load", function (e) {
            me.data = e.data;
            me.fire("load", e);
        }, this);
        this._listbox.on("loaderror", function (e) {
            me.fire("loaderror", e);
        }, this);
    }
});
/**
 * 对DataGrid进行方法扩展
 */
mini.overwrite(mini.DataGrid, {
    holdSelectedStatus: false,
    // 为了使点击某行单元格后不将其他行选中状态清除，将该属性默认设置为true
    // 该问题oa中又希望将其默认值设置为false，所以将该值改为全局配置，在jsboot中进行配置
    allowUnselect: (window.EpFrameSysParams && EpFrameSysParams['grid_allow_unselect']) || false,
    selectMaps: {},

    pageSize: (window.EpFrameSysParams && EpFrameSysParams['ui_grid_pagesize']) || 10,

    setHoldSelectedStatus: function (holdSelectedStatus) {
        this.holdSelectedStatus = holdSelectedStatus;

        if (this.holdSelectedStatus && !this.isInitHold) {
            var me = this;

            this.on('load', function (e) {
                if(this.multiSelect) {
                    for (var id in me.selectMaps) {
                        me.select(me.selectMaps[id]);
                    }
                }
            });

            this.isInitHold = true;
        }
    },
    __OnSelectionChanged: function (e) {
        if (e.fireEvent !== false) {
            if (e.select) {
                this.fire("rowselect", e);
            } else {
                this.fire("rowdeselect", e);
            }
        }
        
        // 保持选中状态时，需要处理selectMaps
        // 移到__OnSelectionChanged的原因是：
        // 在勾选一行记录时表格会触发两次SelectionChanged事件，而SelectionChanged是有setTimeout的，第二次会把第一次的冲掉。
        // 而第二次的事件中e._records为空了。
        // 使用e._records是因为在beforeselect事件中阻止选中后，e.records中任有被阻止掉的记录，而e._records里面是不包含被阻止掉的记录的。
        if (this.holdSelectedStatus) {
            var records = e._records,
                i = 0,
                len = records.length;

            if (e.select) {
                for (; i < len; i++) {
                    this.selectMaps[records[i][this.idField]] = records[i];
                }

            } else {
                for (; i < len; i++) {
                    this.selectMaps[records[i][this.idField]] = undefined;
                    delete this.selectMaps[records[i][this.idField]];
                }
            }
        }

        var me = this;
        if (this._selectionTimer) {
            clearTimeout(this._selectionTimer);
            this._selectionTimer = null;
        }
        this._selectionTimer = setTimeout(function () {
            me._selectionTimer = null;

            if (e.fireEvent !== false) {
                me.fire("SelectionChanged", e);
            }

            me.fire("_selectchange", e);
        }, 1);

        this._doRowSelect(e._records, e.select);

    },
    // 清空选择状态
    clearSelectedStatus: function () {
        if (this.holdSelectedStatus) {
            this.selectMaps = {};
        }
        this.clearSelect();
    },

    getAllSelecteds: function () {
        var rows = [];

        if (this.holdSelectedStatus && this.multiSelect) {
            for (var id in this.selectMaps) {
                rows.push(this.selectMaps[id]);
            }
        } else {
            rows = this.getSelecteds();
        }

        return rows;
    },

    // 用于获取表格选中行的id数组
    getSelectedIds: function () {
        var rows = this.getSelecteds();

        var ids = [];
        for (var i = 0, l = rows.length; i < l; i++) {
            var r = rows[i];
            ids.push(r[this.idField]);
        }

        return ids;
    },

    // 用于通用场景下的删除表格记录
    // ajax发送的数据格式：{ids: 'id1,id2'}
    // url为ajax请求地址
    // callback为回调方法，参数为ajax的返回结果data。如果该方法返回false，则会阻止默认的回调处理
    // params为传入的额外参数
    deleteRows: function (options) {
        if (typeof options == "string") {
            options = {
                url: options
            };
        }
        var url = options.url,
            notSelectedTip = options.notSelectedTip || "请选择一条记录！",
            confirmTip = options.confirmTip || "确定删除选中记录？",
            confirmTitle = options.confirmTitle || "系统提示",
            params = options.params || {},
            callback = options.callback;

        var datagrid = this;
        // 获取选中行id集合
        var ids = this.getSelectedIds();

        if (ids.length > 0) {
            mini.confirm(confirmTip, confirmTitle, function (action) {
                if (action == "ok") {
                    datagrid.loading("操作中，请稍后......");
                    if (Util.getRightUrl) {
                        url = Util.getRightUrl(url);
                    }

                    params.ids = ids.join(',');
                    jQuery.ajax({
                        url: url,
                        type: 'post',
                        dataType: 'json',
                        data: params
                    }).done(function (data) {
                        if (callback && callback.call(datagrid, data) === false) {
                            return;
                        }

                        if (data.success) {
                            mini.alert(data.msg || "删除成功");
                        } else {
                            mini.alert(data.msg || "删除失败");
                        }

                        if (datagrid.url) {
                            datagrid.reload();
                        }

                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        mini.alert(jqXHR.responseText);
                        datagrid.unmask();
                    });
                }
            });
        } else {
            mini.alert(notSelectedTip);
        }
    },

    getExtraAttrs: function(el) {
        var attrs = {};
        mini._ParseBool(el, attrs, ["holdSelectedStatus"]);

        return attrs;
    }
});


// 表格的pageSize是继承于mini.DataTable的，所以必须也要重写mini.DataTable的pageSize
mini.overwrite(mini.DataTable, {
    pageSize: (window.EpFrameSysParams && EpFrameSysParams['ui_grid_pagesize']) || 10
});

/**
 * 修复在IE下表格内编辑器首次点击时，弹出位置不对的问题
 * 后续原因定位为在IE下使用jQuery设置offset时，jq方法内部获取浏览器原生的元素计算后样式的对象中存在问题
 * author: chends
 * date: 2017-08-11
 */
(function () {
    // 非IE无需处理
    if (!mini.isIE) return;

    // 记录原来的方法
    var originalFn = mini.DataGrid.prototype._setEditorBox;

    // 加入是否为首次的标识，并重写设置编辑器容器位置的方法
    mini.overwrite(mini.DataGrid, {
        _isInitEditorWrap: true,
        _setEditorBox: function (editor, cellBox) {
            // 如果是首次加载，则调用两次
            if (this._isInitEditorWrap) {
                originalFn.call(this, editor, cellBox);
                originalFn.call(this, editor, cellBox);

                this._isInitEditorWrap = false;
                // 完成后为不必要的判断，再重新将此方法置换为原来的方法
                // mini.DataGrid.prototype._setEditorBox = originalFn; // 不能这么写，直接修改原型会导致一个页面上存在多个表格时，其他表格首次出现不正常
                this._setEditorBox = originalFn; // 换种处理方式 将原来原型上的方法直接加到这个实例对象上，之后访问时优先使用自己的，从而避免不不要的判断。
            } else {
                originalFn.call(this, editor, cellBox);
            }
        }
    });

})();
mini.overwrite(mini.Tree, {
    set: function (kv) {
        if (typeof kv == 'string') {
            return this;
        }

        // 将autoLoad默认设置为false
        if(kv.autoLoad == undefined){
        	this.setAutoLoad(false);
        }

        // 将resultAsTree默认设置为false
        if(kv.resultAsTree == undefined){
            this.setResultAsTree(false);
        }
        
        mini.Tree.superclass.set.call(this, kv);
        

        return this;
    }
});
mini.overwrite(mini.TreeGrid, {
    dataField: 'data',
    set: function (kv) {
        if (typeof kv == 'string') {
            return this;
        }
        // 将autoLoad默认设置为false
        if(kv.autoLoad === undefined){
        	this.setAutoLoad(false);
        }

        // 将resultAsTree默认设置为false
        if(kv.resultAsTree == undefined){
            this.setResultAsTree(false);
        }
        
        mini.TreeGrid.superclass.set.call(this, kv);

        return this;
    },

    // // treegrid控件是不支持分页的，不能设置showPager属性
    // setShowPager: function() {

    // },

    getAllSelecteds: function() {
        return this.getSelecteds();
    }
});
/**
 * 对DataGrid进行方法扩展
 */
mini.overwrite(mini.PagerTree, {
    holdSelectedStatus: false,

    selectMaps: {},

    setHoldSelectedStatus: function(holdSelectedStatus) {
        this.holdSelectedStatus = holdSelectedStatus;

        if (this.holdSelectedStatus && !this.isInitHold && this.multiSelect) {
            var me = this;
            this.on('selectionchanged', function(e) {
                if (me.holdSelectedStatus) {
                    var records = e.records,
                        i = 0,
                        len = records.length;

                    if (e.select) {
                        for (; i < len; i++) {
                            me.selectMaps[records[i][me.idField]] = records[i];
                        }

                    } else {
                        for (; i < len; i++) {
                            me.selectMaps[records[i][me.idField]] = undefined;
                            delete me.selectMaps[records[i][me.idField]];
                        }
                    }
                }
            });

            this.on('load', function(e) {
                for (var id in me.selectMaps) {
                    me.select(me.selectMaps[id]);
                }
            });

            this.isInitHold = true;
        }
    },

    // 清空选择状态
    clearSelectedStatus: function() {
        if(this.holdSelectedStatus) {
            this.selectMaps = {};
        }
        this.clearSelect();
    },

    getAllSelecteds: function() {
        var rows = [];

        if (this.holdSelectedStatus && this.multiSelect) {
            for (var id in this.selectMaps) {
                rows.push(this.selectMaps[id]);
            }
        } else {
            rows = this.getSelecteds();
        }

        return rows;
    },

    getExtraAttrs: function(el) {
        var attrs = {};
        mini._ParseBool(el, attrs, ["holdSelectedStatus"]);

        return attrs;
    }
});
mini.overwrite(mini.DataExport, {
    mapClass: 'com.epoint.basic.faces.export.DataExport',
    extraId: '',
    exportAction: '',   // 指定后台导出方法
    paramName: 'commonDto',

    setData: function(columns) {
        if (!this.columnsValue) {

            this.columnsData = columns;
            this.isInit = false;
        }
    },

    getExtraId: function() {
        return this.extraId;
    },

    setExtraId: function(extraId) {
        this.extraId = extraId;
    },

    _getColumns: function(columns) {
        var data = [];
        for (var i = 0, len = columns.length; i < len; i++) {
            var column = columns[i];
            if (!column.field) {
                if (column.columns) {
                    var childColumns = this._getColumns(column.columns);
                    data = data.concat(childColumns);
                }
            } else {
                data.push({
                    text: column.header,
                    field: column.field,
                    code: column.code,
                    format: column.format,
                    dataOptions: column['data-options']
                });
            }
        }
        return data;
    },

    _OnExport: function(event) {
        var data = this._getExportData();

        data.exportUrl = this.exportUrl;

        if (this.dataGrid && this.dataGrid.action) {
            data.gridAction = this.dataGrid.action;
            data.gridColumns = this._getColumns(this.dataGrid.columns);
        }

        var e = {
            htmlEvent: event,
            sender: this,
            data: data
        };
        this.fire("beforeexport", e);

        this._exportFormField.value = (typeof e.data == 'string') ? e.data : mini.encode(e.data);

        // 增加对csrf安全拦截的处理
        var csrfcookie = $.cookie(window.CSRF_COOKIE_NAME || '_CSRFCOOKIE');
        if (csrfcookie) {
            if (!this._csrfField) {
                var hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = window.CSRF_HD_NAME || 'CSRFCOOKIE';

                this._exportForm.appendChild(hidden);

                this._csrfField = hidden;
            }
            
            this._csrfField.value = csrfcookie;
        }

        this._exportForm.submit();

        this.hidePanel();
    },

    _getSelectedGridIds: function() {

        var ids = [];
        var rows = [];
        var idField = this.dataGrid.idField;

        if(this.dataGrid) {
            rows = this.dataGrid.getAllSelecteds();
        }

        for (var i = 0, l = rows.length; i < l; i++) {
            var r = rows[i];
            ids.push(r[idField]);
        }

        return ids.join(',');
    },

    getExtraAttrs: function(el) {
        var attrs = {};
        mini._ParseString(el, attrs, ["exportAction"]);

        return attrs;
    }
});

mini.overwrite(mini.Output, {
    set: function (kv) {
        if (typeof kv == 'string') {
            return this;
        }

        // 将autoLoad默认设置为false
        if(kv.autoLoad == undefined){
        	this.setAutoLoad(false);
        }
        
        mini.Output.superclass.set.call(this, kv);
        

        return this;
    }
});
mini.overwrite(mini.FilterTree, {
	mapClass: '',
	autoLoad: false,
	resultAsTree: false
});
mini.overwrite(mini.TreeSelect, {
    loadWhenChecked: false,

    __OnCheckedChanged: function(evt) {
        var node = evt.node;

        var nodesField = this.getNodesField();
        var cs = node[nodesField];
        var me = this;

        if (this.loadWhenChecked || (this.checkRecursive && !evt.isLeaf && !this._getIsLoaded(node))) {

            var data = {
                node: node,
                eventType: 'checkedchanged'

            };

            var e = {
                url: this.url,
                data: data,
                sender: this
            };

            this.fire("beforecheckload", e);
            jQuery.ajax({
                url: e.url,
                data: e.data,
                type: 'post',
                dataType: 'json',
                success: function(data) {
                    data = mini.getSecondRequestData(data);

                    if (data) {

                        var value = me.getValue();

                        me.setValue(data.value);
                        me.setText(data.text);

                        if (value != me.getValue()) {
                            me._OnValueChanged();
                        }
                        me.focus();
                    }
                }
            });
        } else {
            if (node.checked) {
                this._addNode(node);
            } else {
                this._removeNode(node);
            }
            this._OnValueChanged();
            this.focus();
        }
    },

    __OnNodeClick: function(e) {

        if (this.multiSelect) return;

        var node = this.tree.getSelectedNode();
        var vts = this.tree.getValueAndText(node);
        var v = vts[0];

        // v为空，可能是懒加载树，对应节点未加载，不改变值
        if (v) {
            var value = this.getValue();
            this.setValue(v);
            if (value != this.getValue()) {
                this._OnValueChanged();
            }
        }


        if (this._nohide !== true) {
            this.hidePopup();
            this.focus();
        }
        this._nohide = false;
        this.fire("nodeclick", { node: e.node });
    },

    _addNode: function(node) {
        var v = node[this.valueField],
            t = this.tree.getItemText(node),
            value = this.getValue(),
            text = this.getText();

        if (!node.cantChecked) {
            if (!value) {
                this.setValue(v);
                this.setText(t);
            } else if ((',' + value + ',').indexOf(',' + v + ',') < 0) {
                this.setValue(value + ',' + v);
                this.setText(text + ',' + t);
            }
        }


        if (this.checkRecursive) {
            var childs = this.tree.getChildNodes(node);
            for (var i = 0, len = childs.length; i < len; i++) {
                this._addNode(childs[i]);
            }
        }

    },

    _removeNode: function(node) {
        var v = ',' + node[this.valueField] + ',',
            t = ',' + this.tree.getItemText(node) + ',',
            value = ',' + this.getValue() + ',',
            text = ',' + this.getText() + ',';

        if (value.indexOf(v) >= 0) {
            value = value.replace(v, ',');
            value = value.substring(1, (value.length - 1) || 1);

            text = text.replace(t, ',');
            text = text.substring(1, (text.length - 1) || 1);

            this.setValue(value);
            this.setText(text);

        }

        if (this.checkRecursive) {
            var childs = this.tree.getChildNodes(node);
            for (var i = 0, len = childs.length; i < len; i++) {
                this._removeNode(childs[i]);
            }
        }
    },

    _getIsLoaded: function(node) {
        if (this.tree.isLeaf(node)) {
            return true;
        }

        var cs = this.tree.getChildNodes(node),
            isLoaded = true,
            l = cs.length;

        if (l) {
            for (var i = 0; i < l; i++) {
                isLoaded = this._getIsLoaded(cs[i]);

                if (!isLoaded) {
                    return false;
                }
            }
        } else {
            return false;
        }

        return true;
    },
    __OnDrawNode: function(e) {
        var node = e.node;

        if (node.ckr === false) {
            e.showCheckBox = false;
            e.showRadioButton = false;
        }
        this.fire("drawnode", e);
    },

    getExtraAttrs: function(el) {
        var attrs = {};
        mini._ParseBool(el, attrs, ["loadWhenChecked"
        ]);
        return attrs;
    }
});

mini.overwrite(mini.TabsTreeSelect, {
    mapClass: '',
    loadChildWhenChecked: false,
    autoLoad: false,
    resultAsTree: false,
    loadWhenChecked: true,

    __OnCheckedChanged: function (evt) {
        var node = evt.node;

        var nodesField = this.getNodesField();
        var cs = node[nodesField];
        var me = this;

        if (this.loadWhenChecked || (!evt.isLeaf && !this._getIsLoaded(node))) {

            var data = {
                node: node,
                eventType: 'checkedchanged'

            };

            if(this.showSort) {
                data.direction = this._curAutoSortDirection;
            }

            var e = {
                url: this.treeUrl,
                data: data,
                sender: this
            };

            this.fire("beforecheckload", e);

            this._loadValue(e);
            // // ie 性能太差，需要显示loading效果
            // var maskTimer;
            // // 慢也有可能是请求慢，所以不能只处理ie，其他浏览器也需要遮罩
            // // if (mini.isIE) {

            // //     maskTimer = setTimeout(function () {
            // //         me.mask();
            // //         me.isMask = true;
            // //     }, 100);

            // // }

            // maskTimer = setTimeout(function () {
            //     me.mask();
            //     me.isMask = true;
            // }, 100);
            
            // jQuery.ajax({
            //     url: e.url,
            //     data: e.data,
            //     type: 'post',
            //     dataType: 'json',
            //     success: function (data) {
            //         data = mini.getSecondRequestData(data);
            //         if (data) {
            //             var value = me.getValue();
            //             var defaultValue = me.value;
            //             var defaultText = me.text;

            //             var valueArr,
            //                 textArr,
            //                 i = 0,
            //                 len = 0,
            //                 node,
            //                 html = [];

            //             // 优化 by liub @2017-12-14
            //             // 当value值有上千个时，ie浏览器会假死
            //             // 原因是setValue方法中对每一个值都会进行dom的append
            //             // console.time('insertHtml');
            //             // me.setValue(data.value, true);
            //             // me.setText(data.text);
            //             // console.timeEnd('insertHtml');

            //             me._selectList.innerHTML = '';
            //             // me.selectedCount = 0;
            //             me.selectNodes = {};

            //             if (data.value) {
            //                 valueArr = data.value.split(',');
            //                 textArr = data.text.split(',');


            //                 for (len = valueArr.length; i < len; i++) {
            //                     node = {};
            //                     node[me.idField] = valueArr[i];
            //                     node[me.textField] = textArr[i];

            //                     me.selectNodes[valueArr[i]] = node;

            //                     html.push(me._getItemHtml(node));

            //                 }

            //                 // mini.append方法有性能问题
            //                 // mini.append(me._selectList, html.join(''));

            //                 me._selectList.insertAdjacentHTML('afterbegin', html.join(''));

            //                 // me.selectedCount = len;

            //             }


            //             if (maskTimer) {
            //                 clearTimeout(maskTimer);
            //             }
            //             if (me.isMask) {
            //                 me.unmask();
            //                 me.isMask = false;
            //             }
            //             me._updateButtons();
            //             me._setSelectedCount(len);

            //             me.value = defaultValue;
            //             me.text = defaultText;

            //             if (value != me.getValue()) {
            //                 me._OnValueChanged();
            //             }

            //         }
            //     }
            // });
        } else {
            if (node.checked) {
                this._addNode(node);
            } else {
                this._removeNode(node);
            }
        }
    },

    setValue: function(value, notCheckTree) {
        this.value = value;
        var valueArr = value.split(',');

        this.clearAll(notCheckTree);
        if (!value) {
            return;
        }
        for (var i = 0, len = valueArr.length; i < len; i++) {
            var node = this.tree.getNode(valueArr[i]);

            if (node) {
                if (!notCheckTree) {
                    this.tree.checkNode(node);
                }

            } else {
                node = {};
                node[this.textField] = node[this.idField] = valueArr[i];

            }
            this.selectNodes[valueArr[i]] = node;

            mini.append(this._selectList, this._getItemHtml(node));

        }
        // this.selectedCount = len;

        this._updateButtons();
        this._setSelectedCount(len);
    },
    clearAll: function(notCheckTree) {
        // 已选列表中无内容，do nothing
        // if (!this._selectList.innerHTML) return;

        this._selectList.innerHTML = '';
        this.selectNodes = {};

        this.selectedListNode = null;

        if (!notCheckTree) {
            this.tree.uncheckAllNodes();
        }

        // 清空已选计数
        this._setSelectedCount(0);

        // this._updateButtons();
    },

    // __OnLoadNode: function(evt) {
    //     var node = evt.node;

    //     if (node.checked) {
    //         // this._addNode(node);
    //         this.tree._dataSource._doUpdateLoadedCheckedNodes();

    //     }

    // },

    // _setIsLoaded: function(nodes) {
    //     var nodesField = this.getNodesField();
    //     for(var i = 0, l = nodes.length; i < l; i++) {
    //         var cs = nodes[i][nodesField];
    //         if(cs) {
    //             nodes[i].isLoaded = true;

    //             this._setIsLoaded(cs);
    //         }
    //     }
    // },

    _getIsLoaded: function(node) {
        if (this.tree.isLeaf(node)) {
            return true;
        }

        var cs = this.tree.getChildNodes(node),
            isLoaded = true,
            l = cs.length;

        if (l) {
            for (var i = 0; i < l; i++) {
                isLoaded = this._getIsLoaded(cs[i]);

                if (!isLoaded) {
                    return false;
                }
            }
        } else {
            return false;
        }

        return true;
    },

    getExtraAttrs: function(el) {
        var attrs = {};
        mini._ParseBool(el, attrs, ["loadWhenChecked"
        ]);
        return attrs;
    }

});

mini.overwrite(mini.WebUploader, {
    mapClass: 'com.epoint.basic.faces.fileupload.WebUploader',

    // 是否用于数据导入
    dataImport: false,

    showDefaultUI: true,

    needChunkLocal: false,

    // 初始化时服务端返回过来的文件数量
    serverFileNum: 0,
    // 服务端返回文件
    serverFiles: undefined,

    fileSizeLimit: window.EpFrameSysParams && EpFrameSysParams['file_limit_size'],

    limitType: window.EpFrameSysParams && EpFrameSysParams['file_limit_type'],

    fileNameLengthLimit: window.EpFrameSysParams && EpFrameSysParams['file_limit_namelength'] || 225,
    
    fileNameLengthErrorText: '选择的文件名称长度过长！</br>文件名最长为{0}个字符',

    specialCharacterErrorText: '文件名称中不能包含特殊字符！',

    showSecrecyLevel: false,

    defaultSecrecyLevel: (window.EpFrameSysParams && EpFrameSysParams['defaultSecrecyLevel']) === undefined ? undefined : EpFrameSysParams['defaultSecrecyLevel'],

    setAction: function (action) {
        this.action = action;

        this.controlData = {
            id: this.id,
            type: "webuploader",
            mapClass: this.mapClass,
            action: this.action,
            showDefaultUI: this.showDefaultUI,
            dataOptions: this['data-options']
        };

        var arr = action.split('.');
        var url = arr[0] + '.action?cmd=' + arr[1];

        this.setUploadUrl(url);
    },

    setData: function (data) {
        // 重置内部的上传控件，将上传文件队列清空，避免setdata后 一个文件既是服务端返回文件，又在上传控件的文件中
        this._uploader && this._uploader.reset();

        var files = data.files || data;
        var secrecyLevels = data.secrecyLevels;

        this.serverFileNum = files.length;
        this.setFileNumLimit(this.fileNumLimit);

        if(secrecyLevels && secrecyLevels.levels && secrecyLevels.levels.length) {
            this.setShowSecrecyLevel(true);
            this.setSecrecyLevels(secrecyLevels);
            
        }
        
        // 处理服务端返回的文件
        var fileItem, html = [];
        this.serverFiles = {};
        for (var i = 0, len = files.length; i < len; i++) {
            //  加入服务端文件列表
            fileItem = {
                id: files[i].attachGuid,
                name: files[i].attachFileName,
                size: files[i].attachLength,
                date: files[i].uploadDateTime,
                fileGuid: files[i].attachGuid,
                downloadUrl: files[i].downloadUrl,
                hideDelete: files[i].readonly,
                success: true
            };
            this.serverFiles[fileItem.fileGuid] = fileItem;

            // 默认ui下渲染文件列表
            if (this.showDefaultUI) {
                html.push(this._generateFileList(fileItem));
            }
        }

        // 默认ui下加入页面
        if (this.showDefaultUI) {
            jQuery((html.join(''))).appendTo(jQuery(this._fileList).empty());
        }

        this.fire('load', {
            sender: this,
            eventType: "load",
            data: data
        });
    },

    removeFile: function (file, clearServer) {
        // this._uploader.removeFile(file, true);

        // if (this.showDefaultUI) {
        //     var fileId = file.id || file,
        //         $item = jQuery(this._fileList).find('#' + fileId);

        //     if ($item.length) {
        //         $item.remove();
        //     }

        // }

        var fileId = file.id || file,
            fileGuid = file.guid || file.fileGuid,
            self = this;
        // 两值相等，则表示是初始化时后台给的文件，不在上传控件的文件列表中，不需要从文件列表中删除
        if (fileId != fileGuid) {
            this._uploader.removeFile(fileId, true);
        } else {
            this.serverFileNum--;
            this._uploader.option("fileNumLimit", this.fileNumLimit - this.serverFileNum);
            this.serverFiles[fileGuid] = null;
            delete this.serverFiles[fileGuid];
        }

        if (this.showDefaultUI) {
            jQuery(this._fileList).find('#' + fileId).remove();
        }

        // 之前的removeFile方法是不会发请求给后端的，为了兼容之前的代码，新增一个clearServer参数，为true是才去服务端删除
        // 有fileGuid则表示改文件已上传成功了，需要发ajax告诉服务端文件已删除
        if (fileGuid && clearServer) {
            var data = {
                commonDto: mini.encode(this.getCommonData())
            };
            data[this.id + "_action"] = 'delete';
            data[this.id + "_attachGuid"] = fileGuid;
            if (this.dataImport) {
                data[this.id + "_import"] = true;

            }

            // 此处不能用Util.ajax
            // 原因是回调中需要拿到后端返回的控件数据，而Util.ajax是会过滤掉控件数据的
            var xhr = $.ajax({
                url: this.uploadUrl,
                data: data,
                dataType: 'json',
                type: 'post'
            });

            xhr.done(function (data) {
                data = mini.getSecondRequestData(data);
                self.fire('fileremovesuccess', {
                    sender: self,
                    eventType: "fileremovesuccess",
                    fileGuid: fileGuid,
                    data: data
                });
            });
        }
    },

    clearFile: function (clearServer) {
        // if (this._uploader) {
        //     // 用户上传的文件
        //     var files = this._uploader.getFiles();

        //     for (var i = files.length - 1; i >= 0; i--) {
        //         this.removeFile(files[i], clearServer);
        //     }

        //     // 服务端返回的文件
        //     var serverFiles = this.serverFiles;
        //     for (var key in serverFiles) {
        //         if (serverFiles.hasOwnProperty(key)) {
        //             serverFiles[key] && this.removeFile(serverFiles[key], clearServer);
        //         }
        //     }
        // }
        // 上面处理方法还是有问题 无法删除用户刚上传完成的文件，原因getFiles()获取的文件为原生的文件列表，没有包含是否已经上传成功的信息，不知道文件guid，无法删除。
        // 因此只能从ui上去处理

        if (this.showDefaultUI) {
            // 遍历删除
            if (this._uploader) {
                var $fileItems = jQuery(this._fileList).find('.mini-uploader-item');

                if (!$fileItems.length) {
                    return;
                }
                // 从文件列表中遍历进行处理
                for (var i = $fileItems.length - 1; i >= 0; --i) {
                    var $file = $fileItems.eq(i).find('.mini-uploader-remove'),
                        id = $file.attr('fileId'),
                        guid = $file.attr('fileguid');
                    this.removeFile({
                        id: id,
                        guid: guid
                    }, clearServer);
                }
            }
            // 清空dom
            jQuery(this._fileList).empty();
        } else {
            // 清空input 清空控件的服务端文件和服务端文件数目
            // 真正的dom和文件删除操作需要自行完成
            this._uploader && this._uploader.reset();
            this.serverFiles = {};
            this.serverFileNum = 0;

            // serverFileNum改变后需要重新设置下fileNumLimit
            this.setFileNumLimit(this.fileNumLimit);
            console && console.warn && console.warn('非默认UI下使用此方法需要自行完成文件的删除操作');
        }
    },

    setFileNumLimit: function (fileNumLimit) {
        this.fileNumLimit = fileNumLimit;
        if (this._uploader) {
            this._uploader.option("fileNumLimit", fileNumLimit - this.serverFileNum);
        }
    },

    _initEvents: function () {
        if(this.showDefaultUI) {
            this._bindDefaultUIEvents();
        }
    },

    _bindDefaultUIEvents: function () {
        // 已绑定过，直接跳过，避免重复绑定
        if(this._isBindDefaultUIEvent) {
            return;
        }
        var that = this;
        jQuery(this._fileList).on('click', '.mini-uploader-remove', function () {
            var $this = jQuery(this),
                fileId = $this.attr('fileId'),
                $item = $this.closest('.mini-uploader-item'),
                fileGuid = $this.attr('fileGuid');

            // 新增removefile事件
            // 以方便外部在点击删除按钮时做个性化处理，比如做提示，阻止删除等
            if (that._events["fileremove"]) {
                var event = {
                    source: that,
                    sender: that,
                    type: 'fileremove',
                    file: {
                        id: fileId,
                        guid: fileGuid
                    }
                };

                that.fire("fileremove", event);

            } else {
                that.removeFile({
                    id: fileId,
                    guid: fileGuid
                }, true);
            }

            // // 两值相等，则表示是初始化时后台给的文件，不在文件列表中，不需要从文件列表中删除
            // if (fileId != fileGuid) {
            //     that.removeFile(fileId);
            // } else {
            //     jQuery(that._fileList).find('#' + fileId).remove();
            //     that.serverFileNum--;
            //     that._uploader.option("fileNumLimit", that.fileNumLimit - that.serverFileNum);

            // }

            // // 有fileGuid则表示改文件已上传成功了，需要发ajax告诉服务端文件已删除
            // if (fileGuid) {
            //     var data = {
            //         commonDto: mini.encode(that.getCommonData())
            //     };
            //     data[that.id + "_action"] = 'delete';
            //     data[that.id + "_attachGuid"] = fileGuid;
            //     if (that.dataImport) {
            //         data[that.id + "_import"] = true;

            //     }

            //     // 此处不能用Util.ajax
            //     // 原因是回调中需要拿到后端返回的控件数据，而Util.ajax是会过滤掉控件数据的
            //     var xhr = $.ajax({
            //         url: that.uploadUrl,
            //         data: data,
            //         dataType: 'json',
            //         type: 'post'
            //     });

            //     xhr.done(function(data) {
            //         data = mini.getSecondRequestData(data);
            //         that.fire('fileremovesuccess', {
            //             sender: that,
            //             eventType: "fileremovesuccess",
            //             fileGuid: fileGuid,
            //             data: data
            //         });



            //     });
            // }

        }).on('click', '.mini-uploader-retry', function () {
            var fileId = jQuery(this).attr('fileId');

            // 重新上传
            that.retry(fileId);
        });

        if (this.showSecrecyLevel && !this._isBindSecrecyEvent) {
            

        }
        // 记录是否已绑定过，以避免重复绑定
        this._isBindDefaultUIEvent = true;
    },
    _unbindDefaultUIEvents: function () {
        jQuery(this._fileList).off('click', '.mini-uploader-remove')
            .off('click', '.mini-uploader-retry')
            .off('click', '.mini-uploader-secrecy');
        jQuery('body').off('mousedown.secrecyLevelList' + this.uid);

        this._isBindDefaultUIEvent = false;
    },

    _isBindSecrecyEvent: false,
    _bindSecrecyEvents: function(){
         // 已绑定过，直接跳过，避免重复绑定
         if(this._isBindSecrecyEvent) {
            return;
        }
        var that = this;
        jQuery(this._fileList).on('click', '.mini-uploader-secrecy', function () {
            var $this = jQuery(this),
                canEdit = $this.attr('canEdit'),
                $removeItem = $this.siblings('.mini-uploader-remove'),
                fileGuid = $removeItem.attr('fileGuid');
            if(canEdit === 'true') {
                that.showSecrecyLevelList($this, fileGuid);
            }
            
        });

        jQuery('body').on('mousedown.secrecyLevelList' + this.uid, function (e) {
            if (!$(e.target).hasClass('mini-uploader-secrecy') && !$(e.target).closest('.mini-secrecylevel-list').length) {
                that.hideSecrecyLevelList();
            }
        });

        // 页面滚动时，隐藏密级列表，避免其位置不对
        jQuery(document).on('mousewheel', function(){
            that.hideSecrecyLevelList();
        });

        this._isBindSecrecyEvent = true;

    },

    _queuedNum: 0,
    // 当文件被加入队列之前触发，此事件的handler返回值为false，则此文件不会被添加进入队列。
    _beforeFileQueued: function (file) {
        if (this.serverFileNum + this._queuedNum >= this.fileNumLimit) {
            this._uploader.trigger('error', 'Q_EXCEED_NUM_LIMIT', this.fileNumLimit, file);
            return false;
        }
        // 对于后缀为中文的情况webuploader识别不了，会直接放过。
        // 这是webuploder的一个漏洞，只要把后缀改成中文的，就可以绕过limitType的限制
        // 为解决该问题需在文件加入队列前把后缀为中文这种不合法情况阻止掉
        if(/[\u4e00-\u9fa5]/.test(file.ext)) {
            this._uploader.trigger('error', 'Q_TYPE_DENIED', this.limitType, file);
            return false;
        }

        // Liunx系统中文件名称长度限制在100个字符，需要选文件时就把超过的过滤掉
        if(file.name.lastIndexOf('.') >= this.fileNameLengthLimit) {
            mini.alert(String.format(this.fileNameLengthErrorText, this.fileNameLengthLimit));
            return false;
        }

        // var specialReg = /^(?!\.)[^\\\/:\*\?"<>\|\%\;]{1,225}$/;
        // if(specialReg.test(file.name)) {
        //     mini.alert(this.specialCharacterErrorText);
        //     return false;
        // }
        
        if (this._events["beforefilequeued"]) {
            var event = {
                source: this,
                sender: this,
                type: 'beforefilequeued',
                file: file,
                cancel: false
            };

            this.fire("beforefilequeued", event);

            if (event.cancel) {
                return false;
            } else {
                this._queuedNum++;
                return true;
            }
        }
    },

    // 当有文件添加进来的时候
    _onFilesQueued: function (files) {
        var event = {
            source: this,
            sender: this,
            type: 'onfilesqueued',
            files: files,
            errorContent: this._errorContent
        };


        if (this._events["filesqueued"]) {
            this.fire("filesqueued", event);
        } else if (this.showDefaultUI) {
            var item = '',
                html = [];
            // 向文件列表中添加记录
            for (var i = 0, len = files.length; i < len; i++, item = []) {
                item = this._generateFileList({
                    id: files[i].id,
                    name: files[i].name,
                    size: files[i].size,
                    date: mini.formatDate(new Date(), 'yyyy-MM-dd')
                });

                html.push(item);

            }
            jQuery(this._fileList).append(html.join(''));
        }

        // 如果有出错信息，则显示
        if (this._errorContent) {
            mini.alert(this._errorContent);
        }
        this._errorContent = "";

        this._queuedNum = 0;
    },

    _generateFileList: function (options) {
        options.fileGuid = options.fileGuid || '';
        // if (options.downloadUrl) {
        //     options.downloadUrl = _rootPath + '/' + options.downloadUrl;
        // } else {
        //     options.downloadUrl = 'javascript:void(0)';
        // }

        var canDownload = true;

        if (options.downloadUrl) {
            options.downloadUrl = _rootPath + '/' + (
                options.downloadUrl.indexOf('attachGuid') != -1 ?
                // 已经有attachGuid了 就不处理
                options.downloadUrl :
                // 没有attachGuid 根据是否有？ 拼接上 '&' 或 '?' + 'attachGuid=' + options.fileGuid
                (options.downloadUrl + (options.downloadUrl.indexOf('?') != -1 ? '&' : '?') + 'attachGuid=' + options.fileGuid)
            );
        } else {
            options.downloadUrl = 'javascript:void(0);';
            canDownload = false;
        }

        var list = [];
        list.push('<div id="' + options.id + '" class="mini-uploader-item' + (options.success ? ' success' : '') + '">');
        list.push('<a href="' + options.downloadUrl + (canDownload ? '" target="_blank" class="mini-uploader-info">' : '" class="mini-uploader-info">') + options.name + '</a>');
        if(options.size) {
            list.push('<span class="mini-uploader-size">(' + this._getSize(options.size) + (options.date ? '/' + options.date : '') + ')</span>');            
        }

        list.push('<span class="mini-uploader-error"></span>');

        if (this.showSecrecyLevel) {
            // 添加附件密级设置
            var secrecyLevel = options.secrecyLevel === undefined ? this.defaultSecrecyLevel : options.secrecyLevel,
                secrecyLevelText = (function (secrecyLevelItems) {
                    for (var i = 0, l = secrecyLevelItems.length; i < l; i++) {
                        if (secrecyLevelItems[i].id === secrecyLevel) {
                            return secrecyLevelItems[i].text;
                        }
                    }
                    return '';
                })(this.secrecyLevelItems);

            if (!secrecyLevelText) {
                secrecyLevel = this.getHighestSecrecyLevel().id;
                secrecyLevelText = this.getHighestSecrecyLevel().text;

            }
            list.push('<span class="mini-uploader-secrecy" canEdit="' + !options.hideDelete + '" guid="' + secrecyLevel + '">' + secrecyLevelText + '</span>');
        }
        
        list.push('<span class="mini-uploader-progressbar" style="display: none;"><span class="progress-text">0%</span><div class="progress-body"></div></span>');
        if (this.enabled && !options.hideDelete) {
            list.push('<a href="javascript:void(0)" class="mini-uploader-remove" fileId="' + options.id + '" fileGuid="' + options.fileGuid + '">删除</a>');
        }
        list.push('</div>');

        return list.join('');
    },

    // 当文件被移除队列后触发
    _onFileDequeued: function (file) {
        this.fire("filedequeued", {
            file: file
        });
    },
    // 当 uploader 被重置的时候触发
    _onReset: function () {
        this.fire("reset");
    },

    _needPostData: true,
    // 当开始上传流程时触发
    _onStartUpload: function () {
        if (this.postData && this._needPostData) {
            this._uploader.stop();

            var me = this;
            var data = {
                commonDto: mini.encode(this.getCommonData())
            };
            data[this.id + '_incache'] = true;
            data[this.id + '_postData'] = this.postData;
            data[this.id + '_fileCount'] = this._uploader.getFiles().length;
            data[this.id + '_fileLoadedCount'] = this._uploader.getStats().successNum;

            var xhr = Util.ajax({
                url: this.uploadUrl,
                data: data,
                dataType: 'json'
            });

            xhr.done(function (data) {
                me._needPostData = false;
                me._uploader.upload();
            });
        }
        this.fire("startupload");
    },
    // 当上传流程暂停时触发
    _onStopUpload: function () {
        this.fire("stopupload");
    },
    // 当所有文件上传结束时触发
    _onUploadFinished: function () {
        this._needPostData = true;
        this.fire("uploadfinished");
    },
    // 某个文件开始上传前触发
    _onUploadStart: function (file) {
        if (this._events["uploadstart"]) {
            this.fire("uploadstart", {
                file: file
            });
        } else if (this.showDefaultUI) {
            var li = mini.byId(file.id),
                $progressbar = jQuery('.mini-uploader-progressbar', li);

            $progressbar.show();
        }
    },
    // 当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次
    _onUploadBeforeSend: function (object, data, headers) {
        data.commonDto = mini.encode(this.getCommonData());

        if (this.chunked) {
            data[this.id + "_action"] = "chunk";

            var file = object.file;

            data.uploadGuid = file.uuid;
            data.fileMD5 = this._fileMD5[file.id];
            data.chunkSize = this.chunkSize * 1024;
        } else {
            data[this.id + "_action"] = "upload";

            // 非分片并且指定needMD5的，上传参数中需加文件的MD5值
            if (this.needMD5) {
                data.fileMD5 = this._fileMD5[data.id];
                delete this._fileMD5[data.id];
            }

        }
        if (this.dataImport) {
            data[this.id + "_import"] = true;
        }

        data[this.id + '_postData'] = this.postData;
        data[this.id + '_fileCount'] = this._uploader.getFiles().length;
        data[this.id + '_fileLoadedCount'] = this._uploader.getStats().successNum;

        // 带上页面地址中的参数
        var query = window.location.search.substring(1).split('&');
        var param;
        for (var i = 0, len = query.length; i < len; i++) {
            param = query[i].split('=');
            if (param[0]) {
                data[param[0]] = param[1];
            }
        }

        this.fire("uploadbeforesend", {
            sender: this,
            object: object,
            data: data,
            headers: headers
        });
    },
    // 当某个文件上传到服务端响应后，会派送此事件来询问服务端响应是否有效。如果此事件handler返回值为false, 则此文件将派送server类型的uploadError事件。
    _onUploadAccept: function (object, ret) {
        ret = mini.getSecondRequestData(ret);

        // 当返回数据中没有控件信息时，表明服务端出现了错误，则应返回false，告诉控件上传失败
        if (!ret) {
            return false;
        }
        ret = mini.decode(ret.data || ret);
        if (this._events['uploadaccept']) {
            var event = {
                source: this,
                sender: this,
                type: 'uploadaccept',
                object: object,
                ret: ret
            };
            this.fire('uploadaccept', event);

            if (event.cancel) {
                return false;
            } else {
                return true;
            }
        } else {
            if (this.showDefaultUI && !this.chunked) {
                var fileGuid = ret.attachGuid,
                    downloadUrl = ret.downloadUrl;

                if (fileGuid) {
                    jQuery('#' + object.file.id + ' > .mini-uploader-remove').attr('fileGuid', fileGuid);
                    if (downloadUrl) {
                        jQuery('#' + object.file.id + ' > .mini-uploader-info').attr('href', _rootPath + '/' + downloadUrl).attr('target', '_blank');
                    }
                }

            }
            this.fire('filesuccess', {
                source: this,
                sender: this,
                type: 'filesuccess',
                file: object.file,
                data: ret
            });

        }
    },
    // 文件上传过程中触发。
    _onUploadProgress: function (file, percentage) {
        if (this._events["uploadprogress"]) {
            this.fire("uploadprogress", {
                file: file,
                percentage: percentage
            });
        } else if (this.showDefaultUI) {
            var li = mini.byId(file.id),
                $progressbar = jQuery('.mini-uploader-progressbar', li),
                $progresstext = jQuery('.progress-text', $progressbar),
                $progressbody = jQuery('.progress-body', $progressbar),
                width = Math.round(percentage * 100) + '%';

            $progresstext.text(width);
            $progressbody.width(width);
        }
    },
    _onUploadSuccess: function (file, ret) {
        // 秒传功能下只有一次查询附件状态的请求，所以成功事件中不会有后台返回的值，需要兼容
        var data = ret ? mini.getSecondRequestData(ret) : {};


        if (data.uploadFailed) {
            mini.alert(data.failedMsg || '上传失败！请重新上传！');
            this.removeFile(file);

            return;
        }
        if (this._events["uploadsuccess"]) {
            this.fire("uploadsuccess", {
                file: file,
                ret: ret
            });
        } else if (this.showDefaultUI) {
            var $item = jQuery('#' + file.id);
            $item.addClass('success');
            $item.find('.mini-uploader-error').html('').hide();
        }
    },
    _onUploadError: function (file, reason) {
        if (this._events["uploaderror"]) {
            this.fire("uploaderror", {
                file: file,
                reason: reason
            });
        } else if (this.showDefaultUI) {
            jQuery('#' + file.id).find('.mini-uploader-error').html('上传出错!<a href="#" class="mini-uploader-retry" fileId="' + file.id + '">重试</a>').show();
        }
    },
    _onUploadComplete: function (file) {
        if (this._events["uploadcomplete"]) {
            this.fire("uploadcomplete", {
                file: file
            });
        } else if (this.showDefaultUI) {
            jQuery('#' + file.id).find('.mini-uploader-progressbar').fadeOut();
        }
    },

    // 大文件上传时，在向服务端发送文件MD5校验码前触发
    _onBeforeMd5File: function (e) {
        e.data.commonDto = mini.encode(this.getCommonData());

        e.data[this.id + '_action'] = 'queryFileStatus';
        e.data[this.id + '_postData'] = this.postData;

        this.fire("beforemd5file", e);
    },

    // 大文件上传时，服务端校验MD5成功后触发的回调
    _onMd5File: function (response, file) {
        response = mini.getSecondRequestData(response);;
        // '1'表示请求处理成功
        if (response.status == '1') {
            var result = response.result;
            // 已经上传过
            if (result.fileFinished) {
                this._uploader.skipFile(file);
                this._hasFinishedList[file.id] = true;

                // 已上传过的应该直接将附件项设置为上传完成的状态，而不是把附件项删除
                var fileGuid = result.attachGuid,
                    downloadUrl = result.downloadUrl;

                if (fileGuid) {
                    jQuery('#' + file.id + ' > .mini-uploader-remove').attr('fileGuid', fileGuid);
                    if (downloadUrl) {
                        jQuery('#' + file.id + ' > .mini-uploader-info').attr('href', _rootPath + '/' + downloadUrl);
                    }
                }

            } else {
                this._existFileParts = result.existFileParts || '';
                this._existFileParts = ',' + this._existFileParts + ',';
            }
        }
    },
    // 大文件上传时，在文件上传完成时向服务端发送上传完成信息前触发
    _onBeforeMd5FileFinished: function (e) {
        e.data.commonDto = mini.encode(this.getCommonData());

        e.data[this.id + '_action'] = 'finishUpload';
        e.data[this.id + '_postData'] = this.postData;

        this.fire("beforemd5filefinished", e);
    },

    // 大文件上传时，文件上传成功后触发的回调
    _onMd5FileFinished: function (response, file) {
        var data = mini.getSecondRequestData(response);

        if (data.uploadFailed) {
            mini.alert(data.failedMsg || '上传失败！请重新上传！');
            this.removeFile(file);

            return;
        }
        
        data = data.result || data;

        if (this.showDefaultUI) {
            var fileGuid = data.attachGuid,
                downloadUrl = data.downloadUrl;

            if (fileGuid) {
                jQuery('#' + file.id + ' > .mini-uploader-remove').attr('fileGuid', fileGuid);
                if (downloadUrl) {
                    jQuery('#' + file.id + ' > .mini-uploader-info').attr('href', _rootPath + '/' + downloadUrl);
                }
            }
        }
        this.fire('finishedmd5file', {
            source: this,
            sender: this,
            type: 'finishedmd5file',
            file: file,
            data: data
        });

    },

    _getSize: function (size) {
        var K = 1024,
            M = 1048576;
        size = parseInt(size) || 0;

        if (size > M) {
            return (size / M).toFixed(2) + "M";
        } else {
            return (size / K).toFixed(2) + "K";
        }
    },

    getCommonData: function () {
        if (!this.controlData) {
            this.controlData = {
                id: this.id,
                type: "webuploader",
                mapClass: this.mapClass,
                action: this.action,
                showDefaultUI: this.showDefaultUI,
                needChunkLocal: this.needChunkLocal,
                dataOptions: this['data-options']
            };
        }
        return [this.controlData, this.getViewdata()];
    },

    getViewdata: function () {
        var hidden = mini.get('_common_hidden_viewdata');

        if (!this.viewData) {
            this.viewData = {
                id: '_common_hidden_viewdata',
                type: 'hidden',
                value: ''
            };
        }

        if (hidden) {
            this.viewData.value = hidden.getValue();
        }

        return this.viewData;
    },

    setShowDefaultUI: function (showDefaultUI) {
        this.showDefaultUI = showDefaultUI;
        if (this.controlData) {
            this.controlData.showDefaultUI = showDefaultUI;
        }
    },

    setPostData: function (postData) {
        this.postData = postData;

    },
    
    secrecyLevelItems: [],
    _generateSecrecyLevelList: function () {
        var html = ['<ul class="mini-secrecylevel-list">'],
            item;

        for (var i = 0, l = this.secrecyLevelItems.length; i < l; i++) {
            item = this.secrecyLevelItems[i];
            html.push('<li guid="' + item.id + '">' + item.text + '</li>');
        }

        html.push('</ul>');

        this._$secrecyLevelList = jQuery(html.join('')).appendTo('body');

        var self = this;
        this._$secrecyLevelList.on('click', 'li', function () {
            var $this = $(this),
                guid = $this.attr('guid'),
                text = $this.text(),
                attachGuid = self._$secrecyLevelList.attr('guid');
            self._onSecrecyLevelChange(guid, text, attachGuid);
        });
    },

    showSecrecyLevelList: function ($target, fileGuid) {
        if (!this.showSecrecyLevel) {
            return;
        }
        if (!this._$secrecyLevelList) {
            this._generateSecrecyLevelList();
        }

        this._$currentSecrecyLevel = $target;

        var box = mini.getBox($target[0]);

        this._$secrecyLevelList.css({
            top: box.top + box.height,
            left: box.left - 20,
            display: 'block'
        }).attr('guid', fileGuid);
    },

    hideSecrecyLevelList: function () {
        this._$secrecyLevelList && this._$secrecyLevelList.hide();
    },

    _onSecrecyLevelChange: function (guid, text, attachGuid) {
        var self = this;
        var data = {
            commonDto: mini.encode(this.getCommonData())
        };
        data[this.id + "_action"] = 'updateSecrecyLevel';
        data[this.id + "_attachGuid"] = attachGuid;

        data[this.id + "_secrecyLevel"] = guid;
        // 此处不能用Util.ajax
        // 原因是回调中需要拿到后端返回的控件数据，而Util.ajax是会过滤掉控件数据的
        var xhr = $.ajax({
            url: this.uploadUrl,
            data: data,
            dataType: 'json',
            type: 'post'
        });

        xhr.done(function (data) {
            data = mini.getSecondRequestData(data);
            if (data.success) {
                self._$currentSecrecyLevel.text(text).attr('guid', guid);

                self.fire('secrecylevelchanged', {
                    sender: self,
                    eventType: "secrecylevelchanged",
                    fileGuid: attachGuid,
                    data: data
                });
            } else {
                var msg = data.msg || '保密等级保存失败！请重试';
                mini.showTips({
                    content: msg,
                    state: 'warning',
                    y: 'center'
                });
            }
        }).always(function () {
            self.hideSecrecyLevelList();
        });
    },

    setSecrecyLevels: function (data) {
        this.secrecyLevelItems = data.levels;

        if (this.defaultSecrecyLevel === undefined) {
            this.defaultSecrecyLevel = data['default'];
        }

        // 清空之前生成的下拉列表，防止data更新后，对应下拉列表没有更新
        if (this._$secrecyLevelList) {
            this._$secrecyLevelList.remove();
            this._$secrecyLevelList = undefined;
        }

        // 将之前计算出来的最高密级重置
        this._highestSecrecyLevel = undefined;

    },

    setShowSecrecyLevel: function(show) {
        this.showSecrecyLevel = show;

        if(show && !this._isBindSecrecyEvent) {
            this._bindSecrecyEvents();
        }
    },

    getHighestSecrecyLevel: function () {
        if (this._highestSecrecyLevel) {
            return this._highestSecrecyLevel;
        }

        if (!this.secrecyLevelItems || !this.secrecyLevelItems.length) {
            return {};
        }

        var item = this.secrecyLevelItems[0],
            i = 1,
            l = this.secrecyLevelItems.length;
        for (; i < l; i++) {
            if (this.secrecyLevelItems[i].id > item.id) {
                item = this.secrecyLevelItems[i];
            }
        }

        this._highestSecrecyLevel = item;

        return item;
    },

    getExtraAttrs: function (el) {
        var attrs = {};
        mini._ParseString(el, attrs, ["onfinishedmd5file", "onfilesuccess", "onfileremovesuccess", "postData", "onload", "onfileremove", "onsecrecylevelchanged"]);
        mini._ParseBool(el, attrs, ["dataImport", "showDefaultUI", "needChunkLocal"]);
        mini._ParseInt(el, attrs, ["fileNameLengthLimit"]);
        return attrs;
    }
});
mini.overwrite(mini.LargeFileUploader, {
    mapClass: 'com.epoint.basic.faces.fileupload.NTKOUploader',
    
    showDefaultUI: true,

    // 初始化时服务端返回过来的文件数量
    serverFileNum: 0,

    fileSizeLimit: window.EpFrameSysParams && EpFrameSysParams['file_limit_size'],

    limitType: window.EpFrameSysParams && EpFrameSysParams['file_limit_type'],

    needChunkLocal: false,

    setAction: function(action) {
        this.action = action;

        this.controlData = {
            id: this.id,
            type: "largeFileUploader",
            mapClass: this.mapClass,
            action: this.action,
            showDefaultUI: this.showDefaultUI,
            dataOptions: this['data-options']
        };

        var arr = action.split('.');
        var url = arr[0] + '.action?cmd=' + arr[1];

        this.setUploadUrl(url);
    },

    setData: function(data) {
        // 兼容添加密级功能后的数据格式
        data = data.files || data;
        this.serverFileNum = data.length;

        if (this.showDefaultUI) {
            var item = '',
                html = [];
            // 向文件列表中添加记录
            for (var i = 0, len = data.length; i < len; i++, item = []) {
                item = this._generateFileList({
                    id: data[i].attachGuid,
                    name: data[i].attachFileName,
                    size: data[i].attachLength,
                    date: data[i].uploadDateTime,
                    fileGuid: data[i].attachGuid,
                    downloadUrl: data[i].downloadUrl,
                    hideDelete: data[i].readonly,
                    success: true
                });

                html.push(item);

            }
            jQuery(this._fileList).html(html.join(''));

        }
        
        this.fire('load', {
            sender: this,
            eventType: "load",
            data: data
        });
    },

    removeFile: function(fileId) {
        var ntko = this._ntko,
            index = this._getFileIndex(fileId),
            file;

        if (index > -1) {
            file = ntko.GetFile(index);
            ntko.RemoveFile(index);

            this._fileIds[file.FilePath] = undefined;
            delete this._fileIds[file.FilePath];
            this._onFileDequeued(file);
        }

        if (this.showDefaultUI) {
            var $item = jQuery(this._fileList).find('#' + fileId);

            if ($item.length) {
                $item.remove();
            }

        }


    },

    clearFile: function() {

        for (var i in this._fileIds) {
            this.removeFile(this._fileIds[i].id);
        }
        if (this.showDefaultUI) {
            jQuery(this._fileList).empty();

        }

    },

    _initEvents: function() {
        mini._BindEvents(function() {
            mini_onOne(this._picker, "click", this.__OnPickerClick, this);
        }, this);

        var that = this,
            ntko = this._ntko;

        // 绑定上传按钮的点击事件
        this._uploadBtn.on('click', function() {
            if (ntko.IsUploading) {
                that.stopUpload();
                that._uploadBtn.setText(that.pauseText);
            } else {
                that.beginUpload();
                that._uploadBtn.setText(that.startText);
            }
        });

        if (this.auto) {
            this._uploadBtn.hide();
        }

        //
        if (ntko.attachEvent) {
            ntko.attachEvent('BeforeFileAdded', function(filePath, fileName, fileSize) {
                ntko.CancelLastCommand = !that._beforeFileQueued(filePath, fileName, fileSize);
            });
            ntko.attachEvent('OnLocalFileAdded', function(filePath, fileName, fileSize) {

                that._onFilesQueued(filePath, fileName, fileSize);
            });
            ntko.attachEvent('OnFileProcessStatusChange', function(file, statusText, isPersent, persentNumber) {
                that._onUploadProgress(file, statusText, isPersent, persentNumber);
            });
            ntko.attachEvent('OnOneFileUploadFinished', function(file, isAllUploaded) {
                that._onFileFinished(file, isAllUploaded);
            });
            ntko.attachEvent('OnSaveToURLFinished', function(isAllSuccess) {
                that._onUploadFinished(isAllSuccess);
            });
        } else {
            var id = this.uid + '-ntko',
                lfu = 'var lfu = mini.getbyUID("' + this.uid + '");',
                text = lfu + 'lfu._ntko.CancelLastCommand = !lfu._beforeFileQueued(filePath, fileName, fileSize);';

            addEvent({
                target: id,
                event: "BeforeFileAdded(filePath, fileName, fileSize)",
                text: text
            });

            text = lfu + 'lfu._onFilesQueued(filePath, fileName, fileSize);';
            addEvent({
                target: id,
                event: "OnLocalFileAdded(filePath, fileName, fileSize)",
                text: text
            });

            text = lfu + 'lfu._onUploadProgress(file, statusText, isPersent, persentNumber);';
            addEvent({
                target: id,
                event: "OnFileProcessStatusChange(file, statusText, isPersent, persentNumber)",
                text: text
            });

            text = lfu + 'lfu._onFileFinished(file, isAllUploaded);';
            addEvent({
                target: id,
                event: "OnOneFileUploadFinished(file, isAllUploaded)",
                text: text
            });

            text = lfu + 'lfu._onUploadFinished(isAllSuccess);';
            addEvent({
                target: id,
                event: "OnSaveToURLFinished(isAllSuccess)",
                text: text
            });

        }

        function addEvent(opt) {
            var script = document.createElement('script');
            script.language = "JScript";
            script.setAttribute('for', opt.target);
            script.event = opt.event;
            script.text = opt.text;
            document.body.appendChild(script);
        }
        if (this.showDefaultUI) {
            jQuery(this._fileList).on('click', '.mini-uploader-remove', function() {
                var $this = jQuery(this),
                    fileId = $this.attr('fileId'),
                    // $item = $this.closest('.mini-uploader-item'),
                    fileGuid = $this.attr('fileGuid');

                mini.confirm('确定删除文件？', '系统提示', function(action) {
                    if (action == 'ok') {
                        // 两值相等，则表示是初始化时后台给的文件，不在文件列表中，不需要从文件列表中删除
                        if (fileId != fileGuid) {
                            that.removeFile(fileId);
                        } else {
                            jQuery(that._fileList).find('#' + fileId).remove();
                            that.serverFileNum--;
                        }

                        // 有fileGuid则表示改文件已上传成功了，需要发ajax告诉服务端文件已删除
                        if (fileGuid) {
                            var data = {
                                commonDto: mini.encode(that.getCommonData())
                            };
                            data[that.id + "_action"] = 'delete';
                            data[that.id + "_attachGuid"] = fileGuid;

                            // 此处不能用Util.ajax
                            // 原因是回调中需要拿到后端返回的控件数据，而Util.ajax是会过滤掉控件数据的
                            var xhr = $.ajax({
                                url: that.uploadUrl,
                                data: data,
                                dataType: 'json',
                                type: 'post'
                            });

                            xhr.done(function(data) {
                                data = mini.getSecondRequestData(data);
                                that.fire('fileremovesuccess', {
                                    sender: that,
                                    eventType: "fileremovesuccess",
                                    fileGuid: fileGuid,
                                    data: data
                                });
                            });
                        }
                    }
                });

            });
        }
    },
    _validateFile: function(file) {
        var filesCount = this._ntko.FilesCount;
        if (this.fileNumLimit && filesCount >= this.fileNumLimit - this.serverFileNum) {
            this._errorContent = String.format(this.numLimitErrorText, this.fileNumLimit);

            return false;
        }

        if (this.fileSingleSizeLimit && file.size > this.fileSingleSizeLimit * 1024) {
            this._errorContent = String.format(this.sizeErrorText, this.fileSingleSizeLimit);

            return false;
        }

        if (file.size === 0) {
            this._errorContent = this.emptyFileErrorText;

            return false;
        }

        if (this.limitType && (',' + this.limitType + ',').indexOf(',' + file.ext.toLowerCase() + ',') == -1) {
            this._errorContent = String.format(this.typeDeniedErrorText, this.limitType);

            return false;
        }

        return true;
    },

    // 当有文件添加进来的时候
    _onFilesQueued: function(filePath, fileName, fileSize) {
        var file = {
            path: filePath,
            name: fileName,
            size: fileSize,
            ext: fileName.substr(fileName.lastIndexOf('.') + 1),
            id: UUID()
        };

        this._fileIds[file.path] = {
            id: file.id
        };

        if (this.showDefaultUI) {
            var item = this._generateFileList({
                id: file.id,
                name: file.name,
                size: file.size,
                date: mini.formatDate(new Date(), 'yyyy-MM-dd')
            });
            jQuery(this._fileList).append(item);
        }
        if (this._events["filesqueued"]) {
            this.fire("filesqueued", {
                files: [file]
            });
        }
    },

    _generateFileList: function(options) {
        options.fileGuid = options.fileGuid || '';
        if (options.downloadUrl) {
            // options.downloadUrl = _rootPath + '/' + options.downloadUrl + '?attachGuid=' + options.fileGuid;
            // 根路径 + 返回路径带attachGuid 
            // 根路径 + 返回路径不带attachGuid 则判断是否带？ 是则拼接&guid 否则？guid
            options.downloadUrl = _rootPath + '/' +
                (
                    options.downloadUrl.indexOf('attachGuid') != -1 ?
                    // 已经有attachGuid了 就不处理
                    options.downloadUrl :
                    // 没有attachGuid 根据是否有？ 拼接上 '&' 或 '?' + 'attachGuid=' + options.fileGuid
                    (options.downloadUrl + (options.downloadUrl.indexOf('?') != -1 ? '&' : '?') + 'attachGuid=' + options.fileGuid)
                );
        } else {
            options.downloadUrl = 'javascript:void(0)';
        }

        var list = [];
        list.push('<div id="' + options.id + '" class="mini-uploader-item' + (options.success ? ' success' : '') + '">');
        list.push('<a href="' + options.downloadUrl + '" class="mini-uploader-info">' + options.name + '</a>');
        list.push('<span class="mini-uploader-size">(' + this._getSize(options.size) + (options.date ? '/' + options.date : '') + ')</span>');
        list.push('<span class="mini-uploader-error"></span>');
        list.push('<span class="mini-uploader-progressbar" style="display: none;"><span class="progress-text">0%</span><div class="progress-body"></div></span>');
        if (!options.hideDelete) {
            list.push('<a href="javascript:void(0)" class="mini-uploader-remove" fileId="' + options.id + '" fileGuid="' + options.fileGuid + '">删除</a>');
        }
        list.push('</div>');

        return list.join('');
    },

    _needPostData: true,
    // 当开始上传流程时触发
    _onStartUpload: function() {
        if (this.postData && this._needPostData) {

            var me = this;
            var data = {
                commonDto: mini.encode(this.getCommonData())
            };
            data[this.id + '_incache'] = true;
            data[this.id + '_postData'] = this.postData;
            data[this.id + '_fileCount'] = this._uploader.getFiles().length;
            data[this.id + '_fileLoadedCount'] = this._uploader.getStats().successNum;

            var xhr = Util.ajax({
                url: this.uploadUrl,
                data: data,
                dataType: 'json'
            });

            xhr.done(function(data) {
                me._needPostData = false;
                me.beginUpload();
            });

            return false;
        }
        if (this._events["startupload"]) {
            var event = {
                source: this,
                sender: this,
                type: 'startupload',
                cancel: false
            };

            this.fire("startupload", event);

            if (event.cancel) {
                return false;
            }
        }

        return true;
    },
    // 当所有文件上传结束时触发
    _onUploadFinished: function(isAllSuccess) {
        this._uploadBtn.setText(this.startText);
        this._needPostData = true;
        this.fire("uploadfinished", {
            isAllSuccess: isAllSuccess
        });
    },
    // 文件上传过程中触发。
    _onUploadProgress: function(file, statusText, isPersent, persentNumber) {
        file = this._parseAttachFile(file);

        var isUploading = false;
        var li = mini.byId(file.id),
            $progressbar = jQuery('.mini-uploader-progressbar', li),
            $progresstext = jQuery('.progress-text', $progressbar),
            $progressbody = jQuery('.progress-body', $progressbar),
            width;
        if (isPersent) {

            if (!isUploading && statusText.indexOf('正在分析文件') === 0) {
                if (this.showDefaultUI) {
                    width = Math.round(persentNumber) + '%';

                    $progresstext.text('正在分析文件');
                    $progressbody.width(width);
                }

                this.fire("md5progress", {
                    file: file,
                    percentage: persentNumber / 100
                });


                if (persentNumber == 100) {
                    isUploading = true;
                }
            } else {
                if (this.showDefaultUI) {
                    width = Math.round(persentNumber) + '%';

                    $progresstext.text('已上传：' + width);
                    $progressbody.width(width);
                }

                this.fire("uploadprogress", {
                    file: file,
                    percentage: persentNumber / 100
                });

            }
        } else if (!this._fileIds[file.path].started) {
            if (this.showDefaultUI) {
                $progressbar.show();
            }

            this.fire("uploadstart", {
                file: file
            });

            this._fileIds[file.path].started = true;
        }

    },
    // 当某个文件的分块在发送前触发，主要用来询问是否要添加附带参数，大文件在开起分片上传的前提下此事件可能会触发多次
    _onUploadBeforeSend: function(data) {
        data = data.data;
        data.commonDto = mini.encode(this.getCommonData());

        // 带上页面地址中的参数
        var query = window.location.search.substring(1).split('&');
        var param;
        for (var i = 0, len = query.length; i < len; i++) {
            param = query[i].split('=');
            if (param[0]) {
                data[param[0]] = param[1];
            }
        }

        this.fire("uploadbeforesend", {
            sender: this,
            data: data
        });
    },
    _onUploadSuccess: function(file) {
        var ret = this._parseNtkoRet(this._ntko.LastFinishedUploadRetMes);
        if (ret.uploadFailed) {
            mini.alert(ret.failedMsg || '上传失败！请重新上传！');
            this.removeFile(file.id);

            return;
        }

        this.fire('uploadaccept', {
            ret: ret,
            object: {
                file: file
            }
        });

        if (this.showDefaultUI) {
            var $item = jQuery('#' + file.id);
            var fileGuid = ret.attachGuid,
                downloadUrl = ret.downloadUrl;

            if (downloadUrl) {
                downloadUrl = decodeURIComponent(downloadUrl);
                downloadUrl = _rootPath + '/' +
                    (
                        downloadUrl.indexOf('attachGuid') != -1 ?
                        // 已经有attachGuid了 就不处理
                        downloadUrl :
                        // 没有attachGuid 根据是否有？ 拼接上 '&' 或 '?' + 'attachGuid=' + fileGuid
                        (downloadUrl + (downloadUrl.indexOf('?') != -1 ? '&' : '?') + 'attachGuid=' + fileGuid)
                    );
            }

            $item.addClass('success');
            $item.find('.mini-uploader-error').html('').hide();

            if (fileGuid) {
                $item.find('.mini-uploader-remove').attr('fileGuid', fileGuid);
                if (downloadUrl) {
                    $item.find('.mini-uploader-info').attr('href', downloadUrl);
                }
            }
        }
        this.fire("uploadsuccess", {
            file: file
        });
    },
    _onUploadError: function(file, reason) {
        if (this.showDefaultUI) {
            jQuery('#' + file.id).find('.mini-uploader-error').html('上传出错!').show();
        }

        this.fire("uploaderror", {
            file: file,
            reason: reason
        });
    },
    _onUploadComplete: function(file) {
        if (this.showDefaultUI) {
            jQuery('#' + file.id).find('.mini-uploader-progressbar').fadeOut();
        }

        this.fire("uploadcomplete", {
            file: file
        });
    },

    _getSize: function(size) {
        var K = 1024,
            M = 1048576;
        size = parseInt(size);

        if (size > M) {
            return (size / M).toFixed(2) + "M";
        } else {
            return (size / K).toFixed(2) + "K";
        }
    },

    getCommonData: function() {
        if (!this.controlData) {
            this.controlData = {
                id: this.id,
                type: "largeFileUploader",
                mapClass: this.mapClass,
                action: this.action,
                showDefaultUI: this.showDefaultUI,
                needChunkLocal: this.needChunkLocal,
                dataOptions: this['data-options']
            };
        }
        return [this.controlData, this.getViewdata()];
    },

    getViewdata: function() {
        var hidden = mini.get('_common_hidden_viewdata');

        if (!this.viewData) {
            this.viewData = {
                id: '_common_hidden_viewdata',
                type: 'hidden',
                value: ''
            };
        }

        if (hidden) {
            this.viewData.value = hidden.getValue();
        }

        return this.viewData;
    },

    setShowDefaultUI: function(showDefaultUI) {
        this.showDefaultUI = showDefaultUI;
        if (this.controlData) {
            this.controlData.showDefaultUI = showDefaultUI;
        }
    },

    setPostData: function(postData) {
        this.postData = postData;

    },

    getExtraAttrs: function(el) {
        var attrs = {};
        mini._ParseString(el, attrs, ["onfileremovesuccess","postData", "onload"
        ]);
        mini._ParseBool(el, attrs, ["showDefaultUI", "needChunkLocal"]);

        return attrs;
    }
});

mini.overwrite(mini.WebEditor, {
    mapClass: '',
    _editorModel: (window.EpFrameSysParams && EpFrameSysParams['editor_model']) || 'ewebeditor'
});
mini.overwrite(mini.Window, {
     destroy: function (removeEl) {
        //this._doModal();
        //mini.un(document, "mousedown", this.__OnBodyMouseDown, this);
        mini.un(window, "resize", this.__OnWindowResize, this);


        if (this._modalEl) {
            jQuery(this._modalEl).remove();
            this._modalEl = null;
        }
        if (this.shadowEl) {
            jQuery(this.shadowEl).remove();
            this.shadowEl = null;
        }

        var id = '__modal' + this._id;
        jQuery("[id='" + id + "']").remove();


        mini.Window.superclass.destroy.call(this, removeEl);

        if(mini.isIE8) {
            var $el = jQuery('[class*="icon-"]');
            $el.addClass('modicon-empty');

            setTimeout(function() {
                $el.removeClass('modicon-empty');
            }, 0);
        }        
    }
});
   
/*
 * 复写目的是为了改造请求数据的方法以适应框架的数据格式
 */
mini.overwrite(mini.PanelTip, {
    // 第三方资源路径
    externalSrc:  _rootPath + '/frame/fui/js/libs/',

    _getData: function(params, openedGuid) {
        var self = this;
        this.showLoading();
        // 框架中返回的数据是在custom中的，为了方便处理，改为用框架中的ajax方法
        Util.ajax({
            url: this.url,
            data: params,
            async: true,
            success: function(text) {
                var data = mini.decode(text) || '';

                // 记住当前展示的guid，避免点击同一个时重复请求数据
                self._opened = openedGuid;

                if (!window.Mustache) {
                    mini.loadJS(self.externalSrc + 'mustache.min.js', function() {
                        self._renderContent(data);
                    });
                } else {
                    self._renderContent(data);
                }

            }
        });
    }
});
mini.overwrite(mini.VerifyCode, {
	mapClass: 'com.epoint.basic.faces.verifycode.VerifyCode',
	autoLoad: false,

    ignorecase: true,
    
    setData: function(data) {
        this.value = data.value;
        this._img.src = data.src;
        this.uuid = data.uuid;
    },

    getExtraAttrs: function(el) {
        var attrs = {};
        mini._ParseBool(el, attrs, ["ignorecase"
        ]);
        return attrs;
    }
});
mini.overwrite(mini.DataImport, {
    extraId: '',

    _onPostFileMd5: function(data) {
        var extraData,
        uploadData;
        if(this.extraId) {
            extraData = DtoUtils.getCommonDto(this.extraId).getData(true);
            uploadData = this.uploader.getCommonData();
            for(var i in extraData){
                if(extraData.hasOwnProperty(i) && i != "_common_hidden_viewdata") {
                    uploadData.push(extraData[i]);
                }
            }

            data.commonDto = mini.encode(uploadData);
        }
    },
    setUrl: function (url) {
        url = url.indexOf('isCommondto') != -1 ?
                // 已经有isCommondto了 就不处理
                url :
                // 没有isCommondto 根据是否有？ 拼接上 '&' 或 '?' + 'isCommondto=true
                (url + (url.indexOf('?') != -1 ? '&' : '?') + 'isCommondto=true');
                
        this.url = url;

        this.uploader && this.uploader.setUploadUrl(url);
    }
});
mini.UserControl = function () {
    mini.UserControl.superclass.constructor.call(this);
};

mini.extend(mini.UserControl, mini.Control, {
    // 如果要用commonDto则必须设置value属性
    value: "",

    // 模板的地址
    tplUrl: "",

    // css文件资源路径
    cssUrl: "",

    isUserControl: true,

    _create: function () {
        this.el = document.createElement("div");

        if (this.cssUrl && !document.getElementById(this.uiCls + '-style')) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.href = (_rootPath + '/' + this.cssUrl);
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.id = this.uiCls + "-style";
            head.appendChild(link);
        }
    },

    // 在该方法中进行自定义控件模板的加载解析，以及一些真正的初始化工作
    _afterApply: function () {
        this.parseTpl();

    },

    init: function () {

    },

    parseTpl: function () {
        var that = this;

        this.setTplData();

        // 通过ajax获取控件的模板
        jQuery.ajax({
            url: (_rootPath + '/' + this.getTplUrl()),
            // 必须为同步请求
            async: false,
            type: "post",
            dataType: 'html',
            success: function (text) {
                var M = Mustache,
                    templ = $.trim(text);

                // 解析模板，将模板中的id替换为以控件id为前缀，以避免页面同时有多个控件时id冲突。
                // 模板中的控件设置id是为了方便下面的获取
                // 模板中必须使用完整的html结构
                // 如<div role="control" label="标段(包)名称" starred="true"></div>这种需要通过commonjs来解析的html是不允许的，因为commonjs是不会解析的
                var html = M.render(templ, that.tplData);

                // 将解析好的html塞到页面中
                that.el.innerHTML = html;

                // 解析控件html中的miniui控件
                mini.parse(that.el);

                // 其他的一些初始化工作
                // 把后面会用到内部控件缓存起来
                that.controls = {};

                that.init();

                // 处理二次请求的控件
                if (window.DtoUtils) {
                    DtoUtils.bindBeforeLoad(that);
                }

            }
        });
    },

    getTplUrl: function(){
        var lan = mini.Cookie.get('epoint_local');

        if(typeof this.tplUrl === 'string'){
            return this.tplUrl;
        }
        
        return this.tplUrl[lan] || this.tplUrl['zh_CN'];

    },

    setTplData: function () {
        this.tplData = {
            controlId: this.id
        };
    },

    // 设置内部控件的值以及一些根据后台返回数据来控制显隐等操作
    // commonDto中初始化时会调用
    // 具体的数据结构根据控件自己的特点来确定
    // 本控件的数据结构如dbworkflow.json
    setData: function (data) {

        for (var i in data) {
            if (this.controls[i] && data[i]) {
                if (typeof data[i] != 'object' && this.controls[i].setValue) {
                    this.controls[i].setValue(data[i]);
                }
                if (data[i].value && this.controls[i].setValue) {
                    this.controls[i].setValue(data[i].value);
                }
                if (data[i].data) {
                    if (this.controls[i].loadList) {
                        this.controls[i].loadList(data[i].data);
                    } else if (this.controls[i].setData) {
                        this.controls[i].setData(data[i].data);

                        if (data[i].total && this.controls[i].setTotalCount) {
                            this.controls[i].setTotalCount(data[i].total);
                        }
                    }
                }
            }
        }
    },

    // 返回控件的数据
    // commonDto中表单提交 时会调用
    // 具体的数据结构根据控件自己的特点来确定
    getValue: function () {
        var data = {};
        for (var i in this.controls) {
            if (this.controls[i].getValue) {
                data[i] = this.controls[i].getValue();
            }
        }

        return data;
    },

    setValue: function (value) {
        this.value = value;
    }
});
mini.externalSrc = _rootPath + '/frame/fui/js/widgets/';

mini.regHtmlAttr('action');
mini.regHtmlAttr('bind');
mini.regHtmlAttr('extraId');

// 处理控件的二次请求数据格式 
(function(win, $) {
    win.mini_doload = function(e) {

        var data = mini.decode(e.text, false),
            custom,
            len,
            viewData;

        if(data[Util.BODY_ENCRYPT_PARAM_NAME]) {
            data = Util.decrypt(data[Util.BODY_ENCRYPT_PARAM_NAME]);
            data = mini.decode(data);
        }

        custom = data.custom;
        data = data.controls || data;

        if (mini.isArray(data) && data[0] && data[0].id) {
            len = data.length;
            viewData = data[len - 1];

            if (viewData.id == '_common_hidden_viewdata') {
                mini.get('_common_hidden_viewdata').setValue(viewData.value);
            }
            if (data[0].total !== undefined) {
                data = data[0];
            } else {
                data = data[0].data;
            }

        }
        if ((!data || (mini.isArray(data) && data.length === 0)) && custom) {
            data = custom;
        }
        e.result = data;

    };

    mini.copyTo(mini, {
        getSecondRequestData: function(data) {
            if(data[Util.BODY_ENCRYPT_PARAM_NAME]) {
                data = Util.decrypt(data[Util.BODY_ENCRYPT_PARAM_NAME]);
                data = mini.decode(data);
            }
            // 返回数据不符合规范，可能是服务端出错了，直接返回空
            if(!data || !data.status ) {
                return [];
            }
            
            var status = data.status,

                code = parseInt(status.code),
                text = status.text,
                url = status.url,
                state = status.state || "error",
                title = state == "warning" ? "警告提示" : "错误提示",
                viewData;

            if (code >= 300) {
                if (url) {
                    if (url.indexOf('http') != 0) {
                        url = _rootPath + '/' + url
                    }
                    var aimWindow = status.top ? top : window;
                    if (aimWindow.Util && aimWindow.Util.getSafeLocation) {
                        aimWindow.Util.getSafeLocation().setHref(url);
                    } else {
                        aimWindow.location.href = url;
                    }
                    return;
                } 
                if (text) {
                    mini.showMessageBox({
                        title: title,
                        buttons: ["ok"],
                        message: text,
                        iconCls: "mini-messagebox-" + state
                    });

                }
            } else {

                data = data.controls || data;

                if (mini.isArray(data) && data[0] && data[0].id) {
                    var len = data.length;
                    // 有的请求可能只有一个 _common_hidden_viewdata （比如上传控件的附件删除请求），也需要更新
                    // 所以把判断去掉 modify at 2019-06-27
                    // if (len > 1) {
                        viewData = data[len - 1];

                        if (viewData.id == '_common_hidden_viewdata') {
                            mini.get('_common_hidden_viewdata').setValue(viewData.value);
                        }
                    // }
                    data = data[0];
                }
                return data;
            }

        }
    });
}(window, jQuery));

// 新版源码应该已解决该问题，解决办法是只要页面有元素滚动，编辑控件就会自动消失
// // 在页面中content区域有滚动的情况下，里面的表格编辑控件不会随着content区域的滚动而滚动
// // 为解决这问题，改写了表格编辑控件dom位置，改为在content区域内
// $(function() {
//     // cellEditorContainer即编辑控件存放容器
//     // 编辑控件存放容器的position设为relative，以达到编辑控件随容器一起滚动的效果
//     mini.cellEditorContainer = $('.fui-content').css('position', 'relative')[0];
// });

// var initControlServerValue = function() {

//     mini.overwrite(mini.WebUploader, {
//         fileSizeLimit: window.mini_uploader_fileSizeLimit,

//         limitType: window.mini_uploader_limitType
//     });
//     mini.overwrite(mini.DataGrid, {
//         pageSize: window.mini_grid_pageSize
//     });

//     if(window.mini_doinitControlServerValue) {
//         mini_doinitControlServerValue();
//     }
// };

// if(window.mini_attrValue_fromServer) {
//     initControlServerValue();
// }
}());
(function () {
    /**
     * 为了防止代码中未移除的console在IE8\9下可能报错的问题，对没有console的情况进行了处理
     */
    if (!window.console) {
        window.console = {
            log: function () {},
            dir: function () {},
            dirxml: function () {},
            info: function () {},
            warn: function () {
                // var str = '【警告】\n原警告参数依次为：\n';
                // for (var i = 0, l = arguments.length; i < l; ++i) {
                //     str += String(arguments[i]) + '\n';
                // }
                // window.alert(arguments.length ? str : '【警告】');
            },
            error: function () {
                // var str = '【错误】\n原错误参数依次为：\n';
                // for (var i = 0, l = arguments.length; i < l; ++i) {
                //     str += String(arguments[i]) +'\n';
                // }
                // window.alert(arguments.length ? str : '【错误】');
            }
        };
    }

    // 绑定事件
    function on(el, type, fn) {
        if (el.addEventListener) {
            el.addEventListener(type, fn, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + type, fn);
        }
    }
    // 对象合并
    function assign() {
        var target = arguments[0];
        var i = 1,
            len = arguments.length,
            key = '',
            obj = null,
            hasOwnProperty = Object.prototype.hasOwnProperty;

        for (; i < len; i++) {
            obj = arguments[i];
            for (key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    target[key] = obj[key];
                }
            }
        }

        return target;
    }
    // 类型判断
    var class2type = { '[object Boolean]': 'boolean', '[object Number]': 'number', '[object String]': 'string', '[object Function]': 'function', '[object Array]': 'array', '[object Date]': 'date', '[object RegExp]': 'regexp', '[object Object]': 'object', '[object Error]': 'error', '[object Symbol]': 'symbol' };
    function getType(obj) {
        if (obj == null) {
            return obj + '';
        }

        var str = Object.prototype.toString.call(obj);
        return typeof obj === 'object' || typeof obj === 'function' ? 
            class2type[str] || 'object' : typeof obj;
    }

    // 一天的毫秒数目
    var DAY_MILLISECONDS = 1000 * 60 * 60 * 24;

    // 统一的cookie配置
    var DEFAULT_COOKIE_OPTIONS = {
        // 过期时间 单位天
        // expires: 30,
        // path: '/',
        // domain: '',
        // secure: false
    };
    // 设置cookie的默认配置
    var setCookieDefaultOption = function (opt) {
        for (var k in opt) {
            if (Object.prototype.hasOwnProperty.call(opt, k)) {
                DEFAULT_COOKIE_OPTIONS[k] = opt[k];
            }
        }
    };

    /**
     * 写入cookie
     *
     * @param {string} key cookie 名称
     * @param {string} value cookie 值
     * @param {object | undefined} options 当前cookie的配置 { expires,path,domain,secure }
     * @returns {string} 写入的cookie
     */
    var writeCookie = function (key, value, options) {
        if (!options || getType(options) != 'object') {
            options = assign({}, DEFAULT_COOKIE_OPTIONS, options || {});
        }

        // 过期时间
        if (getType(options.expires) == 'number') {
            var d = options.expires;
            options.expires = new Date();
            options.expires.setMilliseconds(options.expires.getMilliseconds() + d * DAY_MILLISECONDS);
        }
        return (document.cookie = [encodeURIComponent(key), '=', value,
            options.expires ? '; expires=' + options.expires.toUTCString() : '',
            options.path ? '; path=' + options.path : '',
            options.domain ? '; domain=' + options.domain : '',
            options.secure ? '; secure' : ''
        ].join(''));
    };

    /**
     * 读取cookie
     *
     * @param {string} key cookie 名称
     * @returns 读取到的cookie值
     */
    var readCookie = function (key) {
        var result = key ? undefined : {},
            cookies = document.cookie ? document.cookie.split('; ') : [],
            i = 0,
            l = cookies.length;
        for (; i < l; i++) {
            var parts = cookies[i].split('='),
                name = decodeURIComponent(parts.shift()),
                v = parts.join('=');

            if (key === name) {
                result = v;
                break;
            }

            if (!key && v !== undefined) {
                result[name] = v;
            }
        }
        return result;
    };

    /**
     * 移除一个cookie
     *
     * @param {string} key cookie名称
     * @param {object} options cookie配置
     * @returns
     */
    var removeCookie = function (key, options) {
        options = options || {};
        options.expires = -1;
        writeCookie(key, '', options);
        return !readCookie(key);
    };

    /**
     * 安全Location对象的封装 IE9+ 可保障表现和location一样 IE8赋值需使用对应set方法
     */
    function SafeLocation() {
        var that = this;
        // this.protocol = location.protocol;
        // this.host = location.host;
        // this.hostname = location.hostname;
        // this.port = location.port;
        // this.pathname = location.pathname;
        // this.search = location.search;
        // this.username = location.username;
        // this.password = location.password;
        this.origin = location.origin;

        this._writeProps = ['protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'username', 'password'];
        this._isSupportDescriptor = !!Object.defineProperties;

        // 需要额外处理的 这两个属性会随时变化 需要不同的时候来获取
        // hash href
        var hash;
        if (this._isSupportDescriptor) {
            Object.defineProperties(this, {
                protocol: {
                    get: function () {
                        return location.protocol;
                    },
                    set: function (v) {
                        location.protocol = v;
                    }
                },
                host: {
                    get: function () {
                        return location.host;
                    },
                    set: function (v) {
                        location.host = v;
                    }
                },
                hostname: {
                    get: function () {
                        return location.hostname;
                    },
                    set: function (v) {
                        location.hostname = v;
                    }
                },
                port: {
                    get: function () {
                        return location.port;
                    },
                    set: function (v) {
                        location.port = v;
                    }
                },
                pathname: {
                    get: function () {
                        return location.pathname;
                    },
                    set: function (v) {
                        location.pathname = v;
                    }
                },
                search: {
                    get: function () {
                        return location.search;
                    },
                    set: function (v) {
                        location.search = v;
                    }
                },
                username: {
                    get: function () {
                        return location.username;
                    },
                    set: function (v) {
                        location.username = v;
                    }
                },
                password: {
                    get: function () {
                        return location.password;
                    },
                    set: function (v) {
                        location.password = v;
                    }
                },
                href: {
                    get: function () {
                        return location.href;
                    },
                    set: function (v) {
                        // TODO 安全过滤
                        location.href = v;
                    }
                },
                hash: {
                    get: function () {
                        hash = location.hash;
                        return hash;
                    },
                    set: function (v) {
                        if ((v || '')[0] != '#') {
                            v = '#' + v;
                        }
                        // TODO 安全过滤
                        hash = location.hash = v;
                    }
                }
            });
        } else {
            // 监听变化事件进行更新
            on(window, 'hashchange', function () {
                that.href = location.href;
                that.hash = location.hash;
            });
        }

        var props = this._writeProps.concat(['href', 'hash']);
        for (var i = 0, len = props.length; i < len; i++) {
            // 属性
            var p = props[i];
            // 对应方法
            var fnName = p[0].toUpperCase() + p.substr(1);
            (function (p, fnName) {
                // 支持描述符 则直接赋值
                if (that._isSupportDescriptor) {
                    that['set' + fnName] = function (v) {
                        that[p] = v;
                    };
                } else {
                    that[p] = location[p];
                    // 否则需要方法处理
                    that['set' + fnName] = function (v) {
                        that[p] = location[p] = v;
                    };
                }

                that['get' + fnName] = function () {
                    return that[p];
                };
            })(p, fnName);
        }

        // IE8 下检测 直接赋值的更新
        if (!this._isSupportDescriptor) {
            setInterval(function () {
                for (var i = 0, l = props.length; i < l; i++) {
                    var p = props[i];
                    if (that[p] != location[p]) {
                        location[p] = that[p];
                    }
                }
            }, 50);
        }
    }

    SafeLocation.prototype.replace = function (url) {
        // TODO 安全过滤
        location.replace(url);
    };

    SafeLocation.prototype.reload = function () {
        location.reload();
    };
    SafeLocation.prototype.assign = function (url) {
        // TODO 安全过滤
        location.assign(url);
    };
    SafeLocation.prototype.toString = function () {
        return this.href;
    };

    /**
     * html 转义
     *
     * @param {string} html 要处理的字符串
     * @returns 经过html转义的字符串
     */
    function htmlEscape(html) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(html));
        var s = div.innerHTML;
        div = null;
        return s;
    }
    /**
     * html 还原转义
     */
    function htmlUnescape(str) {
        // var div = document.createElement('div');
        // div.innerHTML = str;
        // var t = div.innerText;
        // div = null;
        // return t;
        if (typeof str !== 'string') return str;
        var s = '';
        if (str.length == 0) return '';
        s = str.replace(/&amp;/g, '&');
        s = s.replace(/&lt;/g, '<');
        s = s.replace(/&gt;/g, '>');
        s = s.replace(/&nbsp;/g, ' ');
        s = s.replace(/&#39;/g, '\'');
        s = s.replace(/&quot;/g, '"');
        //s = s.replace(/<br>/g, "\n");
        return s;
    }

    /**
     * html XSS过滤
     * TODO: html XSS 注入的可能情况
     * 1、 script标签
     * 2、 style 样式中 url 发请求
     * 3、 资源型标签 src 触发
     * 4、 html行内事件，如onclick onmouseover等
     * @param {string} html 要处理的字符串
     * @returns 经过安全过滤html字符串
     */
    function getSafeHtml(html) {
        if (!html) return;
        // TODO
        // script 处理
        // html = html.replace(/<script(.*?)>/gi, '&lt;script$1&gt;').replace(/<\/script>/gi, '&lt;/script&gt;');
        html = html.replace(/<script(.*?)>/gi, '<noscript$1>').replace(/<\/script>/gi, '</noscript>');

        // createDocumentFragment 存在注入可能 $.parseHTML 存在相同问题
        // 测试代码：SafeUtil.getSafeHtml(`<div class="qm-item" id="qm-48ecf37e-b134-401c-b757-15dcd7bc0416" data-id="48ecf37e-b134-401c-b757-15dcd7bc0416" title="CBM" data-url="https://oa.epoint.com.cn/EpointCBM/login.aspx" data-hassub="" data-opentype="blank" style="width:20%"><div class="qm-item-inner" style="background:#5d73e0;"><span class="qm-item-icon modicon-77"></span><span class="qm-item-name ">CBM</span><img src="abc.png" onerror="alert(1)"/></div></div>`)
        // var doc = document.createDocumentFragment();
        // var wrap = document.createElement('div');
        // wrap.innerHTML = html;
        // doc.appendChild(wrap);

        // var parser = new DOMParser();
        // var wrap = parser.parseFromString(html, 'text/html');

        // var nodes = wrap.childNodes;
        // if (nodes.length) {
        //     filterNode(nodes);
        // }

        // function filterNode(nodeList) {
        //     for (var i = 0; i < nodeList.length; i++) {
        //         var node = nodeList[i];
        //         var type = node.nodeType;
        //         // 文本和注释
        //         if (type === 3 || type === 8) {
        //             continue;
        //         }
        //         if (node.getAttribute('src')) {
        //             console.warn('匹配到src', node);
        //             // todo
        //         }
        //         if (node.getAttribute('style')) {
        //             console.warn('匹配到style', node);
        //             // todo
        //         }
        //         if (node.childNodes && node.childNodes.length) {
        //             filterNode(node.childNodes);
        //         }
        //     }
        // }

        return html;
    }

    /**
     * 安全 eval
     * TODO: eval 本身就是风险非常大的，
     * 目前暂无内部过滤方案暂时统一使用，以便后期修改
     * @param {string} code
     * @returns eval 结果
     */
    function safeEval(code) {
        // TODO 暂时以关键字过滤处理 不过存在误伤可能性
        // function
        // => 箭头函数
        // delete
        if (/function/.test(code)) {
            console.warn('eval [function] 关键字');
        }
        // if (/=>/.test(code)) {
        //     console.warn('eval 潜在箭头函数');
        // }
        // if (/delete/.test(code)) {
        //     console.warn('eval [delete] 关键字');
        // }

        return eval(code);
    }

    var SafeUtil = {
        writeCookie: writeCookie,
        readCookie: readCookie,
        removeCookie: removeCookie,
        setCookieDefaultOption: setCookieDefaultOption,
        location: new SafeLocation(),
        htmlEscape: htmlEscape,
        htmlUnescape: htmlUnescape,
        getSafeHtml: getSafeHtml,
        safeEval: safeEval
    };
    SafeUtil.getSafeLocation = function () {
        return SafeUtil.location;
    };
    // window.SafeUtil = SafeUtil;
    if (!window.Util) {
        window.Util = {};
    }

    assign(Util, SafeUtil);
})();
/*!
 * Util工具类
 */
(function (win, $) {

    var $win = $(win),
        $bd = $('body'),
        $doc = $(document);

    // minimum z-index for popups
    var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

    // 是否存在activeX控件：object标签
    // var hasObjectTag = !!document.getElementsByTagName('object').length;
    // 由于存在iframe嵌套的情况，在当前页判断并不可靠，始终置为true
    var hasObjectTag = true;

    // 实现一个自定义事件
    function UserEvent() {
        // 必须使用new命令
        if (!(this instanceof UserEvent)) return new UserEvent();
        this.__events = {};
    }
    UserEvent.installTo = function (obj) {
        if (typeof obj != 'object') {
            throw new TypeError('obj must be an object');
        }
        if (obj.__events !== undefined) {
            throw new Error('此对象已经存在 __events 属性了。');
        }
        obj.__events = {};
        obj.on = UserEvent.prototype.on;
        obj.off = UserEvent.prototype.off;
        obj.fire = UserEvent.prototype.fire;
        obj.one = UserEvent.prototype.one;
        return obj;
    }
    $.extend(UserEvent.prototype, {
        on: function (type, fn) {
            if (Util._getType(type) != 'string') {
                console.error('The Event name must be a string');
                return this;
            }
            if (Util._getType(fn) != 'function') {
                console.error('The Event handler must be a function');
                return this;
            }
            type = type.toLowerCase();
            if (!this.__events[type]) {
                this.__events[type] = [];
            }
            this.__events[type].push(fn);
            return this;
        },
        fire: function (type, data, context) {
            if (Util._getType(type) != 'string') {
                console.error('The Event name must be a string');
                return this;
            }
            type = type.toLowerCase();
            var eventArr = this.__events[type];
            if (!eventArr || !eventArr.length) return;
            for (var i = 0, l = eventArr.length; i < l; ++i) {
                eventArr[i].call(context || this, {
                    type: type,
                    target: this,
                    data: data
                });
            }
            return this;
        },
        off: function (type, fn) {
            var eventArr = this.__events[type];
            if (!eventArr || !eventArr.length) return;

            if (!fn) {
                this.__events[type] = eventArr = [];
            } else {
                for (var i = 0; i < eventArr.length; ++i) {
                    if (fn === eventArr[i]) {
                        eventArr.splice(i, 1);
                        --i;
                    }
                }
            }
            return this;
        },
        one: function (type, fn) {
            var that = this;

            function nfn() {
                // 执行时 先取消绑定
                that.off(type, nfn);
                // 再执行函数
                fn.apply(this || that, arguments);
            }

            this.on(type, nfn);

            return this;
        }
    });

    if (!win.Util) {
        win.Util = {};
    }

    $.extend(Util, {
        // client size
        getWinSize: function () {
            return {
                width: $win.width(),
                height: $win.height()
            };
        },

        // body size
        getBdSize: function () {
            return {
                width: $bd.width(),
                height: $bd.height()
            };
        },

        // html size
        getDocSize: function () {
            return {
                width: $doc.width(),
                height: $doc.height()
            };
        },

        // scroll size
        getScrollSize: function () {
            return {
                left: document.body.scrollLeft || document.documentElement.scrollLeft,
                top: document.body.scrollTop || document.documentElement.scrollTop
            };
        },

        // 加密部分进行了重写优化
        // get query parameters of url
        // getUrlParams: function (prop) {
        //     var params = {},
        //         query = win.location.search.substring(1),
        //         arr = query.split('&'),
        //         rt;
        //     if (!query) {
        //         return prop ? undefined : {};
        //     }

        //     $.each(arr, function (i, item) {
        //         var tmp = item.split('='),
        //             key = tmp[0],
        //             val = tmp[1];

        //         if (typeof params[key] == 'undefined') {
        //             params[key] = val;
        //         } else if (typeof params[key] == 'string') {
        //             params[key] = [params[key], val];
        //         } else {
        //             params[key].push(val);
        //         }
        //     });

        //     rt = prop ? params[prop] : params;

        //     return rt;
        // },

        getZIndex: function () {
            // var curr = zIndex;
            // zIndex = curr + 2;
            // return curr;
            return mini.getMaxZIndex();
        },

        // generate random widget id
        uuid: function (len, radix) {
            var chars = CHARS,
                uuid = [],
                i;
            radix = radix || chars.length;

            if (len) {
                for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
            } else {
                var r;

                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';

                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random() * 16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }

            return uuid.join('');
        },

        // modal dialog cover
        // 用于F8中的EpDialog、TipDialog打开的蒙版
        getModalCover: function (prefix) {
            var $cover = $('<div></div>', {
                'id': prefix + '-cover'
            }).addClass('modal-dialog-cover hidden');

            // 此iframe用于覆盖activeX
            if (hasObjectTag) {
                var iframe = document.createElement('iframe');
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.scrolling = 'no';
                iframe.frameBorder = 0;
                iframe.src = 'about:blank';

                $(iframe).appendTo($cover);
            }

            return $cover;
        },

        // 返回完整的WebContent根路径
        getRootPath: function () {
            var loc = window.Util.getSafeLocation(),
                host = loc.hostname,
                protocol = loc.protocol,
                port = loc.port ? (':' + loc.port) : '',
                path = (_rootPath !== undefined ? _rootPath : ('/' + loc.pathname.split('/')[1])) + '/';

            var rootPath = protocol + '//' + host + port + path;

            return rootPath;
        },
        /**
         * 获取 Url 上的 hash
         *
         * @param {string} url url值
         * @returns hash
         */
        getHash: function (url) {
            var idx = (url || location.href).indexOf('#');
            return idx === -1 ? '' : url.substr(idx);
        },
        /**
         * 移除 url 上的hash
         *
         * @param {string} url url值
         * @returns 移除 hash 后的 url值
         */
        removeHash: function (url) {
            var idx = url.indexOf('#');
            return idx === -1 ? url : url.substring(0, idx);
        },
        // 返回适合的url
        // 1.url为全路径，则返回自身
        // 2.url为，则返回自身
        // 3.url为WebContent开始的路径，则补全为完整的路径
        getRightUrl: function (url, noEncrypt) {
            if (!url) return '';

            var curUrl = Util.removeHash(Util.getSafeLocation().href),
                queryIndex = curUrl.indexOf('?');

            // 截取url参数前的路径
            if (queryIndex != -1) {
                curUrl = curUrl.substr(0, queryIndex);
            }

            // 是否是相对路径
            var isRelative = url.indexOf('./') != -1 || url.indexOf('../') != -1;

            // 全路径、相对路径直接返回
            if (/^(http|https|ftp|data:)/g.test(url)) {
                // url = url;

                // 相对路径
            } else if (isRelative) {
                url = curUrl.substr(0, curUrl.lastIndexOf('/') + 1) + url;

                // WebContent开始路径
            } else {
                // 去除最前面的 '/' ，避免拼出来后变成两个 '//'
                if (url.substring(0, 1) === '/') {
                    url = url.substring(1);
                }
                url = Util.getRootPath() + url;
            }

            // 如果不需要加密
            if (noEncrypt) {
                return url;
            }

            return Util.encryptUrlParams ? Util.encryptUrlParams(url) : url;
        },

        // browser detect
        browsers: {
            isIE67: '\v' == 'v',
            isIE8: !!document.all && document.querySelector && !document.addEventListener,
            isIE9: !!document.all && document.addEventListener && !window.atob,
            isIE10: !!document.all && window.atob,
            isIE11: '-ms-scroll-limit' in document.documentElement.style && '-ms-ime-align' in document.documentElement.style,
            // IE6~11
            isIE: ((!!document.all && document.compatMode) || ('-ms-scroll-limit' in document.documentElement.style && '-ms-ime-align' in document.documentElement.style)),
            isWebkit: 'WebkitAppearance' in document.documentElement.style,
            isFirefox: !!navigator.userAgent.match(/firefox/i),
            isEdge: /Edge\/([\d.]+)/.test(navigator.userAgent)
        },

        toInt: function (val) {
            var r = parseInt(val, 10);
            return r ? r : 0;
        },

        openSelfWin: function (url) {
            // win.location = url;
            win.Util.getSafeLocation().setHref(url);
        },

        // 记录已经加载过的js，以避免多次加载
        _loadedJs: {},
        // 动态加载js
        loadJs: function (url, callback) {
            if (this._loadedJs[url]) {
                if (!this._loadedJs[url].callbacks) {
                    this._loadedJs[url].callbacks = [];
                }
                this._loadedJs[url].callbacks.push(callback);
                return;
            }

            var script = document.createElement('script');
            script.type = 'text/javascript';

            // IE8-
            if (script.readyState) {
                script.onreadystatechange = function () {
                    if (script.readyState == 'loaded' || script.readyState == 'complete') {

                        script.onreadystatechange = null;
                        executeCallback();
                    }
                };
                // w3c
            } else {
                script.onload = function () {
                    executeCallback();
                    script.onload = null;
                };
            }

            function executeCallback() {
                var callbacks = Util._loadedJs[url].callbacks;
                if (callbacks) {
                    for (var i = 0, l = callbacks.length; i < l; i++) {
                        callbacks[i]();
                    }
                    Util._loadedJs[url].callbacks = undefined;
                }
            }

            this._loadedJs[url] = {};
            if (callback) {
                this._loadedJs[url].callbacks = [callback];
            }

            script.src = win.SrcBoot ? SrcBoot.handleResPath(url) : Util.getRightUrl(url);
            // append to head
            document.getElementsByTagName('head')[0].appendChild(script);
        },

        // 页面预留的 懒加载的 style 标签
        _lazyLoadStyle: document.getElementById('lazy-load-style'),

        /**
         * 动态加载css
         *
         * @param {String} url css 路径 webapp目录开始写起的全路径或相对路径
         * @param {String/HTMLElement/jQueryObject} target 插入判断的位置元素
         * @param {String} pos 相对目标元素的前后位置 可选值 ['Before', 'After']
         * @param {Boolean} importToStyle 是否以@import的形式插入 占位的懒加载元素中 仅在IE下且 存在占位元素才有效
         * @returns
         */
        loadCss: function (url, target, pos, importToStyle) {
            if (importToStyle === undefined) importToStyle = true;
            if (Util.browsers.isIE && importToStyle && this._lazyLoadStyle) {
                var addExtraStyle = '@import "' + (win.SrcBoot ? SrcBoot.handleResPath(url) : Util.getRightUrl(url)) + '";';
                if ('styleSheet' in this._lazyLoadStyle) {
                    return this._lazyLoadStyle.styleSheet.cssText += addExtraStyle;
                }
                return $(this._lazyLoadStyle).text($(this._lazyLoadStyle).text() + addExtraStyle);
            }
            var $link = $('<link/>', {
                href: win.SrcBoot ? SrcBoot.handleResPath(url) : Util.getRightUrl(url),
                rel: 'stylesheet',
                type: 'text/css'
            });

            if (!target || !$(target).length) {
                target = document.getElementsByTagName('head')[0];
                $link.appendTo(target);
            } else {
                if (!pos) pos = 'After';
                $link['insert' + pos](target);
            }
        },

        // 动态加载模板页面功能模块
        loadPageModule: function (path) {
            $.ajax({
                type: 'POST',
                dataType: 'html',
                url: win.SrcBoot ? SrcBoot.handleResPath(path.templ) : this.getRightUrl(path.templ),
                data: {},
                beforeSend: function (XMLHttpRequest) {
                    path.css && Util.loadCss(path.css, document.getElementById('common-skin'), 'Before', true);
                    $.ajaxSettings.beforeSend(XMLHttpRequest);
                },
                success: function (html) {
                    $(html).appendTo('body');

                    path.js && Util.loadJs(path.js, function () {
                        if (path.callback) {
                            path.callback();
                        }
                    });
                }
            });
        },

        // 去除html标签中的换行符和空格
        clearHtml: function (html) {
            return html.replace(/(\r\n|\n|\r)/g, '')
                .replace(/[\t ]+</g, '<')
                .replace(/>[\t ]+</g, '><')
                .replace(/>[\t ]+$/g, '>');
        },

        _ajaxErr: function (jqXHR, textStatus, errorThrown) {
            console.error('status: %s, error: %s', textStatus, errorThrown);
            console.error('%c后台返回的数据：' + jqXHR.responseText, 'font-size: 16px;');

            // 由于安全模块拦截返回的的http code 是不确定的，所以把安全模块错误信息的处理移到了这边
            var data = jqXHR.responseJSON;

            if (data && data.status && data.status.text) {
                mini.showMessageBox({
                    title: '错误提示',
                    buttons: ['ok'],
                    message: data.status.text,
                    iconCls: 'mini-messagebox-error'
                });
            }
        },
        //处理statusCode
        _handleStatusCode: function (xhr) {
            var showMessage = function (xhr, msg) {
                var data = xhr.responseJSON,
                    error = msg,
                    stack = null;

                if (data) {
                    error = data.error;
                    stack = data.stackError;
                }

                // 先把loading效果去掉,不然弹出框会被loading层遮住
                // page loading 的层级已调低，不再需要隐藏
                // Util.hidePageLoading();
                if (error) {

                    if (!stack) {
                        mini.showMessageBox({
                            title: '错误提示',
                            buttons: ['ok'],
                            message: error,
                            iconCls: 'mini-messagebox-error'
                        });
                    } else {

                        mini.showMessageBox({
                            title: '错误提示',
                            buttons: ['ok'],
                            iconCls: 'mini-messagebox-error',
                            message: error + '<a class="messagebox-error-detail" href="javascript:;">详情…</a>'
                        });

                        $('body').on('click', '.messagebox-error-detail', function () {
                            var _zIndex = Util.getZIndex();

                            var detailStr = '<div id="message-dialog-detail" style="display:none;padding: 0 20px; position: fixed;width: 80%;left:10%;top: 5%;height: 90%;z-index:' + _zIndex + ';background-color:#fff;border:1px solid #ccc;"><div class="messagebox-close-btn" style="width: 20px;height:20px;position:absolute;right: -10px;top: -10px;border-radius:50%;background-color:rgba(0,0,0,.7);color:#fff;line-height: 18px;text-align:center;cursor:pointer;">&times;</div><div style="width:100%;height:100%;overflow-y:auto;">' + stack + '</div></div>';
                            $('#message-dialog-detail').remove();
                            $('body').append(detailStr);
                            $('#message-dialog-detail').show();
                        }).on('click', '.messagebox-close-btn', function () {
                            $('#message-dialog-detail').remove();
                        });

                    }
                }
            };

            return {
                //安全框架拦截
                400: function (xhr) {
                    showMessage(xhr);
                },
                //未登录的权限拦截
                401: function (xhr) {
                    var data = xhr.responseJSON,
                        url = '';

                    // 如果返回数据中带了url，则表示不需要弹出快捷登录（可能登录逻辑是个性化的，快捷登录无效），直接跳转到返回的 url 页面
                    if (data && (url = data.url)) {
                        if (url.indexOf('http') !== 0) {
                            url = Util.getRootPath() + url;
                        }
                        if (top.Util && top.Util.getSafeLocation) {
                            top.Util.getSafeLocation().setHref(url);
                        } else {
                            top.location.href = url;
                        }
                        return;
                    }

                    //弹出小登录框
                    //win.location.href = _rootPath + '/index.html';
                    if (top.window.quickLogin !== undefined) {
                        top.quickLogin.show();
                    } else {
                        top.Util.loadPageModule({
                            templ: 'frame/fui/js/widgets/quicklogin/quicklogin.tpl',
                            css: 'frame/fui/js/widgets/quicklogin/quicklogin.min.css',
                            js: 'frame/fui/js/widgets/quicklogin/quicklogin.js',
                            callback: function () {
                                top.quickLogin.show();
                            }
                        });
                    }
                },
                //功能权限拦截
                403: function (xhr) {
                    showMessage(xhr);
                },
                //404拦截
                404: function (xhr) {
                    showMessage(xhr, '请求地址错误，请联系管理员');
                },
                //报错类拦截
                500: function (xhr) {
                    showMessage(xhr);
                },
                // 用于被安全模块拦截后返回503的处理
                503: function (xhr) {
                    showMessage(xhr, '服务不可用');
                }

            };
        },
        // 简单封装ajax
        ajax: function (options) {
            // add主界面要自动带上themeid
            var themeMatch = Util.getSafeLocation().href.match(/^https?:\/\/.*\/fui\/pages\/themes\/(\w+)\/\1/i),
                themeId = themeMatch && themeMatch[1];

            var viewData = mini.get('_common_hidden_viewdata');

            options = $.extend({}, {
                type: 'POST',
                dataType: 'json',
                error: Util._ajaxErr,
                statusCode: Util._handleStatusCode()
            }, options);

            options.data = options.data || {};

            // 如果是主界面 data中加上themeId
            if (themeId) {
                options.data = $.extend({
                    themeId: themeId,
                    pageId: Util.getUrlParams('pageId') || themeId
                }, options.data);
                
            }
            // 自动带上通用隐藏域，实现重放攻击防御
            if(!options.data.commonDto && viewData) {
                options.data.commonDto = mini.encode([{
                    id: "_common_hidden_viewdata",
                    type: "hidden",
                    value: viewData.getValue()
                }]);
            }
            
            // 自动携带当前页面的url参数过去
            options.data = $.extend(Util.getUrlParams(), options.data);
            // 如果需要加密 替换为加密格式
            if (!options.noEncryption) {
                options.data = Util.encryptAjaxParams(options.url, options.data);
            }
            options.url = Util.getRightUrl(options.url, options.noEncryption);
            // success 触发太早，防止对业务的影响 先去掉
            var okCb = options.success;
            if (okCb) {
                options.success = null;
                delete options.success;
            }
            var _jqXhr = $.ajax(options);

            var _ajax = _jqXhr.then(function (data) {
                if(data[Util.BODY_ENCRYPT_PARAM_NAME]) {
                    data = Util.decrypt(data[Util.BODY_ENCRYPT_PARAM_NAME]);

                    data = mini.decode(data);
                }
                var status = data.status,
                    controls = data.controls,
                    viewData;

                // 添加对通用隐藏域的处理
                // 解决快捷登录在主界面中需要获取通用隐藏域中存放的当前用户的loginid，实现快捷登录用其他账户登录时要刷新页面的需求
                if (controls && controls.length) {
                    viewData = controls[controls.length - 1];
                    if (viewData.id === '_common_hidden_viewdata') {
                        Util.setCommonViewData(viewData.value);
                    }
                }
                data = data.custom == undefined ? data : data.custom;
                if (data && (typeof data !== 'object') && options.dataType.toLowerCase() === 'json') {
                    data = JSON.parse(data);
                }

                if (status) {

                    var code = parseInt(status.code),
                        text = status.text || '',
                        url = status.url,
                        tipTxt = (code === 1 || code === 200) ? '成功' : '失败',
                        tipType = (code === 1 || code === 200) ? 'success' : 'danger';


                    if (url) {
                        if (url.indexOf('http') !== 0) {
                            url = Util.getRootPath() + url;
                        }
                        var aimWindow = status.top ? top : window;
                        if (aimWindow.Util && aimWindow.Util.getSafeLocation) {
                            aimWindow.Util.getSafeLocation().setHref(url);
                        } else {
                            aimWindow.location.href = url;
                        }
                        return;
                    }
                    if (text) {
                        mini.showTips({
                            content: "<b>" + tipTxt + "</b> <br/>" + text,
                            state: tipType,
                            x: 'center',
                            y: 'top',
                            timeout: 3000
                        });
                    }


                    // 处理成功回调
                    if (code === 1 || code === 200) {
                        if (okCb) {
                            okCb.apply(this, [data, arguments[1], arguments[2]]);
                        }
                    } else {
                        if (options.fail) {
                            options.fail.call(this, text, status);
                        }
                    }
                } else {
                    // 没有status 表示不符合规范，也需要执行sussess
                    okCb && okCb.apply(this, [data, arguments[1], arguments[2]]);
                }
                return data;
            });

            // then 返回的是新规范的promise 没有以下内容 兼容处理一下
            _ajax.success = _ajax.done;
            _ajax.error = _ajax.fail;
            _ajax.complete = _ajax.always;
            _ajax.abort = _jqXhr.abort;
            return _ajax;
        },

        // 释放iframe所占内存，并从dom树中移除
        clearIframe: function ($iframe) {
            var iframe = $iframe[0];

            iframe.src = 'about:blank';

            // 跨域时无法获取iframe的contentWindow
            try {
                iframe.contentWindow.document.write('');
                iframe.contentWindow.document.close();
            } catch (e) {}

            // 移除iframe
            try {
                iframe.parentNode.removeChild(iframe);
            } catch (e) {
                $iframe.remove();
            }
        },

        // empty function
        noop: function () {},

        // 调整content区域表格的布局
        _layoutDatagridInContent: function () {
            var grid = mini.get('datagrid');

            if (grid && grid.doLayout) {
                grid.doLayout();
            }
        },

        // 分时分批处理
        timeChunk: function (arr, fn, count, interval, callback) {
            var obj,
                t;

            var start = function () {
                var i = 0;
                for (; i < Math.min(count || 1, arr.length); i++) {
                    obj = arr.shift();
                    fn(obj);
                }
            };

            return function () {
                t = setInterval(function () {
                    if (!arr.length) {
                        clearInterval(t);

                        if (callback) {
                            callback();
                        }
                    }

                    start();
                }, interval || 100);
            };
        },

        // Force IE8 to redraw :before/:after pseudo elements
        redrawPseudoEl: function (el) {
            if (this.browsers.isIE8) {
                var $el = $(el);

                $el.addClass('content-empty');

                setTimeout(function () {
                    $el.removeClass('content-empty');
                }, 0);
            }
        },

        // get module properties from dom
        // for classicframe
        getModuleProps: function (el) {
            var data = {
                url: $.trim(el.getAttribute('modurl')),
                name: el.getAttribute('modname'),
                code: el.getAttribute('modcode'),
                isBlank: el.getAttribute('isblank') === 'true'
            };

            return data;
        },
        // 自定义事件
        UserEvent: UserEvent,
        // 框架更新了参数配置页面，重新对系统参数进行了规划，调整了参数名，考虑到对以前代码的兼容，需维护一个新老名字的映射关系
        _sysParamNameMapping: {
            fileSizeLimit: "file_limit_size",
            fileLimitType: "file_limit_type",
            uploadPreviewUrl: "upload_preview_url",
            uploadPreviewText: "upload_preview_text",
            enableCustomSort: "ui_customsort_enable",
            noUseTabsNav: "ui_use_tabsnav",
            gridPageSize: "ui_grid_pagesize",
            fileNameLengthLimit: "attach_filename_limitlength",
            gridAllowUnselect: "grid_allow_unselect",
            adjustGridPageSize: "grid_adjust_pagesize",
            editorModel: "editor_model",
            alertToTips: "alert_to_tips",
            messageSound: "message_sound"
        },
        // 获取框架系统参数的值
        // 使用前提：页面jsboot.js的引用路径为后端返回系统参数的动态接口地址     
        getFrameSysParam: function (name) {
            if (!win.EpFrameSysParams) {
                return;
            }

            if (win.EpFrameSysParams[name] === undefined) {
                name = Util._sysParamNameMapping[name];
                return name === 'ui_use_tabsnav' ? !win.EpFrameSysParams[name] : win.EpFrameSysParams[name];
            }

            return win.EpFrameSysParams[name];

            // return win.EpFrameSysParams ? EpFrameSysParams[name] : undefined;
        },

        getThemeName: function () {
            return Util.readCookie('_theme_');
        },

        getSkinName: function () {
            var themeName = this.getThemeName();

            return Util.readCookie('_' + themeName + '_skin_') || 'default';
        },
        // 查找第一个可滚动的父元素
        getFirstScrollEl: function (obj) {
            if (obj.scrollHeight > obj.clientHeight) {
                return obj;
            }

            if (obj.parentElement) {
                return this.getFirstScrollEl(obj.parentElement);
            }

            return null;
        },

        // Windows没有完整地支持IPv6，在UNC路径中，需使用破折号代替冒号，并在地址的末尾 加上.ipv6-literal.net后缀
        // 用于处理websocket地址
        getRightIPv6Url: function (url) {
            var location = Util.getSafeLocation(),
                hostname = location.hostname;
            // 判断是否是ipv6地址
            // 当前判断还不够精确，需优化
            if (Util.browsers.isIE && /:/.test(hostname)) {
                // 是否是相对路径
                var isRelative = url.indexOf('./') != -1 || url.indexOf('../') != -1;
                var curUrl = location.protocol + "//" + hostname.replace(/:/g, "-").replace(/%/g, "s").replace(/\[/g, '').replace(/\]/g, '') + ".ipv6-literal.net" + (location.port ? ':' + location.port : '');
                // 全路径、相对路径直接返回
                if (/^(http|https|ftp|data:)/g.test(url)) {
                    // url = url;

                    // 相对路径
                } else if (isRelative) {
                    url = curUrl + location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1) + url;

                    // WebContent开始路径
                } else {
                    // 去除最前面的 '/' ，避免拼出来后变成两个 '//'
                    if (url.substring(0, 1) === '/') {
                        url = url.substring(1);
                    }
                    url = curUrl + (_rootPath !== undefined ? _rootPath : ('/' + location.pathname.split('/')[1])) + '/' + url;
                }

                return url;
            }

            return Util.getRightUrl(url);
        },
        /**
         * 获取目标的类型
         * @param {any} obj 要获取类型的任意内容
         * @returns {String} 目标的类型 如 string 、boolean、number、array、function等
         */
        _getType: function (obj) {
            return $.type(obj);
        },
        setCommonViewData: function (value) {
            var viewData = mini.get('_common_hidden_viewdata');
            if (!viewData) {
                viewData = new mini.Hidden();
                viewData.setId('_common_hidden_viewdata');
                viewData.render(document.body);
            }
            viewData.setValue(value);
        },
        /**
         * 缓存页面数据
         * @param {String/Object} data 要保存的数据
         * @param {String} key 数据保存到的字段名称，不传默认为当前页面的路径
         */
        cachePageData: function (data, key) {
            key = key || window.location.pathname;
            if (typeof data === 'object') {
                data = JSON.stringify(data);
            }

            localStorage.setItem(key, data);
        },
        /**
         * 获取页面缓存数据
         * @param {String} key 要获取的数据字段名称，不传默认为当前页面的路径
         */
        getPageData: function (key) {
            key = key || window.location.pathname;
            var data = localStorage.getItem(key);

            try {
                data = JSON.parse(data);
            } catch (e) {}

            return data;
        },
        /**
         * 清除页面缓存数据
         * @param {String/Boolen} key 要清除的数据字段名称，不传默认为当前页面的路径。当传 true 时，表示清空当前域名下的所有缓存数据。
         */
        clearPageData: function (key) {
            if (key === true) {
                localStorage.clear();
            } else {
                key = key || window.location.pathname;

                localStorage.removeItem(key);
            }

        },
        /**
         * rsa加密
         */
        encryptRSA: function (str, publicExponent, modulus) {

            if (!publicExponent) {
                publicExponent = Util.getFrameSysParam('rsa_publicExponent');

                if (!publicExponent) {
                    throw new Error('the second param [publicExponent] can not be empty');
                }
                publicExponent = publicExponent.substring(1);
            }

            modulus = modulus || Util.getFrameSysParam('rsa_modulus');
            if (!modulus) {
                throw new Error('the third param [modulus] can not be empty');
            }

            var rsaKey = RSAUtils.getKeyPair(publicExponent, "", modulus);
            str = RSAUtils.encryptedString(rsaKey, str);
            return str;
        },

        /**
         * sm2加密
         */
        encryptSM2: function (str, sm2PubKey) {
            sm2PubKey = sm2PubKey || Util.getFrameSysParam('security_sm2encode_pubk');
            if (!sm2PubKey) {
                throw new Error('the second param [sm2PubKey] can not be empty');
            }

            str = sm2Encrypt(str, sm2PubKey, 0);
            return str;
        }
    });
    // 动画支持检测和动画时间名称
    function testAnimate() {
        var el = document.createElement('div');
        var isSupportTransition = false;
        var isSupportAnimation = false;
        var transitionend = null;
        var animationend = null,
            animationiteration = null,
            animationstart = null;

        // transition 
        // transition 标准事件只有结束的end， firefox下还有开始、运行中、取消等，但非标准，此处不处理
        if ('transition' in el.style) {
            isSupportTransition = true;
            transitionend = 'transitionend';
        } else if ('-webkit-transition' in el.style) {
            isSupportTransition = true;
            transitionend = 'webkitTransitionEnd';
        } else if ('-moz-transition' in el.style) {
            isSupportTransition = true;
            transitionend = 'mozTransitionEnd';
        } else if ('-o-transition' in el.style) {
            isSupportTransition = true;
            transitionend = 'oTransitionEnd';
        }

        // animation
        // animation 标准事件有 开始、运行中、结束， firefox下还有取消，但非标准，此处不处理
        if (('animation' in el.style) || ('-moz-animation' in el.style)) {
            isSupportAnimation = true;
            animationend = 'animationend';
            animationiteration = 'animationiteration';
            animationstart = 'animationstart';
        } else if ('-webkit-animation' in el.style) {
            isSupportAnimation = true;
            animationend = 'webkitAnimationEnd';
            animationiteration = 'webkitAnimationIteration';
            animationstart = 'webkitAnimationStart';
        }
        el = null;
        return {
            isSupportTransition: isSupportTransition,
            isSupportAnimation: isSupportAnimation,
            animationend: animationend,
            animationiteration: animationiteration,
            animationstart: animationstart,
            transitionend: transitionend
        };
    }
    $.extend(Util.browsers, testAnimate());

    // edge 常常需要和IE相同的处理 也需要进行标记
    if (Util.browsers.isEdge) {
        $('body').addClass('edge');
    }


    // 用于F8框架，套用jsf模板的页面
    // iframe scrolling为no的情况下, 框架页面可以正常出现滚动条
    // 以后可能会删除
    Util.fixIframeNoScroll = function () {
        $('body').add('html').css({
            height: '100%',
            overflow: 'hidden'
        });

        $('form:eq(0)').css({
            height: '100%',
            overflow: 'auto'
        });
    };
    Util._fixIframeNoScroll = Util.fixIframeNoScroll;


    // 别名，适配代码中可能存在的老用法
    Util._clearIframe = Util.clearIframe;
    Util._loadPageModule = Util.loadPageModule;

    // getRightUrl的别名，参考.net的方法名
    Util.getAbsoluteUrl = Util.getRightUrl;
}(this, jQuery));


// 皮肤切换
(function (win, $) {
    var skinSwitcher = {
        updateSkin: function (skin) {
            $('[name="fui-ui-style"]').prop('disabled', true).filter('[data-name="' + skin + '"]').prop('disabled', false);
            $('[name="fui-theme-style"]').prop('disabled', true).filter('[data-name="' + skin + '"]').prop('disabled', false);
        },
        postToChild: function (skin, hasSelf) {

            var iframes = document.getElementsByTagName('iframe');
            var that = this;
            if (hasSelf) {
                setTimeout(function () {
                    that._postMessage(win, skin);
                });
            }
            try {
                $.each(iframes, function (i, ifr) {
                    setTimeout(function () {
                        that._postMessage(ifr.contentWindow, skin);
                    });
                });
            } catch (error) {
                console.error(error);
                iframes = null;
            }
            iframes = null;
        },
        _postMessage: function (aimWin, skin) {
            aimWin.postMessage(JSON.stringify({
                type: 'skinChange',
                skin: skin
            }), '*');
        },
        init: function () {
            var that = this;
            $(win).on('message', function (event) {
                event = event.originalEvent;
                if (!event.data) return;
                try {
                    var data = JSON.parse(event.data);
                    if (data.type == 'skinChange' && data.skin) {
                        that.updateSkin(data.skin);
                        that.postToChild(data.skin);
                    }
                } catch (error) {
                    console.error(error);
                }
            });
        }
    };
    skinSwitcher.init();
    Util.skinSwitcher = skinSwitcher;

}(this, jQuery));

// 字体大小切换
(function (win, $) {
    var htmlBase = win.HtmlBaseFontSize || 100;
    var bodyBase = win.BodyBaseFontSzie || 13;

    function calcFontSize(base, ratio) {
        return (base * ratio).toFixed(6) + 'px';
    }
    var fontSizeSwitcher = {
        doUpdateFontSize: function (ratio) {
            if (!ratio || isNaN(parseFloat(ratio, 10))) {
                return;
            }
            document.documentElement.style.fontSize = calcFontSize(htmlBase, ratio);
            document.body.style.fontSize = calcFontSize(bodyBase, ratio);
            setTimeout(function () {
                $(win).trigger('resize');
            }, 200);
        },
        updateFontSize: function (ratio) {
            this.doUpdateFontSize(ratio);
            this.postToChild(
                JSON.stringify({
                    ratio: ratio,
                    type: 'fontSizeChange'
                })
            );
        },
        postToChild: function (data) {
            [].slice.call(document.getElementsByTagName('iframe')).forEach(function (ifr) {
                ifr.contentWindow.postMessage(data, '*');
            });
        },
        saveFontSizeRatio: function (ratio) {
            ratio = parseFloat(ratio, 10);
            if (!ratio || isNaN(ratio)) {
                return;
            }
            Util.writeCookie('_font_size_ratio_', ratio, {
                expires: 365,
                path: window._rootPath ? window._rootPath : '/'
            });
            this.updateFontSize(ratio);
        },
        init: function () {
            var that = this;
            win.addEventListener('message', function (ev) {
                var data = ev.data;
                try {
                    if (data + '' === data) {
                        data = JSON.parse(data);
                    }
                    if (data.type == 'fontSizeChange') {
                        that.updateFontSize(data);
                    }
                } catch (error) {}
            });
        }
    };

    win.addEventListener && fontSizeSwitcher.init();
    win.Util.fontSizeSwitcher = fontSizeSwitcher;
})(this, jQuery);
/*!
 * 左右布局
 */
(function (win, $) {
    var $left = $('.fui-left'),
        $right = $('.fui-right');

    var getTitleHtml = function (title) {
        return title ? ('<h4 class="fui-left-title">' + title + '</h4>') : '';
    };

    var toggleHtml = '<i class="fui-left-toggle"></i>';

    var parse = function () {
        var $hd = $left.find('> [role="head"]'),
            title = $hd.attr('title');

        var $bd = $left.find('> [role="body"]');

        // head和body都没有时说明已解析过
        if ($hd.length || $bd.length) {
            $left.append(toggleHtml);

            if ($hd.length) {
                $hd.addClass('fui-left-hd')
                    .append(getTitleHtml(title))
                    // 清理role，防止重复parse
                    .removeAttr('role');
            }

            if ($bd.length) {
                $bd.addClass('fui-left-bd')
                    // 清理role，防止重复parse
                    .removeAttr('role');
            }

            initEvent();
        }


    };

    var initEvent = function () {
        $left.on('click', '.fui-left-toggle', function () {
            var closed = $left.hasClass('closed');

            $left.toggleClass('closed', !closed);

            if (Util.browsers.isIE8) {
                $right.toggleClass('expanded', !closed);
            }

            // 左侧面板显|隐后，调整content区域表格布局
            Util._layoutDatagridInContent();
            
            // 兼容之前不好的API规范
            if(!Util.leftRight.onToggle) {
                Util.leftRight.onToggle = Util.onLeftRightResize;
            }
            if(Util.leftRight.onToggle) {
                Util.leftRight.onToggle();
            }
        });
    };

    Util.leftRight = Util.leftRight || {};

    // 左右布局解析，供外部调用
    // 一般待html结构条件满足后，手动调用解析
    win.parseLeftRightLayout = function () {
        $left = $('.fui-left');
        $right = $('.fui-right');

        parse();
    };

    if (!$left.length || !$right.length) return;

    parse();

}(this, jQuery));

/*!
 * 解析表单布局
 */
(function (win, $) {
    var $forms = $('.fui-form');

    if (!$forms.length) return;

    var isVertical = $forms.data('vertical');

    if(isVertical) {
        $forms.addClass('vertical');
    }

    var getLblHtml = function (label, required) {
        var html = [];

        // 如果label为空，则不需要冒号了
        if (label !== '') {
            label += ':';
        }

        html.push('<label class="form-label');
        if (required) html.push(' required');
        html.push('">' + label + '</label>');

        return html.join('');
    };

    // 解析表单行
    var parseRow = function ($row) {
        var $controls = $row.find('[role="control"]'),
            // 2列 = label + control
            cols = $controls.length * 2,
            newsection = $row.data('newsection');

        $row.addClass('form-row');

        if(newsection) {
            $row.addClass('newsection');
        }

        for (var i = 0, len = $controls.length; i < len; i++) {
            parseControl($controls.eq(i), cols);
        }
    };

    // 解析控件容器
    var parseControl = function ($control, cols) {
        // 不用jquery attr，算是稍微提高点效率
        var required = $control[0].getAttribute('starred') === 'true',
            label = $control[0].getAttribute('label');

        // 生成label html，label可以不配置
        var lblhtml = getLblHtml(label ? label : '', required);

        // 根据列配置，决定组件容器的跨度
        var span = 0;

        if (cols == 2) {
            span = 5;
        } else if (cols == 4) {
            span = 2;
        } else if (cols == 6) {
            span = 1;
        }

        if(isVertical){
            span++;
            $control.addClass('form-control')
            .addClass('span' + span)
            .prepend(lblhtml)
            // 清理role，防止重复parse
            .removeAttr('role');
        } else {
            $control.addClass('form-control')
            .addClass('span' + span)
            .before(lblhtml)
            // 清理role，防止重复parse
            .removeAttr('role');
        }

        
    };

    var parse = function ($form) {
        $form = $form || $forms;

        var $inners = $form.find('[role="form"]'),
            $rows = $form.find('[role="row"]');

        // 先hidden需要解析的forms
        $form.addClass('hidden');

        $inners.addClass('form-inner');

        for (var i = 0, len = $rows.length; i < len; i++) {
            parseRow($rows.eq(i));
        }

        // 清理role，防止重复parse
        $inners.removeAttr('role');
        $rows.removeAttr('role');

        // 解析结束，显示forms
        $form.removeClass('hidden');
    };

    Util.form = {
        parse: function ($form) {
            if (!$form.length) {
                return;
            }
            return parse($form);
        },
        // 根据指定div[role="control"]隐藏表单域
        showField: function (id) {
            var $control = $(id),
                $label = $control.prev(),
                control = getControl($control[0]);

            $control.add($label).removeClass('invisible');

            // 显示时需要将隐藏时的禁用操作还原回来
            if (control && control.originEnabled) {
                control.setEnabled(true);
            }
        },

        // 根据指定div[role="control"]显示表单域
        hideField: function (id) {
            var $control = $(id),
                $label = $control.prev(),
                control = getControl($control[0]);

            $control.add($label).addClass('invisible');

            // mini对于invisible的元素还是会进行验证
            // 为了跳过于invisible的元素验证，需将其禁用
            if (control && control.enabled) {
                control.setEnabled(false);
                control.originEnabled = true;
            }

        },

        // 设置控件前面的label
        setLabel: function (id, label) {
            var $control = $(id),
                $label = $control.prev();

            if (label) {
                label += "：";
            }

            $label.text(label);
        }
    };

    var getControl = function (el) {
        var control = mini.getChildControls(el);

        return control[0];
    };

    parse();

}(this, jQuery));
/*!
 * contentpage结构content区域计算
 */
(function (win, $) {
    var $toolbar = $('.fui-toolbar'),
        $condition = $('.fui-condition'),
        $notice = $('.fui-notice'),
        $content = $('.fui-content'),
        $toolbarbottom = $('.fui-toolbar-bottom');

    win.adjustContentHeight = Util.noop;

    if (!$content.length) return;

    // // toolbar可以配置为在底部显示
    // if ($toolbar.data('position') == "bottom") {
    //     $toolbar.addClass('bottom');

    //     $toolbar.parent().append($toolbar.remove());
    // }

    var getHeight = function ($el) {
        var h = 0;

        if ($el.length && !$el.hasClass('hidden') && $el.css('position') != 'absolute') {
            h = $el.outerHeight();
        }
        return h;
    };

    var _adjustHeight = function () {
        var win_h = $(win).height(),

            toolbar_h = getHeight($toolbar),
            condition_h = getHeight($condition),
            notice_h = getHeight($notice),
            toolbarbottom_h = getHeight($toolbarbottom);

        $content.css('height' ,win_h - toolbar_h - condition_h - notice_h - toolbarbottom_h);

        // content区域高度调整后，调整表格布局
        Util._layoutDatagridInContent();
    };

    var timer = 0;

    var adjustHeight = function () {
        timer && clearTimeout(timer);

        timer = setTimeout(_adjustHeight, 50);
    };

    $(win).on('resize.contentPage', adjustHeight);

    win.adjustContentHeight = _adjustHeight;

    $(_adjustHeight);

}(this, jQuery));
/*!
 * contentpage条件区域condition交互与视图解析
 */
(function (win, $) {
    var $condition = $('.fui-condition');

    if (!$condition.length) return;

    var btnHtml = [];
    // 搜索按钮
    // win.epoint_search_text 用来支撑国际化，暂时配置在miniui的local文件里
    btnHtml.push('<span class="cond-srh-btn-text l">' + (win.epoint_search_text || '搜索') + '</span>');
    // 展开更多条件
    btnHtml.push('<i class="cond-srh-btn-toggle l" title="' + (win.epoint_search_title || '展开更多条件') + '"></i>');

    // var autoHeightFix = function () {
    //     var fixed = $condition.data('fixed');

    //     if (!fixed) {
    //         $condition.css({
    //             height: 'auto',
    //             overflow: 'auto'
    //         }).data('fixed', true);
    //     }
    // };

    var init = function () {
        var $form = $condition.find('.fui-form');

        // 没有查询条件，不予处理
        if (!$form.length) return;

        var $btn = $condition.find('[role="searcher"]'),
            // 搜索回调
            cbName = $btn.attr('callback');

        var $rows = $form.find('.form-row'),
            // 搜索条件行数
            line = $rows.length,
            isMultiLine = (line > 1);

        var $no1stRows = null;

        var toggleCondition = function (opened) {
             // 为解决第一行中放多行checkboxlist控件下面行被遮住问题，初始既是自适应，不用再调整
            // 恢复condition的高度自适应，以便显示更多条件
            // autoHeightFix();

            $no1stRows.toggleClass('hidden', opened);
            $btn.length && $btn.toggleClass('opened', !opened);

            adjustContentHeight();
        };

        // 初始化搜索按钮
        if ($btn.length) {
            $btn.addClass("cond-srh-btn clearfix")
                .removeAttr('role');

            $(btnHtml[0]).appendTo($btn);

            // 缓存回调 不必每次点击都向上查找
            var cbCaChe;

            $btn.on('click', '.cond-srh-btn-text', function (event) {
                if (!cbCaChe) {
                    cbCaChe = (function () {
                        var fun = '',
                            scope;
                        if (cbName) {
                            var names = cbName.split('.');
                            fun = win[names[0]];
                            scope = win;
                            var i = 1,
                                len = names.length;

                            while (fun && i < len) {
                                scope = fun;
                                fun = fun[names[i]];
                                i++;
                            }

                        }
                        return {
                            fun: fun,
                            scope: scope
                        };
                    })();
                }
                // 执行回调
                var fun = cbCaChe.fun,
                    scope = cbCaChe.scope;
                if (fun && typeof fun === 'function') {
                    fun.call(scope, event);
                }
            });

            if (isMultiLine) {
                // 多行条件，搜索按钮增加下拉
                $btn.length && $(btnHtml[1]).appendTo($btn);
                $btn.addClass('multi');

                $btn.on('click', '.cond-srh-btn-toggle', function (event) {
                    event.preventDefault();

                    var opened = $btn.hasClass('opened');

                    toggleCondition(opened);
                });
            }
            // 回车搜索
            var handleEnterSearch;
            if (Util.browsers.isIE) {
                // 解决IE下中文输入法先触发了搜索的问题
                handleEnterSearch = function () {
                    var activeEl = document.activeElement;
                    activeEl && activeEl.blur();
                    $btn.find('.cond-srh-btn-text').trigger('click');
                    activeEl && activeEl.focus();
                };
            } else {
                handleEnterSearch = function () {
                    $btn.find('.cond-srh-btn-text').trigger('click');
                };
            }
            $condition.on('keyup', function (e) {
                var keyCode = e.which;
                if (keyCode === 13) handleEnterSearch();
            });
        }

        // 初始化条件行的显示、隐藏
        if (isMultiLine) {
            var isDefaultOpen = $condition.attr('opened') === 'true';
            // 非第一行的条件
            $no1stRows = $rows.filter(function (i) {
                if (i !== 0) {
                    !isDefaultOpen && $rows.eq(i).addClass('hidden');
                    return true;
                }
            });
            if (isDefaultOpen) {
                $condition.removeAttr('opened');
                $(function () {
                    toggleCondition(false);
                });
            }
        }
    };


    Util.condition = {
        // 隐藏下拉按钮
        hideToggleBtn: function () {
            var $toggleBtn = $condition.find('.cond-srh-btn-toggle');

            $toggleBtn.addClass('hidden');
        },
        // 显示下拉按钮
        showToggleBtn: function () {
            var $toggleBtn = $condition.find('.cond-srh-btn-toggle');

            $toggleBtn.removeClass('hidden');
        }
    };

    // 为了给由epoint.form生成的动态表单在生成完fui-form内容之后重新初始化fui-condition区域
    // 主要是为了绑定按钮事件
    win.initCondition = init;
    init();

}(this, jQuery));
// contentpage信息提示notice区域交互
(function (win, $) {
    var $notice = $('.fui-notice');

    if (!$notice.length) return;

    var $toolbar = $('.fui-toolbar'),
        $helper = $toolbar.find('[role="helper"]');

    if (!$helper.length) return;

    // 按照新格式 仅显示图标 直接放在最右侧
    $helper.addClass('fui-toolbar-helper r').attr('title', $helper[0].innerHTML).empty();

    // right
    var $floatRight = $toolbar.find('.r');
    if ($floatRight.length) {
        $floatRight.eq(0).before($helper);
    } else {
        $helper.appendTo($toolbar);
    }

    var showAsTooltip = $helper[0].getAttribute('showtype') == 'tooltip' ? true : false;

    // 创建关闭按钮
    var $close = $('<span class="notice-close-btn"></span>').appendTo($notice);

    // tooltip 格式
    if (showAsTooltip) {
        var contentHtml = $notice[0].innerHTML,
            tip = new mini.ToolTip();

        tip.set({
            target: document,
            scope: $toolbar[0],
            trigger: 'click',
            selector: '.fui-toolbar-helper',
            placement: 'bottom',
            autoHide: false,
            theme: 'light',
            defaultTheme: 'light',
            onbeforeopen: function (e) {
                e.content = contentHtml;
                e.cancel = false;
            }
        });
        tip.addCls('fui-toolbar-tooltip');

        // 点击按钮关闭
        $('.fui-toolbar-tooltip').on('click', '.notice-close-btn', function () {
            tip.close();
        });
    } else {
        // 默认格式
        var wrapHtml = '<div class="fui-notice-inner"></div>';

        $notice.children().wrapAll(wrapHtml);
        $helper.toggleClass('active', !$notice.hasClass('hidden'));

        $helper.on('click', function () {
            $notice.toggleClass('hidden', !$notice.hasClass('hidden'));
            $helper.toggleClass('active', !$notice.hasClass('hidden'));

            adjustContentHeight();
        });

        $close.on('click', function () {
            $helper.trigger('click');
        });

    }

}(this, jQuery));
/*!
 * 高级搜索布局
 */
(function (win, $) {
    var $condition = $('.fui-search'),
        $toolbar = $('.fui-toolbar'),
        $notice = $('.fui-notice'),
        $content = $('.fui-content'),
        $toolbarbottom = $('.fui-toolbar-bottom');

    if (!$condition.length) return;
    if (!$toolbar.length) return;

    // 是否默认为展开
    var opened = $condition.attr('opened') == 'true' ? true : false;

    // 创建trigger 和遮罩
    var $trigger,
        $cover,
        // 关联控件的id
        primaryId,
        // 工具栏上的输入框
        toolbarSearch;

    // opeded无需trigger 无需遮罩
    if (!opened) {
        $trigger = $('<i></i>', {
            'data-status': 'close'
        }).addClass('fui-search-trigger r');
        // right
        var $floatRight = $toolbar.find('.r');
        if ($floatRight.length) {
            if ($floatRight.eq(0).hasClass('fui-toolbar-helper')) {
                $floatRight.eq(0).after($trigger);
            } else {
                $floatRight.eq(0).before($trigger);
            }
        } else {
            $trigger.appendTo($toolbar);
        }

        $cover = $('<div class="fui-search-cover hidden"></div>');
        $content.css('position', 'relative').append($cover);

        // 工具栏插入一个输入框 
        var insertInput = function () {
            primaryId = $condition[0].getAttribute('primaryControl');
            if (!primaryId) return;

            var connectedControl = mini.get(primaryId);

            // 没有或者类型不是textbox时不响应
            if (!connectedControl || connectedControl.type !== 'textbox') return;

            var width = $condition[0].getAttribute('primaryWidth');

            $trigger.after('<input type="text" id="toolbar-search-' + primaryId + '" emptyText="' + ('请输入' + $(connectedControl.el).parent().prev().text().slice(0, -1)) + '" class="mini-buttonedit fui-primary-search r" style="margin-left:5px;' + (width ? 'width:' + width + 'px' : '') + '">');
            mini.parse($toolbar[0]);

            toolbarSearch = mini.get('toolbar-search-' + primaryId);

            // 给两个控件绑定事件
            toolbarSearch.on('valuechanged', function () {
                var value = this.value;
                connectedControl.setValue(value);
                connectedControl.setText(value);
            });
            connectedControl.on('valuechanged', function (e) {
                var value = e.value;
                toolbarSearch.setValue(value);
                toolbarSearch.setText(value);
            });
            // 回车搜索
            var handleEnterSearch;
            if (Util.browsers.isIE) {
                handleEnterSearch = function () {
                    var activeEl = document.activeElement;
                    activeEl && activeEl.blur();
                    $searchBtn.trigger('click');
                    activeEl && activeEl.focus();
                };
            } else {
                handleEnterSearch = function () {
                    $searchBtn.trigger('click');
                };
            }
            toolbarSearch.on('enter', handleEnterSearch);
            // 点击搜索
            toolbarSearch.on('buttonclick', function (e) {
                $searchBtn.trigger('click');
            });
        };
        $(insertInput);
    }

    // 按钮处理
    var $searchBtn = $condition.find('[role="searcher"]'),
        $resetBtn = $condition.find('[role="reset"]'),
        $closeBtn = $condition.find('[role="close"]');

    var $footer = $('<div class="fui-search-footer"></div>');

    // 按钮文本
    var btnHtml = [];
    btnHtml.push('<span class="fui-search-srh-btn ">' + (win.epoint_search_text || '搜索') + '</span>');
    btnHtml.push('<span class="fui-search-reset-btn ">' + (win.epoint_reset_text || '重置') + '</span>');
    btnHtml.push('<span class="fui-search-close-btn ">' + (win.epoint_close_text || '关闭') + '</span>');

    $searchBtn.length && $(btnHtml[0]).appendTo($searchBtn);
    $resetBtn.length && $(btnHtml[1]).appendTo($resetBtn);
    !opened && $closeBtn.length && $(btnHtml[2]).appendTo($closeBtn);

    btnHtml = null;

    // 按钮插入到页面
    $footer.append($searchBtn)
        .append($resetBtn)
        .append($closeBtn)
        .appendTo($condition);

    // 搜索后的标签列表
    /**
    <div class="fui-search-result hidden clearfix"><span class="l fui-search-desc">已选条件：</span>
        <div class="l fui-search-list-wrap">
            <ul class="fui-search-list  clearfix"> 
                <!-- 此处添加搜索条件 -->
            </ul>
        </div>
        <div class="fui-search-result-btns r">
            <span class="fui-search-l l invisible"></span>
            <span class="fui-search-r l invisible"></span>
            <span class="fui-search-removeall l" title="移除全部"></span>
        </div>
    </div>
    */
    var $searchCondition = $('<div class="fui-search-result hidden clearfix"><span class="l fui-search-desc">已选条件：</span><div class="l fui-search-list-wrap"><ul class="fui-search-list  clearfix"></ul></div><div class="fui-search-result-btns r"><span class="fui-search-l l invisible"></span><span class="fui-search-r l invisible"></span><span class="fui-search-removeall l" title="移除全部"></span></div></div>').appendTo($condition),
        // 标签列表
        $tagListWrap = $searchCondition.find('.fui-search-list-wrap'),
        $tagList = $tagListWrap.find('.fui-search-list'),
        // 左右按钮
        $scrollLeft = $searchCondition.find('.fui-search-l'),
        $scrollRight = $scrollLeft.next();

    // 按钮点击切换方法
    var cilckSwitch = {
        searcher: function () {
            switchStatus('open');
        },
        close: function () {
            switchStatus('open');
        },
        open: function () {
            if ($tagList.children().length) {
                switchStatus('searcher');
            } else {
                switchStatus('close');
            }
        }
    };
    // 切换按钮点击
    !opened && $trigger.on('click', function (e) {
        e.stopPropagation();
        var status = $trigger.data('status');

        cilckSwitch[status]();
    });


    // 缓存三个按钮的回调函数名称
    // 主要是考虑回调中直接写epoint.refresh这样的方法，需要一层一层将其上下文找出，此处缓存可避免每次点击都遍历取出
    // 在第一次点击的时候再去取
    var cbCaChe,
        getCbCaChe = function () {
            var cbNames = {
                    'searcher': $searchBtn.length ? $searchBtn.attr('callback') : '',
                    'reset': $resetBtn.length ? $resetBtn.attr('callback') : '',
                    'close': $closeBtn.length ? $closeBtn.attr('callback') : ''
                },
                cache = {};
            for (var key in cbNames) {
                var names = cbNames[key].split('.');

                var fun = win[names[0]],
                    scope = win;
                var i = 1,
                    len = names.length;

                while (fun && i < len) {
                    scope = fun;
                    fun = fun[names[i]];
                    i++;
                }

                cache[key] = {
                    fun: fun,
                    scope: scope
                };
            }
            return cache;
        };

    // 按钮事件
    $condition.on('click', 'a', function (e) {
        e.stopPropagation();
        var $a = $(this),
            role = $a.attr('role');
        // 取回调并缓存
        if (!cbCaChe) {
            cbCaChe = getCbCaChe();
        }

        // 触发指定的回调
        var cb = cbCaChe[role];
        if (cb && typeof cb.fun == 'function') {
            cb.fun.call(cb.scope, e);
        }

        // 按钮应实现的功能
        if (role == 'reset') {
            // 重置值 清空标签 隐藏条目区域
            _resetValue();
            $tagList.empty();
            $searchCondition.addClass('hidden');

            // 重新搜索
            cb = cbCaChe.searcher;
            if (cb && typeof cb.fun == 'function') {
                cb.fun.call(cb.scope, e);
            }
        } else {
            switchStatus(role);
        }
    });

    // 获取所有控件
    var _$condForm = $condition.find('.fui-form');
    var _getControls = function () {
        if (!_$condForm.length) return [];
        return mini.getChildControls(_$condForm[0]);
    };

    // 重置控件值
    var _resetValue = function () {
        var arr = _getControls();
        for (var i = 0, l = arr.length; i < l; ++i) {
            // 同步修改 隐藏域的值不能被重置
            // cause：项目管理9.3功能测试bug 后台管理-组织架构-用户管理：先选择部门，然后通过检索弹出界面的字段进行检索，检索后页面中显示部门guid检索条件。
            // modify by chendongshun at 2017.05.22
            if (arr[i].type == 'hidden') continue;

            // checkbox的setText方法是用来设置label的，不能清空
            arr[i].setText && arr[i]._clearText !== false && arr[i].setText('');
            arr[i].setValue('');

            // 需要同步清除toolbar上的
            if (arr[i].id == primaryId) {
                if (toolbarSearch) {
                    toolbarSearch.setValue('');
                    toolbarSearch.setText('');
                }
            }
        }
    };

    var TAG_TPL = '<li class="fui-search-item l"><span class="fui-search-item-text l" title="{{text}}">{{text}}</span><span class="fui-search-item-remove l" title="移除" {{#value}} data-value="{{value}}" {{/value}} data-id="{{id}}"></span></li>';
    // 渲染标签
    var _renderTag = function (obj) {
        return Mustache.render(TAG_TPL, obj);
    };

    // 渲染标签
    var renderTags = function () {
        // 记录是否有值，无值则不需要渲染标签
        var hasValue = false;
        var controls = _getControls();
        var html = [];
        for (var i = 0, l = controls.length; i < l; i++) {
            var control = controls[i];

            // 隐藏域不用渲染出来
            // cause：项目管理9.3功能测试bug 后台管理-组织架构-用户管理：先选择部门，然后通过检索弹出界面的字段进行检索，检索后页面中显示部门guid检索条件。
            // modify by chendongshun at 2017.05.22
            if (control.type == 'hidden') continue;

            var text = control.getText ? control.getText() : control.getValue();


            // 单个的checkbox text一直有值，不能直接渲染 需要进一步判断
            text = control._clearText !== false ? text : (control.checked ? text : '');

            if (!text) {
                continue;
            } else {
                hasValue = true;
            }
            // 新增关于checkboxlist显示为多值的处理
            if (control.type == 'checkboxlist') {
                var values = control.getValue().split(',');

                text = text.split(',');
                for (var j = 0, len = values.length; j < len; ++j) {
                    html.push(_renderTag({
                        value: values[j],
                        text: text[j],
                        id: control.id
                    }));
                }
            } else {
                html.push(_renderTag({
                    text: text,
                    id: control.id
                }));
            }
        }

        hasValue && $(html.join('')).appendTo($tagList.empty());

        return hasValue;
    };

    // 用于checkboxlist的value中移除一个
    var getNewVal = function (oldVal, currVal) {
        // 如果为中间的 去掉多余的"，"
        // 如果为第一个还要去掉最前的","
        // 如果为最后的 替换掉最后的"，"
        return (',' + oldVal + ',').replace(',' + currVal + ',', ',').replace(/^,|,$/g, '');
    };

    // 搜索标签删除按钮点击
    $searchCondition
        .on('click', '.fui-search-item-remove', function (e) {
            var $this = $(this),
                id = $this.data('id');
            // 清空控件值
            if (id) {
                var control = mini.get(id);
                if (!control) return;

                if (control.type == 'checkboxlist') {
                    // checkboxlist 值需要单独处理
                    var oldVal = control.getValue(),
                        currVal = $this.data('value'),
                        // 移除当前值
                        newVal = getNewVal(oldVal, currVal);
                    // 赋值为新值
                    control.setValue(newVal);
                } else {
                    // checkbox的setText方法是用来设置label的，不能清空
                    control.setText && control._clearText !== false && control.setText('');
                    control.setValue('');
                }
            }

            // id为绑定的id 则要清除工具栏上的
            if (id == primaryId) {
                if (toolbarSearch) {
                    toolbarSearch.setValue('');
                    toolbarSearch.setText('');
                }
            }
            // 移除元素
            $this.parent('.fui-search-item').remove();

            _adjustWidth();

            // 检查长度
            ($tagList.find('.fui-search-item').length === 0) && switchStatus('close');

            // 触发搜索的回调
            var cb = cbCaChe.searcher;
            if (cb && typeof cb.fun == 'function') {
                cb.fun.call(cb.scope, e);
            }
        })
        // 移除全部
        .on('click', '.fui-search-removeall', function (e) {
            $tagList.empty();
            $searchCondition.addClass('hidden');
            _resetValue();
            switchStatus('close');

            // 清空工具栏输入框的值
            if (toolbarSearch) {
                toolbarSearch.setValue('');
                toolbarSearch.setText('');
            }

            // 触发搜索的回调
            var cb = cbCaChe.searcher;
            if (cb && typeof cb.fun == 'function') {
                cb.fun.call(cb.scope, e);
            }
        })
        // 激活当前
        .on('click', '.fui-search-item', function (e) {
            e.stopPropagation();
            $(this).addClass('active').siblings().removeClass('active');
        });
    // 其他地方点击
    $('body').on('click', function () {
        $tagList.children().removeClass('active');

    }).on('keyup', function (e) {
        // esc 关闭
        var code = e.which;
        // console.log(code);
        code === 27 && switchStatus('close');
    });

    /**
     * 切换表单和标签状态
     * @param {string} type searcher open close 
     */
    var switchStatus = function (type) {
        if (type == 'searcher') {
            // 如果是默认展开 不需要显示标签
            if (opened) return;
            // 搜索则要显示标签
            var hasValue = renderTags();
            if (hasValue) {
                $toolbar.removeClass('searchopen');
                $searchCondition.removeClass('hidden');
                $condition.removeClass('hidden').removeClass('open').addClass('searcher');
                $trigger.data('status', 'searcher').removeClass('close');
                $cover.addClass('hidden');
            } else {
                switchStatus('close');
            }
            _adjustWidth();
        } else if (type == 'close') {
            $toolbar.removeClass('searchopen');
            $condition.addClass('hidden').removeClass('searcher').removeClass('open');
            $trigger.data('status', 'close').removeClass('close');
            $searchCondition.addClass('hidden');
            $cover.addClass('hidden');
        } else if (type == 'open') {
            $toolbar.addClass('searchopen');
            $condition.removeClass('hidden').removeClass('searcher').addClass('open');
            $trigger.data('status', 'open').addClass('close');
            $searchCondition.addClass('hidden');
            $cover.removeClass('hidden');
        }

        _adjustHeight();

    };


    // 只有非默认打开时 计算和绑定事件
    if (!opened) {
        // 左右侧保留宽度
        var HODE_WIDTH,
            // 一次滚动距离
            SETP_WITH = 100,
            cond_width,
            view_width,
            list_width = 0,
            scroll_width = 0;

        var _calculateWidth = function () {
            if (!$searchCondition.is(':visible')) return;
            if (!HODE_WIDTH) {
                HODE_WIDTH = $searchCondition.find('.fui-search-desc').outerWidth() + $searchCondition.find('.fui-search-result-btns').outerWidth();
            }

            cond_width = $searchCondition.width();

            view_width = cond_width - HODE_WIDTH - 10;

            $tagListWrap.css('width', view_width);

            list_width = 0;
            $tagList.find('.fui-search-item').each(function (i, item) {
                list_width += $(item).outerWidth() + 10;
            });

            scroll_width = (list_width - view_width) >> 0;
        };

        var _adjustWidth = function () {
            _calculateWidth();
            if (scroll_width > 0) {
                $scrollLeft.removeClass('invisible');
                $scrollRight.removeClass('invisible');
                $tagList.animate({
                    marginLeft: -scroll_width
                });
            } else {
                $scrollLeft.addClass('invisible');
                $scrollRight.addClass('invisible');
                $tagList.animate({
                    marginLeft: 0
                });
            }
        };
        $scrollRight.on('click', function () {
            var ml = -parseInt($tagList.css('margin-left')),
                // 最多滚到可滚动距离
                range = Math.min(SETP_WITH, scroll_width - ml);
            if ($tagList.is(':animated') || ml >= scroll_width) {
                return;
            }
            $tagList.animate({
                marginLeft: '-=' + range + 'px'
            });
        });
        $scrollLeft.on('click', function () {
            var ml = -parseInt($tagList.css('margin-left')),
                //  最多滚到0
                range = Math.min(SETP_WITH, ml);
            if ($tagList.is(':animated') || ml < 0) {
                return;
            }
            $tagList.animate({
                marginLeft: '+=' + range + 'px'
            });
        });
        $(win).on('resize', function () {
            _adjustWidth();
        });
    }
    // 
    $(win).off('resize.contentPage').on('resize', function () {
        _adjustHeight();
    });

    // 计算高度 不能直接使用 content区域计算中的方法
    var getHeight = function ($el) {
        var h = 0;

        if ($el.length && !$el.hasClass('hidden') && $el.css('position') != 'absolute') {
            h = $el.outerHeight();
        }
        return h;
    };

    // 切换状态后调整content高度
    var _adjustHeight = function () {
        var win_h = $(win).height(),

            toolbar_h = getHeight($toolbar),

            condition_h = getHeight($condition),
            notice_h = getHeight($notice),
            toolbarbottom_h = getHeight($toolbarbottom);

        $content.css('height', win_h - toolbar_h - condition_h - notice_h - toolbarbottom_h);

        // content区域高度调整后，调整表格布局
        Util._layoutDatagridInContent();
    };
    // 重写调整高度的方法
    win.adjustContentHeight = _adjustHeight;

    // 默认打开时
    if (opened) {
        $condition.css({
            position: 'relative',
            top: '0',
            'box-shadow': 'none'
        });
        $closeBtn.addClass('hidden');
        $condition.addClass('open');
        $(function () {
            setTimeout(_adjustHeight, 60);
        });
    } else {
        $condition.addClass('hidden');
    }

}(window, jQuery));
(function (win, $) {
    var $accsWrap = $('.fui-accordions'),
        $fuiContent = $('.fui-content');

    var $accNav,
        $accReturn,
        $scrollEl;

    if (!$accsWrap.length) return;

    var getOrder = function (order) {
        if (order < 10) {
            order = '0' + order;
        }
        return order;
    };

    var showNav = $fuiContent.length > 0 && $accsWrap.attr('showNav');

    if(showNav === undefined) {
        showNav = Util.getFrameSysParam('showAccordionsNav');
    } else {
        showNav = showNav === "true";
    }

    var getAccHdHtml = function (order, title) {
        var html = [];

        html.push('<span class="fui-acc-order">' + getOrder(order) + '</span>');
        html.push('<i class="fui-acc-toggle"></i>');
        html.push('<h4 class="fui-acc-title">' + title + '</h4>');

        return html.join('');
    };

    var getNavItemHtml = function (id, title) {
        return '<li class="acc-menu-item" data-ref="' + id + '" title="' + title + '">' + title + '</li>';
    };

    var getNavHtml = function (itemHtml) {
        var html = [];

        html.push('<div class="fui-acc-menu">');
        html.push('<ul class="acc-menu-list">');
        html.push(itemHtml);
        html.push('</ul>');
        html.push('</div>');

        return html.join('');
    };

    var scroll = function (el) {

        var id = el.data("ref"),

            $accItem = $('#' + id);

        if ($scrollEl.length) {
            // var scrollTop = $accItem.offset().top + $scrollEl.scrollTop() - $scrollEl.offset().top;

            // if (Util.browsers.isIE) {
            //     $scrollEl.animate({
            //         scrollTop: scrollTop
            //     }, 500);
            // }else {
            //     $scrollEl[0].scrollTop = scrollTop;
            // }
            scrollTopTo($accItem[0].offsetTop);
            
        }

        el.addClass('active').siblings().removeClass('active');
    };

    var scrollTopTo = (function () {
        if (Util.browsers.isIE) {
            return function (scrollTop) {
                $scrollEl.stop(true).animate({
                    scrollTop: scrollTop
                }, 500);
            };
        }
        return function (scrollTop) {
            $scrollEl[0].scrollTop = scrollTop;
        };
    }());

    // 设置导航的位置
    var setNavPos = function () {
        var scrollContainerWidth = $('.fui-content').width(),
            accWrapWidth = $accsWrap.outerWidth();

        var right = (scrollContainerWidth - accWrapWidth) / 2;

        // 避免导航区域遮住滚动条
        if (right < 17) {
            right = 17;
        }

        if (showNav) {
            $accNav.css('right', right);
            $accReturn.css('right', right);
        }
    };

    var adjustNavDisplay = function(){
        if(!showNav) {
            return;
        }
        var len = $accsWrap.find('[role="accordion"]').filter(function(){
            return !$(this).hasClass('hidden');
        }).length;

        if(len > 2) {
            $accsWrap.addClass('shownav');
            $accNav.removeClass('hidden');
            $accReturn.removeClass('hidden');
        } else {
            $accsWrap.removeClass('shownav');
            $accNav.addClass('hidden');
            $accReturn.addClass('hidden');
        }
    };

    // 解析手风琴html结构
    var parse = function () {
        var $accs = $accsWrap.find('[role="accordion"]'),
            len = $accs.length,
            navHtml = [];

        $.each($accs, function (i, acc) {
            var $acc = $(acc),
                $hd = $acc.find('[role="head"]'),
                $bd = $acc.find('[role="body"]');

            var opened = $acc.attr('opened') !== 'false',
                title = $hd.attr('title');

            $acc.addClass('fui-accordion');
            $hd.addClass('fui-acc-hd');
            $bd.addClass('fui-acc-bd');

            opened ? $acc.addClass('opened') : $acc.addClass('closed');
            opened ? $bd.show() : $bd.hide();

            // 填充head默认内容
            $(getAccHdHtml((i + 1), title)).prependTo($hd);
            var id;
            // 配置个性化的手风琴 且 没有配置showNav
            if (showNav) {
                id = acc.id ? acc.id : (acc.id = 'accordion_' + i);

                navHtml.push(getNavItemHtml(id, title));
            }
        });

        if (showNav) {
            $accNav = $(getNavHtml(navHtml.join('')));
            $accNav.appendTo(document.body);
            // 返回顶部按钮
            $accReturn = $("<div class='fui-acc-return' title='返回顶部' style='display:none;'></div>").appendTo(document.body);

            $accsWrap.addClass('shownav');
            $accNav.find('.acc-menu-item').eq(0).addClass('active');

            $accNav.css('top', $accsWrap.find('.fui-accordion').eq(0).offset().top);
            setNavPos();

            adjustNavDisplay();
        }
    };

    $accsWrap.on('click', '.fui-acc-toggle', function () {
        var $el = $(this),
            $acc = $el.closest('.fui-accordion'),
            opened = $acc.hasClass('opened'),
            ontoggle = $acc.attr('ontoggle');

        $acc.toggleClass('closed', opened)
            .toggleClass('opened', !opened);
        $acc.find('>.fui-acc-bd').stop(true)[opened ? 'slideUp': 'slideDown'](200);

        if (ontoggle && win[ontoggle]) {
            win[ontoggle](opened ? 'closed' : 'opened');
        }
    });

    var timer;
    // 默认滚动区域为fui-content，滚动时激活对应导航item
    $fuiContent.on('scroll', function (event) {
        var $items = $(".fui-accordion:not(.hidden)"),
            $navItems = $(".acc-menu-item:not(.hidden)");

        clearTimeout(timer);

        timer = setTimeout(function () {
            $items.each(function (i, el) {
                var top = $(el).offset().top;

                if (top >= 0) {
                    $navItems.eq(i).addClass('active')
                        .siblings().removeClass('active');

                    return false;
                }
            });
            var top = $items.eq(0).offset().top;
            if (showNav) {
                if (top <= -100) {
                    $accReturn.show();
                } else {
                    $accReturn.hide();
                }
            }
        }, 200);

    });

    $(win).on('resize', function (e) {
        setNavPos();
    });

    if (showNav) {
        $('body').on('click', function (e) {
            var $target = $(e.target),
                ref = $target.data('ref');

            $scrollEl = $(Util.getFirstScrollEl($accsWrap.find('.fui-accordion')[0]));

            if ($target.closest($accNav).length) {
                if ($target.hasClass('acc-nav-trigger')) {
                    $accNav.toggleClass('active');
                } else if ($target.hasClass('acc-menu-item')) {
                    $('#' + ref).removeClass('closed').addClass('opened');
                    scroll($target);
                }
            } else {
                $accNav.removeClass('active');
            }

            if ($target.hasClass('fui-acc-return')) {
                // $scrollEl.animate({
                //     scrollTop: 0
                // }, 500);
                scrollTopTo(0);
            }

        });
    }

    Util.accordion = {
        _accs: $accsWrap.find('[role="accordion"]'),

        _accNavs: undefined,

        _accTpl: '<div role="accordion" class="fui-accordion {{status}}"><div class="fui-acc-hd" role="head" title="{{title}}"><span class="fui-acc-order">{{order}}</span><i class="fui-acc-toggle"></i><h4 class="fui-acc-title">{{title}}</h4></div><div class="fui-acc-bd" role="body"><iframe frameborder="0" width="100%" height="{{contentHeight}}" src="{{url}}"></iframe></div></div>',

        // 显示手风琴项
        showItem: function (index) {
            var $acc = this._accs.eq(index);

            if ($acc.length && $acc.hasClass('hidden')) {
                $acc.removeClass('hidden');
                this._updateOrders();
            }

            if (showNav) {
                var $navItem = this._getAccNavs().eq(index);

                if ($navItem.length && $navItem.hasClass('hidden')) {
                    $navItem.removeClass('hidden');
                }
                adjustNavDisplay();
                $fuiContent.trigger('scroll');
            }
        },

        // 隐藏手风琴项
        hideItem: function (index) {
            var $acc = this._accs.eq(index);

            if ($acc.length && !$acc.hasClass('hidden')) {
                $acc.addClass('hidden');
                this._updateOrders();
            }
            if (showNav) {
                var $navItem = this._getAccNavs().eq(index);

                if ($navItem.length && !$navItem.hasClass('hidden')) {
                    $navItem.addClass('hidden');
                }

                adjustNavDisplay();
                $fuiContent.trigger('scroll');
            }
        },
        hideNav: function() {
            if (showNav) {
                showNav = false;
                $accNav.addClass('hidden');
                $accReturn.addClass('hidden');
                $accsWrap.removeClass('shownav');
            }
        },

        // 展开手风琴
        expandItem: function (index) {
            var $acc = this._accs.eq(index);
            if ($acc.length && !$acc.hasClass('hidden')) {
                $acc.removeClass('closed').addClass('opened');
                $acc.find('>.fui-acc-bd').stop(true).slideDown(200);
            }
        },
        // 收起手风琴
        collapseItem: function (index) {
            var $acc = this._accs.eq(index);
            if ($acc.length && !$acc.hasClass('hidden')) {
                $acc.removeClass('opened').addClass('closed');
                $acc.find('>.fui-acc-bd').stop(true).slideUp(200);
            }
        },

        // 设置手风琴标题
        setTitle: function (title, index) {
            var $acc = this._accs.eq(index);
            if ($acc.length) {
                var $header = $acc.find('[role="head"]').attr('title', title);

                $header.find('.fui-acc-title').html(title);
            }

            if (showNav) {
                var $navItem = this._getAccNavs().eq(index);

                if ($navItem.length) {
                    $navItem.html(title).attr('title', title);
                }
            }
        },

        // 动态添加手风琴项
        addItem: function (title, url, opened, contentHeight) {
            var html = Mustache.render(this._accTpl, {
                title: title,
                url: url,
                status: opened ? "opened" : "closed",
                contentHeight: contentHeight || "100%"
            });

            $(html).appendTo($accsWrap);

            this._accs = $accsWrap.find('[role="accordion"]');

            this._updateOrders();

            if (showNav) {
                var index = this._accs.length - 1,
                    acc = this._accs[index],
                    id = acc.id ? acc.id : (acc.id = 'accordion_' + index);
                html = getNavItemHtml(id, title);

                $(html).appendTo($accNav.find('.acc-menu-list'));

                this._accNavs = $accNav.find('.acc-menu-item');

                adjustNavDisplay();
            }

        },

        // 显示|隐藏后需要更新下序号
        _updateOrders: function () {
            var order = 0;

            $.each(this._accs, function (i, acc) {
                var $acc = $(acc),
                    $order = $acc.find('.fui-acc-order');

                if (!$acc.hasClass('hidden')) {
                    $order.html(getOrder(++order));
                }
            });
        },

        _getAccNavs: function () {
            if (!this._accNavs) {
                this._accNavs = $accNav ? $accNav.find('.acc-menu-item') : undefined;
            }

            return this._accNavs;
        }
    };

    parse();

}(this, jQuery));
// toolbar overflow 支持
(function(win, $) {
    if (!Util.debounce) {
        /**
         * debounce 大于间隔时间时才触发
         * 连续触发时，仅当时间间隔大于指定时间才触发
         *
         * @param {function} fn 要处理的函数
         * @param {number} delay 间隔时间 单位 ms
         * @param {[object]} ctx 要绑定的上下文
         * @returns debounce 后的新函数
         */
        Util.debounce = function(fn, delay, ctx) {
            delay = delay || 17;
            var timer;
            return function() {
                var args = arguments;
                var context = ctx || this;
                clearTimeout(timer);
                timer = setTimeout(function() {
                    fn.apply(context, args);
                }, delay);
            };
        };
    }
    if (!Util.throttle) {
        /**
         * throttle 降低触发频率
         * 连续触发时，降低执行频率到指定时间
         *
         * @param {function} fn 要处理的函数
         * @param {number} delay 间隔时间 单位 ms
         * @param {[object]} ctx 要绑定的上下文
         * @returns throttle 后的新函数
         */
        Util.throttle = function throttle(fn, delay, ctx) {
            delay = delay || 200;
            var timer,
                prevTime = +new Date();
            return function() {
                clearTimeout(timer);
                var args = arguments;
                var context = ctx || this;
                var pastTime = +new Date() - prevTime;

                if (pastTime >= delay) {
                    // 如果过去的时间已经大于间隔时间 则立即执行
                    fn.apply(context, args);
                    prevTime = +new Date();
                } else {
                    // 过去的时间还没到 则等待
                    timer = setTimeout(function() {
                        fn.apply(context, args);
                        prevTime = +new Date();
                    }, delay - pastTime);
                }
            };
        };
    }

    function ToolbarOverflow(el) {
        this.$el = $(el);

        if (!this.$el.length) {
            return;
        }
        if (this.$el[0].getAttribute(this.ATTRIBUTE_PREFIX + 'init') == 'true') {
            var target = ToolbarOverflow.instances[this.$el[0].getAttribute(this.ATTRIBUTE_PREFIX + 'uid')];
            if (!target) {
                return;
            }
            target.update();
            return target;
        }

        this.eventNamespace = ToolbarOverflow.name + '-' + this.uid;
        this.events = {};
        this.$el[0].setAttribute(this.ATTRIBUTE_PREFIX + 'init', 'true');

        this.uid = Util.uuid();
        this.$el[0].setAttribute(this.ATTRIBUTE_PREFIX + 'uid', this.uid);
        ToolbarOverflow.instances[this.uid] = this;

        this.$el.css('position', 'relative');
        this.isOver = false;
        this.$extArea = $('<div class="toolbar-ext-area"></div>').appendTo(this.$el);
        if (this.$el.hasClass('fui-toolbar-bottom')) {
            this.$extArea.css('bottom', '100%');
        } else {
            this.$extArea.css({ top: '100%' });
        }
        this.limit_w = this.$el.width();

        // 记录 toolbar 中最后一个非右浮动的元素
        this.$lastNormalChild = null;
        // 记录 toolbar 中第一个右浮动的元素（排除忽略的）
        this.$firstRightChild = null;

        this._insertToggleBtn();
        this.calcLimited();

        this.initEvent();
        this.update();
    }
    // 记录所有实例
    ToolbarOverflow.instances = {};
    // 获取单个实例
    ToolbarOverflow.getInstance = function(el) {
        if (!el) return null;
        return ToolbarOverflow.instances[$(el).attr(ToolbarOverflow.prototype.ATTRIBUTE_PREFIX + 'uid')];
    };

    $.extend(ToolbarOverflow.prototype, {
        // 属性前缀
        ATTRIBUTE_PREFIX: 'overflow-',
        /**
         * 在移动时需要忽略掉的选择器
         * 帮助按钮、高级搜索展开按钮、高级搜索主要搜索框、toolbar溢出的触发按钮和额外区域
         */
        ignoreSelectors: ['.fui-toolbar-helper', '.fui-search-trigger', '.fui-primary-search', '.fui-toolbar-over-trigger', '.toolbar-ext-area'].join(','),

        /**
         * 更新状态
         *
         */
        update: function() {
            var inner_w = this.calcInnerWidth();
            // 如果按钮已经是展示的 则无需加上宽度 否则要加上 避免出现本来能显示下 显示按钮后恰好展示不下了
            var trigger_w = this.$trigger.is(':visible') ? 0 : this.$trigger.outerWidth(true);
            if (inner_w > this.limit_w) {
                this.isOver = true;
                this.$trigger.removeClass('hidden');
                this.moveToExtArea(inner_w + trigger_w);
            } else {
                this.restoreToToolbar(inner_w);
            }
            return this;
        },

        /**
         * 计算容器的限制宽度
         */
        calcLimited: function() {
            this.limit_w = this.$el.width();
        },
        initEvent: function() {
            var that = this;
            this.$trigger.on('click.' + this.eventNamespace, function() {
                that.toggle();
            });

            $(win).on(
                'resize.' + this.eventNamespace,
                Util.throttle(
                    function() {
                        that.calcLimited();
                        that.update();
                    },
                    Util.browsers.isIE ? 100 : 50
                )
            );
            $(win).on('mousedown.' + this.eventNamespace, function(ev) {
                var $target = $(ev.target);
                if ($target.closest(that.$trigger).length) {
                    return;
                }
                if (!$target.closest(that.$extArea).length) {
                    that.toggle(false);
                }
            });
        },

        /**
         * 插入触发按钮
         *
         */
        _insertToggleBtn: function() {
            this.$trigger = $('<i></i>').addClass('fui-toolbar-over-trigger hidden r icon-rightdouble action-icon');
            if (this.$el.hasClass('fui-toolbar-bottom') && !this.$el.hasClass('left')) {
                this.$trigger.prependTo(this.$el);
            } else {
                //  顶部的 toolbar 和 左浮动的toolbar
                var $floatRight = this.$el.find('.r');
                if ($floatRight.length) {
                    $floatRight.eq(0).before(this.$trigger);
                } else {
                    this.$trigger.appendTo(this.$el);
                }
            }
        },

        /**
         * 切换额外区域的显示和隐藏 仅在溢出时生效
         *
         * @param {boolean | undefined} show 传递布尔值时 true 显示， false 隐藏； 不传值时切换状态
         * @returns
         */
        toggle: function(show) {
            if (!this.isOver) {
                return;
            }

            if (show === undefined) {
                this.$trigger.toggleClass('active');
                return this.$extArea.slideToggle(200, setZIndex);
            }
            if (show) {
                this.$trigger.addClass('active');
                this.$extArea.slideDown(200, setZIndex);
            } else {
                this.$trigger.removeClass('active');
                this.$extArea.slideUp(200);
            }
            function setZIndex() {
                var $this = $(this);
                if ($this.is(':visible')) {
                    $this.css('z-index', Util.getZIndex());
                }
            }
        },

        /**
         * 计算 toolbar 区域中的元素宽度 并做缓存
         *
         * @returns {number} 计算得出的宽度
         */
        calcInnerWidth: function() {
            var inner_w = 0;
            this.$el.children().each(function(i, el) {
                var $el = $(el);
                if ($el.hasClass('toolbar-ext-area')) {
                    // 扩展区域的 也需要更新一下
                    var ext_w = 0;
                    // 不可见需先调整为可见 计算完成再隐藏
                    var isVisible = $el.is(':visible');
                    if (!isVisible) {
                        $el.addClass('hidden-accessible').show();
                    }
                    $el.css('width', '10000px')
                        .children()
                        .each(function(j, item) {
                            var $item = $(item);
                            var w = $item.is(':hidden') ? 0 : $item.outerWidth(true);
                            $item.data('width', w);
                            ext_w += w;
                        });
                    if (!isVisible) {
                        $el.removeClass('hidden-accessible').hide();
                    }
                    $el.data('width', ext_w).css('width', ext_w + 2);
                    return;
                }
                var w = $el.is(':hidden') ? 0 : $el.outerWidth(true);
                $el.data('width', w);
                inner_w += w;
            });
            return inner_w;
        },

        /**
         * 获取 toolbar 中 视觉上的最后一个元素
         * 几个应固定在最右侧的已经排除在外 具体配置在 ignoreSelectors 中
         *
         * @returns
         */
        getToolbarLastChild: function() {
            var $floatRights = this.$el.find('> .r');

            var i = 0,
                len = 0;

            // 优先右浮动的 正序取出 即为最后的
            for (i = 0, len = $floatRights.length; i < len; i++) {
                var $currR = $floatRights.eq(i);
                // 在忽略列表中 则取下一个
                if ($currR.filter(this.ignoreSelectors).length || $currR.is(':hidden')) {
                    continue;
                } else {
                    return $currR;
                }
            }

            // 仍未返回则中最后开始取
            var $children = this.$el.children().filter(function(i, el) {
                var $el = $(el);
                return !$el.hasClass('r') && !$el.is(':hidden');
            });

            for (i = $children.length - 1; i > 0; i--) {
                var $currN = $children.eq(i);
                if ($currN.filter(this.ignoreSelectors).length) {
                    continue;
                } else {
                    return $currN;
                }
            }
        },

        /**
         * 宽度溢出 移动到额外区域
         *
         * @param {number} inner_w 当前 toolbar 中元素的宽度
         */
        moveToExtArea: function(inner_w) {
            if (!inner_w) {
                inner_w = this.calcInnerWidth();
            }
            // 移动导致新增的宽度
            var addedWidth = 0;
            // 记录当前元素的宽度
            var currWidth = 0;
            do {
                var $aim = this.getToolbarLastChild();
                if ($aim && $aim.length) {
                    if ($aim.hasClass('r')) {
                        this.$firstRightChild = $aim.next();
                    } else {
                        this.$lastNormalChild = $aim.prev();
                    }
                    currWidth = $aim.data('width');
                    addedWidth += currWidth;
                    inner_w -= currWidth;
                    $aim.prependTo(this.$extArea);
                } else {
                    this.$firstRightChild = this.$lastNormalChild = null;
                    break;
                }
            } while (inner_w > this.limit_w);

            if (addedWidth) {
                var w = (this.$extArea.data('width') || 0) + addedWidth;
                this.$extArea.css('width', w + 2).data('width', w);
            }
        },
        /**
         * 获取第一个可还原的元素
         *
         * @returns
         */
        getFirstExtraChild: function() {
            return this.$extArea.children(':eq(0)');
        },
        /**
         * 处理某个元素还原到正确的位置
         *
         * @param {jQuery Object} $targetChild 要处理元素
         * @returns
         */
        restoreToRightPos: function($targetChild) {
            // 右浮动的
            if ($targetChild.hasClass('r')) {
                if (this.$firstRightChild && this.$firstRightChild.length) {
                    this.$firstRightChild.before($targetChild);
                    this.$firstRightChild = $targetChild;
                } else {
                    $targetChild.appendTo(this.$targetChild);
                }
                return;
            }

            // 正常的直接插入到正常的最后一个的后面即可
            if (this.$lastNormalChild && this.$lastNormalChild.length) {
                this.$lastNormalChild.after($targetChild);
                // 更新记录
                this.$lastNormalChild = $targetChild;
            } else {
                $targetChild.appendTo(this.$el);
            }
        },
        /**
         * 判断当前元素是否可被还原
         *
         * @param {jQuery Object} $targetChild 要测试能否被还原的元素
         * @param {number} currInner_w 当前 toolbar 中所有元素的宽度
         * @returns
         */
        _restorable: function($targetChild, currInner_w) {
            if (!$targetChild.length) {
                return false;
            }
            return currInner_w + $targetChild.data('width') <= this.limit_w;
        },
        /**
         * 像 toolbar 中还原元素
         * @param {number} currInner_w 开始调整时的 toolbar 内部元素宽度
         * @param {boolean | undefined}  是否强制还原所有元素
         * @returns {undefined}
         * @memberof ToolbarOverflow
         */
        restoreToToolbar: function(currInner_w, force) {
            var $firstChild = this.getFirstExtraChild();

            while ((force && $firstChild.length) || this._restorable($firstChild, currInner_w)) {
                // 还原
                this.restoreToRightPos($firstChild);
                // 更新宽度
                var ext_w = (this.$extArea.data('width') || 0) - $firstChild.data('width');
                this.$extArea.data('width', ext_w);

                currInner_w += $firstChild.data('width');
                $firstChild = this.getFirstExtraChild();
            }

            this.$extArea.css('width', this.$extArea.data('width') + 2);
            // 是否全部还原完了
            if (force || !this.$extArea.children().length) {
                this.allRestore();
            }
        },
        /**
         * 全部还原后的统一调整
         * @returns {undefined}
         * @memberof ToolbarOverflow
         */
        allRestore: function() {
            this.isOver = false;
            this.$trigger
                .addClass('hidden')
                .data('width', 0)
                .removeClass('active');
            this.$extArea.hide();
        },
        /**
         * 实例销毁
         * @returns {undefined}
         * @memberof ToolbarOverflow
         */
        destroy: function() {
            this.$trigger.off('click');
            $(win).off('resize.' + this.eventNamespace);
            $(win).off('mousedown.' + this.eventNamespace);

            this.restoreToToolbar(null, true);

            this.$trigger.remove();
            this.$extArea.remove();
            this.$el[0].removeAttribute(this.ATTRIBUTE_PREFIX + 'uid');
            this.$el[0].removeAttribute(this.ATTRIBUTE_PREFIX + 'init');

            ToolbarOverflow.instances[this.uid] = null;
            delete ToolbarOverflow.instances[this.uid];

            for (var k in this) {
                if (Object.prototype.hasOwnProperty.call(this, k)) {
                    this[k] = null;
                    delete this[k];
                }
            }
        }
    });

    win.ToolbarOverflow = ToolbarOverflow;

    // auto init
    $(function() {
        $('.fui-toolbar, .fui-toolbar-bottom').each(function(i, item) {
            // eslint-disable-next-line no-new
            new ToolbarOverflow(item);
        });
    });
})(this, jQuery);

/*!
 * 通过body master属性动态载入导航模板资源
 */
(function (win, $) {
    var MASTER_NAMES = ['leftAccNav', 'leftAccTree', 'topWizard', 'leftWizard', 'topTabNav'];

    var $content = $('body > .master-content'),
        master = $content.attr('master'),
        srcdir = $content.attr('srcdir'); // 获取个性化的目录路径

    // 获取路径前半部分，如：fui/js/navpages/name/name
    var getPathPrefix = function (name) {
        var path = 'frame/fui/js/widgets/navpages'; // 默认路径
        if (srcdir) {
            path = srcdir; // 个性化路径
        }
        return path + '/' + name + '/' + name;
    };

    // 初始化模板结构和资源
    var initMaster = function (name) {
        var prefix = getPathPrefix(name);

        $content.load(Util.getRightUrl(prefix + '_snippet.html'), function () {

            if ($.inArray(name, ['leftAccNav', 'leftAccTree']) != -1) {
                parseLeftRightLayout();
            }

            Util.loadCss(prefix + '.css');
            Util.loadJs(prefix + '.js');
        });
    };

    $(function () {
        initMaster(master);
    });

}(this, jQuery));
/*
 * 不带标题的轻量化弹窗
 */
(function(win, $){
    var defaultConfig = {
        showModal: true,
        showCloseButton: true,
        width: 600,
        height: 400
    };
    var LightDialog = function(cfg){
        this.cfg = $.extend({},defaultConfig, cfg);

        this.__onDestroy = cfg.ondestroy;
        this.__onLoad = cfg.onload;

        this._init();
    };

    LightDialog.prototype = {
        constructor: LightDialog,

        _init: function(){
            this.$container = $('<div class="lightdialog hidden"><iframe width="100%" height="100%" frameborder="0"></iframe><i class="lightdialog-close hidden"></i></div>');
            this.$iframe = this.$container.children('iframe');

            this.$closeIcon = this.$container.children('.lightdialog-close');

            this.$iframe[0].src = Util.getRightUrl(this.cfg.url);

            var self = this;
            this.$iframe.on('load', function(){
                self._doLoadIframe();
            });

            if(this.cfg.showModal) {
                this.$modal = $('<div class="lightdialog-modal hidden"></div>').appendTo('body');
            }

            if(this.cfg.showCloseButton) {
                this.$closeIcon.removeClass('hidden');
                this.$closeIcon.on('click', function(){
                    self.close();
                });
            }

            this.$container.appendTo('body');
        },

        _doLoadIframe: function() {
            var self = this;
            function CloseOwnerWindow(action) {
                var ret = true;
                try {
                    if (self.__onDestroy) ret = self.__onDestroy(action);
                } catch (ex) { }

                if (ret === false) {
                    return false;
                }

                setTimeout(function () {
                    self.close();
                }, 10);
            }

            try {

                this.$iframe[0].contentWindow.Owner = win;
                this.$iframe[0].contentWindow.CloseOwnerWindow = CloseOwnerWindow;
            } catch (e) { }

            if(this.__onLoad) {
                this.__onLoad();
            }
        },

        _doRemoveIFrame: function() {
            if(this.$iframe) {
                Util.clearIframe(this.$iframe);

                this.$iframe = null;
            }
        },

        show: function() {
            var winBox = Util.getWinSize(),
                width = parseInt(this.cfg.width, 10),
                height = parseInt(this.cfg.height),
                left = (winBox.width - width) / 2,
                top = (winBox.height - height) / 2;

            if(this.cfg.showModal) {
                this.$modal.css('z-index', Util.getZIndex()).removeClass('hidden');
            }

            this.$container.css({
                left: left,
                top: top,
                width: width,
                height: height,
                zIndex: Util.getZIndex()
            }).removeClass('hidden');
        },

        close: function(){
            this._doRemoveIFrame();

            this.$container.remove();
            this.$modal && this.$modal.remove();
        },

        getIFrameEl: function() {
            return this.$iframe ? this.$iframe[0] : undefined;
        }
    };

    var topWin;
    function getTopWin(me) {
        try {
            if (me.Util && me.Util.openLightDialog) topWin = me;
            if (me.parent && me.parent != me) {
                getTopWin(me.parent);
            }
        } catch (ex) { }
    }

    $.extend(Util, {
        openLightDialog: function(cfg) {
            var dialog = new LightDialog(cfg);
    
            dialog.show();
    
            return dialog;
        },
        openTopLightDialog: function(cfg) {
            topWin || getTopWin(win);
            topWin.Util.openLightDialog(cfg);
        }
    });
    
})(this, jQuery);
/*!
 * 其他通用的最页面功能效果增强的扩展
 */

// 隐藏页面loading效果
(function (win, $) {
    var $pageLoading = $('body > .page-loading');

    Util.hidePageLoading = function () {
        if (!$pageLoading.length) return;

        $pageLoading.fadeOut(300, function () {
            $pageLoading.remove();
        });
    };
}(this, jQuery));

// 添加对csrf防御处理
(function (win, $) {
    $.ajaxSetup({
        beforeSend: function (XMLHttpRequest) {
            var csrfcookie = Util.readCookie(win.CSRF_COOKIE_NAME || '_CSRFCOOKIE');
            if (csrfcookie) {
                XMLHttpRequest.setRequestHeader(win.CSRF_HD_NAME || 'CSRFCOOKIE', csrfcookie);
            }
        }
    });
}(this, jQuery));

// 浏览器检测提醒
(function () {
    // 非主界面无需加载
    if (!/^https?:\/\/.*\/fui\/pages\/themes\/(\w+)\/\1/i.test(location.href)) return;

    // 加载文件自动提醒
    Util.loadJs('frame/fui/js/widgets/browsertips/browsertips.js');
}());

// 阻止IE下退格键回退页面
(function (win, $) {
    if (Util.browsers.isIE) {
        $(document).on('keydown', function (e) {
            var keyCode = e.which;
            var elem = e.target;
            var name = elem.nodeName;
            if (keyCode == 8) {
                if (name != 'INPUT' && name != 'TEXTAREA' && elem.contentEditable != "true") {
                    return false;
                }
                var type_e = elem.type ? elem.type.toUpperCase() : '';
                if (name == 'INPUT' && (type_e != 'TEXT' && type_e != 'TEXTAREA' && type_e != 'PASSWORD' && type_e != 'FILE')) {
                    return false;
                }
                if (name == 'INPUT' && (elem.readOnly == true || elem.disabled == true)) {
                    return false;
                }
            }
        });
    }

}(this, jQuery));

// 为通过第三方安全检测，隐藏js库的版本号
(function ($, Mustache) {
    var d = new Date();
    var t = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('.');
    d = null;

    try {
        // jquery / jquery.ui 版本号
        $.fn.jquery = $.ui.version = t;
        // Mustache 版本号
        Mustache.version = t;
    } catch (err) {}
})(jQuery, this.Mustache);


// 重写 JSON.parse 方法，以支持电子交易那边不正常的用法
(function (win) {
    if (win.JSON && JSON.parse) {
        var _oParse = JSON.parse;

        JSON.parse = function (s) {
            if (typeof s == 'object') {
                return s;
            }

            return _oParse(s);
        };
    }
})(this);
// 添加对操作系统版本的标记，临时解决左右布局中切换按钮在win7系统下的显示不全问题
(function ($) {
    var version = navigator.userAgent,
        $document = $(document.documentElement);

    if (version.indexOf("Windows NT 5.1") > -1 || version.indexOf("Windows XP") > -1) {
        $document.addClass('winxp');
    } else if (version.indexOf("Windows 7") > -1 || version.indexOf("Windows NT 6.1") > -1) {
        $document.addClass('win7');
    } else if (version.indexOf("Windows NT 10.0") > -1 || version.indexOf("Windows 10") > -1) {
        $document.addClass('win10');
    }

})(jQuery);
// 需要加密的js的处理
(function(win, $) {
    if (!win.epoint) {
        win.epoint = {};
    }
    if (typeof epoint.encode == 'function') {
        return;
    }
    /**
     * 自定义编码函数
     *
     * @param input  要编码的数据
     */
    epoint.encode = function(input) {
        // 先进行utf-8编码,解决中文问题
        input = epoint.encodeUtf8(input);
        // 对%做replace替换
        input = input.replace(/%/g, '_PERCENT_');

        // 对所有字符做ascii码转换
        var output = '',
            chr1 = '',
            i = 0,
            l = input.length;
        do {
            // 取字符的ascii码
            chr1 = input.charCodeAt(i++);
            // 偏移比较复杂，这里做个递减
            chr1 -= i;
            // =分割便于后台解析
            output = output + '=' + chr1;
        } while (i < l);

        return output;
    };
})(this, jQuery);

(function(win, $) {
    if (!win.Util) {
        win.Util = {};
    }
    // atob/btoa polyfill for IE 9-
    // code from :https://github.com/davidchambers/Base64.js/blob/master/base64.js
    (function() {
        var object =
            typeof exports != 'undefined'
                ? exports
                : typeof self != 'undefined'
                ? self // #8: web workers
                : $.global; // #31: ExtendScript

        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        function InvalidCharacterError(message) {
            this.message = message;
        }
        InvalidCharacterError.prototype = new Error();
        InvalidCharacterError.prototype.name = 'InvalidCharacterError';

        // encoder
        // [https://gist.github.com/999166] by [https://github.com/nignag]
        object.btoa ||
            (object.btoa = function(input) {
                var str = String(input);
                for (
                    // initialize result and counter
                    var block, charCode, idx = 0, map = chars, output = '';
                    // if the next str index does not exist:
                    //   change the mapping table to "="
                    //   check if d has no fractional digits
                    str.charAt(idx | 0) || ((map = '='), idx % 1);
                    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
                    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
                ) {
                    charCode = str.charCodeAt((idx += 3 / 4));
                    if (charCode > 0xff) {
                        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
                    }
                    block = (block << 8) | charCode;
                }
                return output;
            });

        // decoder
        // [https://gist.github.com/1020396] by [https://github.com/atk]
        object.atob ||
            (object.atob = function(input) {
                var str = String(input).replace(/[=]+$/, ''); // #31: ExtendScript bad parse of /=
                if (str.length % 4 == 1) {
                    throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
                }
                for (
                    // initialize result and counters
                    var bc = 0, bs, buffer, idx = 0, output = '';
                    // get next character
                    (buffer = str.charAt(idx++));
                    // character found in table? initialize bit storage and add its ascii value;
                    ~buffer &&
                    ((bs = bc % 4 ? bs * 64 + buffer : buffer),
                    // and if not first of each 4 characters,
                    // convert the first 8 bits to one ascii character
                    bc++ % 4)
                        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
                        : 0
                ) {
                    // try to find character in table (0-63, not found => -1)
                    buffer = chars.indexOf(buffer);
                }
                return output;
            });
    })();

    /**
     * 将多个参数对象按照url参数对象规则合并到一个
     *
     * @param {Object} p1 合并到的参数对象
     * @param {...Object} ...param 其他参数对象
     * @returns {Object} 合并后的参数对象，修改p1生成
     * @example
     * assignUrlParams({a: '1', b: '1'}, {a: '1',b: '1',c: '1'}) => {"a": ["1","1"], "b": ["1","1"],"c": "1" }
     * !!这是一个专用于url上提取参数进行进行合并的情况 参数值为undefined、string 或者已经合并过的 array 不存在其他情况
     */
    function assignUrlParams(p1) {
        $.each([].slice.call(arguments, 1), function(i, param) {
            for (var k in param) {
                if (!Object.prototype.hasOwnProperty.call(param, k)) {
                    continue;
                }
                var type = Util._getType(p1[k]);
                if (type == 'undefined') {
                    p1[k] = param[k];
                } else if (type == 'string') {
                    p1[k] = [p1[k], param[k]];
                } else if (type == 'array') {
                    p1[k].push(param[k]);
                }
            }
        });
        return p1;
    }

    var _skipEncodeUrlArr;

    function needEncrypt(url) {
        // 未开启 则不用处理
        if (!Util.getFrameSysParam('security_urlparam_encode_enable')) {
            return false;
        }
        if (!_skipEncodeUrlArr) {
            _skipEncodeUrlArr = Util.getFrameSysParam('security_urlparam_encode_skipurl')
                ? Util.getFrameSysParam('security_urlparam_encode_skipurl')
                      .replace(/^;+|;+$/g, '')
                      .split(';')
                : [];
        }
        // 相对路径 【./ 或者 ../】
        if (/^(?:\.\/|\.\.\/)/.test(url)) {
            return !inList();
        }
        // 绝对路径
        // 同域名 检查配置
        // 不同域 直接不加密
        if (/^(http|https|ftp|data|ws|wss)/.test(url)) {
            var matchArr = url.match(/^(http|https|ftp|data|ws|wss):\/\/((?:\w|\.|-)+?)(:\d+)?\//) || [];
            // 三个组 协议 、 域名 、端口号
            var c = location.protocol + location.host;
            var p1 = matchArr[1] || '',
                h1 = (matchArr[2] || '') + (matchArr[3] || '');

            // 跨域 直接false
            if (c != p1 + ':' + h1) {
                return false;
            }
        }
        // 其他情况直接检查 是否在不需要处理的列表中
        return !inList();

        // 是否在配置的列表中
        function inList() {
            var res = false;
            $.each(_skipEncodeUrlArr, function(i, item) {
                if (url.indexOf(item) !== -1) {
                    res = true;
                    return false;
                }
            });
            return res;
        }
    }

    // 加密解密
    $.extend(win.Util, {
        // url 上加密参数的特定名称
        URL_ENCRYPT_PARAM_NAME: 'frameUrlSecretParam',
        // url 是否包含加密参数的正则
        _hasUrlEncryptedReg: /[?&]frameUrlSecretParam=/,
        // 请求体中加密的参数的特定名称
        BODY_ENCRYPT_PARAM_NAME: 'frameBodySecretParam',
        /**
         * 将参数对象拼接为 url 参数格式
         *
         * @param {Object} obj 要处理的参数对象
         * @returns {String} 拼完成的字符串
         * @example
         * {a:[1,2,3],b:1}  =>  'a=1&a=2&a=3&b=1'
         * {a:[1,2,3],b:1,c:{name:'c'}}  =>  "a=1&a=2&a=3&b=1&c={"name":"c"}"
         */
        _joinUrlParams: function(obj) {
            var arr = [];
            $.each(obj, function(k, v) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    var type = Util._getType(v),
                        str = '';
                    if (type == 'array') {
                        // 数组拆分为多个 &
                        // 'a=' + [1,2,3].join('&a=')
                        // "a=1&a=2&a=3"
                        str += encodeURI(k + '=' + v.join('&' + k + '='));
                    } else if (type == 'string') {
                        // 字符串直接拼接
                        str += encodeURI(k + '=' + v);
                    } else {
                        // 其他直接 转字符串
                        str += encodeURI(k + '=' + JSON.stringify(v));
                    }
                    arr.push(str);
                }
            });

            return arr.join('&');
        },
        /**
         * 字符串加密 （先 encodeURIComponent 在 转 base64 再 encodeURIComponent）
         *
         * @param {String} str 要处理的字符串
         * @returns {String} 加密后的字符串
         */
        encrypt: function(str) {
            if ('string' != Util._getType(str)) {
                throw new Error('The argument must be string!');
            }
            // var output = win.btoa(win.encodeURI(str));
            var output = win.encodeURIComponent(win.btoa(win.encodeURIComponent(str)));
            return output;
        },
        /**
         * 字符串解密 （先 decodeURIComponent 再 base64还原 再 decodeURIComponent ）
         *
         * @param {String} str 要处理的字符串
         * @returns {String} 解密后的字符串
         */
        decrypt: function(str) {
            if ('string' != Util._getType(str)) {
                throw new Error('The argument must be string!');
            }
            // var output = win.decodeURI(win.atob(str));
            var output = win.decodeURIComponent(win.atob(win.decodeURIComponent(str)));
            return output;
        },
        /**
         * 获取url上的参数
         *
         * @param {String} url 要处理的url
         * @param {String} prop 要获取的属性名，省略时获取所有参数
         * @returns {String | Object | undefined}
         */
        _getUrlParams: function(url, prop) {
            if (!url) {
                url = location.search;
            } else {
                url = Util.removeHash(url);
            }

            var idx = url.indexOf('?');
            if (idx === -1) {
                return prop ? undefined : {};
            }

            var query = url.substr(idx + 1);

            if (!query.length) {
                return prop ? undefined : {};
            }

            var params = urlParams2Obj(query);

            var result;

            // 如果url是加密的 尝试需要先解密
            if (params[Util.URL_ENCRYPT_PARAM_NAME]) {
                var decryptStr = Util.decrypt(params[Util.URL_ENCRYPT_PARAM_NAME]);
                // 将加密参数解密 并合并到 普通参数中
                delete params[Util.URL_ENCRYPT_PARAM_NAME];
                result = assignUrlParams(params, urlParams2Obj(decryptStr));
            } else {
                result = params;
            }

            return prop ? result[prop] : result;

            function urlParams2Obj(queryStr) {
                var params = {};
                $.each(queryStr.split('&'), function(i, item) {
                    // base64 编码情况下 base64尾部可能是有 0~2个 = 的 不能直接split
                    var splitIdx = item.indexOf('=');
                    var k, v;
                    if (splitIdx !== -1) {
                        k = item.substr(0, splitIdx);
                        v = win.decodeURIComponent(item.substr(splitIdx + 1));
                    } else {
                        k = item;
                        v = '';
                    }
                    var type = Util._getType(params[k]);

                    if (type == 'undefined') {
                        params[k] = v;
                    } else if (type == 'string') {
                        params[k] = [params[k], v];
                    } else if (type == 'array') {
                        params[k].push(v);
                    }
                });
                return params;
            }
        },
        getUrlParams: function(prop) {
            return Util._getUrlParams(location.search, prop);
        },
        /**
         * 对 ajax 请求的参数加密
         *
         * @param {string} url 请求地址
         * @param {Object} data 请求的数据
         * @returns
         */
        encryptAjaxParams: function(url, data) {
            // 需要加密
            if (needEncrypt(url)) {
                var d = {};
                var encryptStr = Util.encrypt(mini.encode(data));
                d[Util.BODY_ENCRYPT_PARAM_NAME] = encryptStr;
                return d;
            }

            return data;
        },
        /**
         * 对url上的参数进行加密 返回加密后的url
         * @param {string | undefined} url 要处理的 url 为空时取当前页面url
         * @returns 对参数加密后的url
         */
        encryptUrlParams: function(url, force) {
            if (!url) {
                url = location.href;
            }
            var hash = Util.getHash(url);
            url = Util.removeHash(url);

            var idx = url.indexOf('?');
            // 无参数
            // 框架已经加密的不再加密
            if (idx === -1 || /complexUrlSecretParam/i.test(url)) {
                return url + hash;
            }

            // 检查是否要加密
            if (!needEncrypt(url) && !force) {
                return url + hash;
            }

            var params = Util._getUrlParams(url);

            // 若空参数 非强制则不处理
            if ($.isEmptyObject(params)) {
                return url + hash;
            }

            // 对参数进行加密处理
            var encryptedParams = Util.URL_ENCRYPT_PARAM_NAME + '=' + Util.encrypt(Util._joinUrlParams(params));

            // 重组url
            var baseUrl = url.substring(0, idx);
            return baseUrl + '?' + encryptedParams + hash;
        },
        /**
         * 解密 url参数 返回
         * @param {string | undefined} url 要处理的 url 为空时取当前页面url
         * @returns 将参数进行解密后的url
         */
        decryptUrlParams: function(url) {
            if (!url) {
                url = location.href;
            }
            var hash = Util.getHash(url);
            url = Util.removeHash(url);
            // 未加密 直接返回
            if (!Util._hasUrlEncryptedReg.test(url)) {
                return url + hash;
            }
            var params = Util._getUrlParams(url);
            return url.substr(0, url.indexOf('?') + 1) + Util._joinUrlParams(params) + hash;
        },
        /**
         * 在url上新增参数 内部会自动处理加密逻辑
         *
         * @param {String} url 要处理的url
         * @param {Object} params 要新增的参数 ，键值对形式
         * @param {String} mode 重名参数处理方式 可选值 normal、 replace、 ignore
         * 默认为 normal 即 URLSearchParams 标准规范规则 重名参数构成数组
         * replace 用新参数替换原有重名参数
         * ignore 存在重名参数时保留之前的值，忽略新加入的
         * @returns {String} 处理完成后的url
         */
        addUrlParams: function(url, params, mode, noEncryption) {
            if ('string' != Util._getType(url)) {
                throw new Error('The first argument [url] must be string!');
            }
            if ('object' != Util._getType(params)) {
                throw new Error('The second argument [params] must be object!');
            }
            var hash = Util.getHash(url);
            url = Util.removeHash(url);
            // 获取原有参数
            var originParams = Util._getUrlParams(url) || {},
                isEncrypted = Util._hasUrlEncryptedReg.test(url);

            // 与新参数合并
            switch (mode) {
                case 'replace':
                    originParams = $.extend(originParams, params);
                    break;
                case 'ignore':
                    originParams = $.extend({}, params, originParams);
                    break;
                default:
                    originParams = assignUrlParams(originParams, params);
                    break;
            }

            var paramsStr = '';
            // 如果为加密 则需要重新加密
            if (!noEncryption && (needEncrypt(url) || isEncrypted)) {
                // var obj = {};
                // obj[Util.URL_ENCRYPT_PARAM_NAME] = Util.encrypt(Util._joinUrlParams(originParams));
                // paramsStr = Util._joinUrlParams(obj);

                paramsStr = Util.URL_ENCRYPT_PARAM_NAME + '=' + Util.encrypt(Util._joinUrlParams(originParams));
            } else {
                paramsStr = Util._joinUrlParams(originParams);
            }

            var idx = url.indexOf('?'),
                newBaseUrl = idx !== -1 ? url.substring(0, idx) : url;

            return newBaseUrl + '?' + paramsStr + hash;
        }
    });

    // 如果启用了加密  直接重新win.open方法 对传入url进行预处理
    win.originOpen = win.open;
    var supportApply = typeof win.open.apply === 'function';
    if (Util.getFrameSysParam('security_urlparam_encode_enable')) {
        win.open = supportApply
            ? function(url) {
                url = Util.encryptUrlParams(url);
                var extArgs = [].slice.call(arguments, 1);

                return win.originOpen.apply(win, [url].concat(extArgs));
            }
            : function(url) {
                url = Util.encryptUrlParams(url);
                var extArgs = [].slice.call(arguments, 1);
                if (extArgs[1] !== void 0) {
                    return win.originOpen(url, extArgs[0], extArgs[1]);
                }
                if (extArgs[0] !== void 0) {
                    return win.originOpen(url, extArgs[0]);
                }
                return win.originOpen(url);
            };
    }
})(this, jQuery);

/*!
 * commondto
 */
(function (win, $) {
    var CommonDto = function (formId, action, isRefresh, initHook) {
        // minui的form对象集合
        this.forms = [];
        // 需要手动验证的控件
        // 即不属于表单控件，但是又需要验证的（表格控件）
        this.extraValidateControl = [];

        this.action = action;
        this.isRefresh = isRefresh;
        // setData中，每次控件设置完值后的回调
        // 方便外部在给控件设值时做一些额外操作，避免外部在需要对控件做额外处理时重新遍历控件
        this.initHook = initHook;

        if (formId != '@none') {
            if (!formId || formId == '@all') {
                this.forms.push(new mini.Form(document.body));
            } else {
                if (!mini.isArray(formId)) {
                    formId = [formId];
                }

                for (var i = 0, len = formId.length; i < len; i++) {
                    if (typeof formId[i] == 'string' && formId[i].substr(0, 1) != '#') {
                        formId[i] = '#' + formId[i];
                    }
                    this.forms.push(new mini.Form(formId[i]));
                }
            }
        }

        this._init();
    };

    // 所有布局控件，允许控件的嵌套，但本身不会加到commonDto中
    var LAYOUT_CONTROL = ['fit', 'panel', 'window', 'splitter', 'layout',
        'toolbar', 'tabs', 'outlookbar', 'popup', 'include', 'repeat', 'button', 'calendar'
    ];

    // 优化 by liub 2017-08-16
    // 当前页面路径
    // 从CommonDto._initFields中移到了外面，因为该值只需计算一次
    var requestMapping = (function () {
        var loc = Util.getSafeLocation();
        var url = loc.protocol + '//' + loc.host + loc.pathname;
        var root = Util.getRootPath();
        return Util.getRightUrl('rest/' + url.substring(root.length, url.lastIndexOf('/')));
    })();

    function getByField(data, field, value) {
        for (var i = 0, len = data.length; i < len; i++) {
            if (data[i][field] == value) {
                return data[i];
            }
        }
        return null;
    }

    CommonDto.prototype = {
        constructor: CommonDto,

        _init: function () {
            var controls = null;

            // 控件集合
            this.controlArr = [];

            // 获取form集合下的所有miniui控件
            for (var i = 0, len = this.forms.length; i < len; i++) {
                controls = mini.getChildControls(this.forms[i]);
                this.controlArr = this.controlArr.concat(controls);
            }

            this._initFields();
        },

        // 初始化所有控件（用于后台CommonDto）的配置信息
        _initFields: function () {
            this.fields = {};

            var lastControl = null,
                control = null;

            for (var i = 0, len = this.controlArr.length; i < len; i++) {
                control = this.controlArr[i];

                if ((!lastControl || !mini.isAncestor(lastControl.el, control.el)) && LAYOUT_CONTROL.indexOf(control.type) == -1) {

                    // 排除mini-popup中的子控件
                    if (mini.findParent(control.el, 'mini-popup', 2)) {
                        continue;
                    }

                    // 排除部分内部控件
                    if (lastControl && mini.isAncestor(control.el, lastControl.el)) {
                        // 上一个控件是当前控件的子控件，说明上一个控件是当前控件的内部控件，去除上一个控件
                        this.fields[lastControl.id] = null;
                        delete this.fields[lastControl.id];
                    }

                    lastControl = control;

                    // 如果既没有设置bind又没有设置action，则表示不需要与后台交互
                    if (!control.bind && !control.action) {
                        continue;
                    }

                    // 根据action设置控件url
                    if (this.action) {
                        this._setControlUrl(control);
                    }

                    var field = {
                        'id': control.id,
                        'bind': control.bind,
                        'type': control.type,
                        'action': $.trim(control.action)
                    };

                    // format是控件的标准属性，用来控制显示格式，需要提交给后台
                    if (control.format) {
                        field.format = control.format;
                    }
                    if (control['data-options']) {
                        field.dataOptions = control['data-options'];
                    }

                    if (control.mapClass) {
                        field.mapClass = control.mapClass;
                    }

                    if (control.isUserControl) {
                        field.type = 'UserControl';

                        // 优化 by liub 2017-08-16
                        // usercontrol就不需要再扩展了
                    } else {
                        // 根据type，即控件类型，来扩展字段
                        switch (field.type) {
                            case 'checkboxlist':
                            case 'radiobuttonlist':
                            case 'autocomplete':
                                $.extend(field, {
                                    textField: control.textField,
                                    valueField: control.valueField
                                });
                                break;
                            case 'combobox':
                                $.extend(field, {
                                    textField: control.textField,
                                    valueField: control.valueField,
                                    pinyinField: control.pinyinField,
                                    // 控件是没有datasourcename这个属性的，先去掉
                                    // datasourcename: control.datasourcename,
                                    columns: this._parseColumn(control.columns)
                                });
                                break;
                            case 'datagrid':
                                $.extend(field, this._parseDataDrid(control));
                                // 表格控件需要手动的调用验证
                                this.extraValidateControl.push(control);
                                break;
                            case 'listbox':
                                $.extend(field, {
                                    textField: control.textField,
                                    valueField: control.valueField,
                                    columns: this._parseColumn(control.columns)
                                });
                                break;
                            case 'lookup':
                                $.extend(field, {
                                    textField: control.textField,
                                    valueField: control.valueField,
                                    grid: this._parseDataDrid(control.grid)
                                });
                                break;
                            case 'tree':
                                $.extend(field, this._parseTree(control));
                                break;
                            case 'filtertree':
                                $.extend(field, this._parseTree(control));
                                if (field.type == 'tree-nested') {
                                    field.type = "filtertree-nested";

                                } else {
                                    field.type = "filtertree-non-nested";
                                }
                                break;
                            case 'treeselect':
                                $.extend(field, this._parseTree(control.tree));
                                if (field.type == 'tree-nested') {
                                    field.type = "treeselect-nested";

                                } else {
                                    field.type = "treeselect-non-nested";
                                }

                                $.extend(field, {
                                    textField: control.textField,
                                    valueField: control.valueField,
                                    pinyinField: control.pinyinField
                                });
                                break;
                            case 'treegrid':
                                $.extend(field, this._parseTreeGrid(control));
                                break;
                            case 'pagertree':
                                $.extend(field, this._parsePagerTree(control));
                                break;
                            case 'tabstreeselect':
                                var treeField = this._parseTree(control.tree);
                                field.tree = treeField;
                                break;
                            case 'verifycode':
                                field.width = control.width;
                                field.height = control.height;
                                field.charLength = control.charLength;
                                field.ignorecase = control.ignorecase;
                                break;
                            case 'webuploader':
                            case 'largefileuploader':
                                field.showDefaultUI = control.showDefaultUI;
                                // field.fileSizeLimitFromServer = control.fileSizeLimitFromServer;
                                // field.limitTypeFromServer = control.limitTypeFromServer;
                                // // 全局中配置了属性默认值需要从后端取
                                // if(win.mini_attrValue_fromServer) {
                                //     // 如果页面上未显示配置false，则需要将值强制设为true
                                //     if(field.fileSizeLimitFromServer !== false) {
                                //         field.fileSizeLimitFromServer = true;
                                //     }
                                //     if(field.limitTypeFromServer !== false) {
                                //         field.limitTypeFromServer = true;
                                //     }
                                // }
                                break;
                                // 导出控件新增exportAction属性用来个性化指定后台导出处理方法
                            case 'dataexport':
                                field.exportAction = control.exportAction;
                                break;
                            default:
                                break;
                        }
                    }

                    this.fields[field.id] = field;
                }
            }
        },

        _setControlUrl: function(control) {
            var loadControl = null,
                url = '',
                autoLoad = false;
            if (control.getUrl && !control.getUrl()) {
                url = requestMapping + '/' + this.action;
                // 验证码控件特殊处理，直接设置页面的action为
                if (control.type == 'verifycode') {
                    // rest形式的url需要加上isCommondto=true
                    url += '/page_load?isCommondto=true';
                    control.setUrl(url);
                } else if (control.action) {
                    // treeSelect特殊处理
                    if (control.type == 'treeselect' || control.type == 'tabstreeselect' || control.type == 'treelistselect') {
                        loadControl = control.tree;
                        // 把action传递到子控件
                        loadControl.set({
                            action: control.action
                        });

                    } else {
                        if (control.type === 'dataimport' || control.type === 'catalogimport') {
                            control.uploader.setAction(control.action);
                        }
                        loadControl = control;
                    }
                    // 把control上的action加到url上
                    url += '/' + control.action;

                    autoLoad = loadControl.getAutoLoad ? loadControl.getAutoLoad() : false;

                    // 先禁用autoLoad功能
                    if (autoLoad) {
                        loadControl.setAutoLoad(false);
                    }

                    control.setUrl(url);

                    // 再开启autoLoad功能
                    if (autoLoad) {
                        loadControl.setAutoLoad(true);
                    }
                }
            }

            // 导出控件action特殊处理
            if (control.type == 'dataexport') {
                // action不传给后台，所以url中必须要带上方法
                if (control.action) {
                    url = requestMapping + '/' + this.action + '/' + control.action;
                    control.setExportUrl(url);
                }

            }

            // 上传控件没有setUrl方法，需要特殊处理下
            if (control.type == 'webuploader' || control.type == 'largefileuploader') {
                // 有设置action，但只设置了方法名，未带上action名，需要自动加上页面action
                if (control.action && control.action.indexOf('.') == -1) {
                    control.setAction(this.action + '.' + control.action);
                }
            }
        },

        // 增加一个控件配置信息
        addField: function (field) {
            this.fields[field.id] = field;
        },

        // 根据控件id，获取配置信息
        getField: function (id) {
            return this.fields[id];
        },

        // 根据控件id，移除配置信息
        removeField: function (id) {
            this.fields[id] = null;
            delete this.fields[id];
        },

        // 根据后台返回的json数据，设置控件的值（data、value）或数据源(url)
        // 一般用于页面控件的初始化
        setData: function (data, customData) {

            for (var i = 0, len = data.length; i < len; i++) {
                var item = data[i],
                    control = mini.get(item.id),
                    pageSize;

                if (control) {
                    if (item.data) {
                        if (control.uiCls == "mini-datagrid" || control.uiCls == "mini-pagertree" || control.uiCls == "mini-treegrid") {
                            // 所有刷新都回到首页
                            if (this.isRefresh) {
                                control.setPageIndex(0);

                            } else if (item.pageIndex !== undefined) {
                                // 在删除记录重新刷新页面时，可能当前页已没数据，后端会自动往前查一页数据，并把页码数返回过来，这里需要把页码数重新更新一下
                                control.setPageIndex(item.pageIndex);
                            }

                            // 由于pagertree、treegrid有树形结构，不能同一调用setData方法
                            // 设置表格数据
                            // control.setData(item.data);
                            // 设置分页栏状态
                            if (item.total !== undefined) {
                                control.setTotalCount(item.total);

                            }

                            // 经过commondto刷新的数据，手动展开收缩的节点都已重置了，所以需要将对应的缓存数据也重置
                            // 重置有问题，刷新后的数据展开状态没有变，再次刷新，展开状态就丢了
                            // if (control.uiCls == "mini-pagertree") {
                            //     control._collapseNodes = [];
                            //     control._expandNodes = [];
                            // }

                            // // 添加服务端设置pageSize的功能
                            // // 条件是服务端返回pageSize，并且满足下面两个中的任一个：
                            // // 1.控件显示的配置了pageSizeFromServer为true
                            // // 2.全局配置mini_attrValue_fromServer为true并且控件没有显示设置pageSizeFromServer为false
                            // pageSize = item.pageSize;
                            // if(pageSize && (control.pageSizeFromServer || (win.mini_attrValue_fromServer && control.pageSizeFromServer !== false))) {
                            //     control.setPageSize(pageSize);
                            //     control.setSizeList([pageSize, pageSize * 2, pageSize * 5, pageSize * 10]);
                            // }


                        }
                        if (control.loadList) {
                            // 表格树是不支持分页的，所以不用处理分页相关的步骤
                            // 树，表格树的加载数据方法需根据resultAsTree的值来确定是用loadList还是setData方法
                            if (control.getResultAsTree()) {
                                control.setData(item.data);
                            } else {
                                control.loadList(item.data);
                            }
                        } else if (control.setData) {
                            // if (control.type == 'webuploader' || control.type == 'largefileuploader') {
                            //     // 优化 by liub 2017-08-16
                            //     // clearFile方法是会发请求告诉后端删除附件的，这里调用不适合
                            //     // control.clearFile();

                            //     // // 如果后端返回了fileSizeLimit，并且控件上也设置了需要从后端取值，则需要把后端的值设置到控件上
                            //     // if(item.fileSizeLimit && control.fileSizeLimitFromServer) {
                            //     //     control.setFileSizeLimit(item.fileSizeLimit);
                            //     // }

                            //     // if(item.limitType && control.limitTypeFromServer) {
                            //     //     control.setLimitType(item.limitType);
                            //     // }
                            // }
                            control._dataSource &&  (control._dataSource.loaded = true);
                            control.setData(item.data);
                        }

                        // 触发控件的onload事件
                        control.fire('load', {
                            data: item.data
                        });

                    }
                    // 与后端约定好，没有值用null表示
                    if (item.value !== null && item.value !== undefined) {
                        // 添加控件数据个性化加密功能
                        if(control.needEncrypt && epoint.decryptVal) {
                            item.value = epoint.decryptVal(item.value);
                        }
                        // checkbox控件setValue方法参数只能是true/false，值必须通过setChecked方法来设置
                        if (control.type == 'checkbox') {
                            control.setChecked(item.value);
                        } else {
                            // webeditor控件的值中可能存在被处理过的字符，需要把它还原出来
                            if (control.type == 'webeditor' && item.value) {
                                item.value = item.value.replace(/Java&Scr&ipt/g, 'JavaScript');
                            }
                            control.setValue(item.value);
                        }
                    }
                    if (item.text && control.setText) {
                        control.setText(item.text);
                    }
                    if (item.url) {
                        var autoLoad = control.getAutoLoad();

                        // 先禁用autoLoad功能
                        if (autoLoad) {
                            control.setAutoLoad(false);
                        }
                        control.setUrl(item.url);

                        // 再开启autoLoad功能
                        if (autoLoad) {
                            control.setAutoLoad(true);
                        }
                    }

                    // 控件状态都是通过个性化回调来做的，这边先注释掉
                    // 设置控件状态
                    // if (item.visible === false) {
                    //     control.hide();
                    // } else if (item.visible === true) {
                    //     control.show();
                    // }

                    // if (item.enable === false) {
                    //     control.disable();
                    // } else if (item.enable === true) {
                    //     control.enable();
                    // }

                    if (this.initHook) {
                        this.initHook(control, item, customData);
                    }
                } else if (item.id == '_common_hidden_viewdata') {
                    // 设置了隐藏域则自动往页面中加一个隐藏域
                    var hidden = new mini.Hidden();

                    hidden.setId('_common_hidden_viewdata');

                    hidden.render(document.body);

                    hidden.setValue(item.value);
                }
            }
        },

        // 获取所有控件的配置信息集合
        // 一般用于二次请求的请求数据
        // original，false|undefined则按照CommonDto方式来组织数据，true则不做处理
        getData: function (original) {
            var control = null,
                data = null,
                fields = {},
                field, i, id, value;

            // 优化 by liub 2017-08-16
            // 不需要循环遍历页面上的所以控件this.controlArr，只需遍历需要的字段this.fields
            // for (i = 0, len = this.controlArr.length; i < len; i++) {
            //     control = this.controlArr[i];
            //     value = control.getValue();

            //     // treegrid有getValue方法，但是应该走grid的逻辑
            //     if (value !== undefined && control.type != 'treegrid') {
            //         id = control.getId();

            //         if (this.fields[id]) {
            //             // webeditor控件的值中可能会包含后台安全策略里的一些敏感字，需要把它转义
            //             if (control.type == 'webeditor') {
            //                 value = value.replace(/javascript/gi, 'Java&Scr&ipt');
            //                 // 控件中的尖括号进行替换
            //                 // 因安全扫描问题添加， 仅在提交数据时进行替换，返回时无需处理。
            //                 value = value.replace(/>/g, '_EpRightBracket_').replace(/</g, '_EpLeftBracket_');
            //             }
            //             // output outputtext 不是可编辑控件，值无需传给后台，直接赋值为空
            //             if (control.type === 'output' || control.type === 'outputtext') {
            //                 value = '';
            //             }
            //             // value值除了日期控件一律转化为string，以方便后台处理
            //             this.fields[id].value = value;
            //             if (!mini.isDate(value)) {
            //                 this.fields[id].value += '';
            //             }


            //             if (control.getText) {
            //                 this.fields[id].text = control.getText();
            //             }
            //         }

            //     } else if (control.type == 'datagrid' || control.type == 'treegrid' || control.type == 'pagertree') {
            //         var idField = control.getIdField(),
            //             selectedData = control.getAllSelecteds ? control.getAllSelecteds() : control.getSelecteds(),
            //             temp;

            //         id = control.getId();
            //         if (this.fields[id]) {
            //             if (control.isEditing()) {
            //                 data = control.getEditData();
            //                 this.fields[id].staticEdit = true;
            //             } else {
            //                 data = control.getChanges(null, true);
            //             }

            //             for (var j = 0, l = selectedData.length; j < l; j++) {
            //                 var item = null;
            //                 // if (selectedData[j]) {
            //                 item = getByField(data, idField, selectedData[j][idField]);
            //                 // }

            //                 if (item) {
            //                     item._checked = true;
            //                 } else {
            //                     temp = {
            //                         _checked: true
            //                     };
            //                     temp[idField] = selectedData[j][idField];
            //                     data.push(temp);
            //                 }
            //             }

            //             this.fields[id].data = data;
            //         }

            //     }
            // }

            var hidden = mini.get('_common_hidden_viewdata');

            for (i in this.fields) {
                if ({}.hasOwnProperty.call(this.fields, i)) {
                    field = this.fields[i];
                    id = field.id;
                    control = mini.get(id);

                    if (control) {
                        value = control.getValue();

                        // treegrid有getValue方法，但是应该走grid的逻辑
                        if (value !== undefined && control.type != 'treegrid') {
                            // webeditor控件的值中可能会包含后台安全策略里的一些敏感字，需要把它转义
                            if (control.type == 'webeditor') {
                                // epoint_deal_webeditor 开放给外部处理编辑器中的内容
                                // 需求来自对于编辑器内容死链接的处理
                                if (typeof epoint.onBeforeDealWebeditor == 'function') {
                                    value = epoint.onBeforeDealWebeditor(value);
                                }
                                if (Util.getFrameSysParam('enableFrontSpecialEncode')) {
                                    // javascript/script这两个都是关键字，会被后台安全模块拦截，将它替换成Java&Scr&ipt
                                    value = value.replace(/javascript/gi, 'Java&Scr&ipt');
                                    // 控件中的尖括号进行替换
                                    // 因安全扫描问题添加， 仅在提交数据时进行替换，返回时无需处理。
                                    value = value.replace(/>/g, '_EpRightBracket_').replace(/</g, '_EpLeftBracket_');
                                }
                            }
                            // output outputtext 不是可编辑控件，值无需传给后台，直接赋值为空
                            if (control.type === 'output' || control.type === 'outputtext') {
                                value = '';
                            }
                            if (control.type === 'daterangepicker') {
                                value = mini.encode(value);
                            }
                            // value值除了日期控件一律转化为string，以方便后台处理
                            field.value = value;
                            if (!mini.isDate(value)) {
                                field.value += '';
                            }

                            if(control.needEncrypt && epoint.encryptVal) {
                                field.value = epoint.encryptVal(field.value);
                            }

                            /*
                             * 项目中出现checkboxlist控件的text中包含html标签（为了标红强调一些文字），提交时就被安全模块拦截了
                             * 与liufl沟通，提交时可以不需要text，故将下面设置text的代码注释掉
                             */
                            // if (control.getText) {
                            //     field.text = control.getText();
                            // }

                            /**
                             * 修改后发现树相关控件：Tree、TabsTreeSelect和treeselect控件后端取值出现了问题，后端模型中的selectitem必须要有text和value两个字段
                             * 所以对于Tree、TabsTreeSelect和treeselect控件仍需带上text
                             * Tree控件的getText方法已将text中的html标签去除了，所以不需做额外处理
                             * 
                             * AutoComplete 控件服务端需要通过text来进行过滤，所以需要带上text
                             */
                            // if (control.type == 'tabstreeselect' || control.type == 'treeselect' || control.type == 'tree' || control.type == 'autocomplete') {
                            //     this.fields[id].text = control.getText();
                            // }

                            /**
                             * 修改后慢慢发现有很多控件还是需要text的
                             * 并且政务服务项目上反馈有些个性化的地方就是需要获取到控件的text
                             * 故将text还原回来，改为统一去除text中可能存在的html标签
                             */
                            if (control.getText) {
                                // 安全整改后允许客户端输入任意字符，所以不需要将html标签去除了
                                // field.text = (control.getText() || '').replace(/<\/?.+?>/g, "");
                                field.text = control.getText() || '';

                            }
                        } else if (control.type == 'datagrid' || control.type == 'treegrid' || control.type == 'pagertree') {
                            var idField = control.getIdField(),
                                selectedData = control.getAllSelecteds ? control.getAllSelecteds() : control.getSelecteds(),
                                temp;

                            if (control.isEditing()) {
                                data = control.getEditData();
                                field.staticEdit = true;
                            } else {
                                // 政务服务反馈对于treegrid控件后端需要获取到完整的一行数据
                                // 这边先将提交数据改为完整数据
                                data = control.getChanges(null, control.type != 'treegrid');
                            }
                            var item = null,
                                j = 0,
                                l = selectedData.length;
                            for (; j < l; j++) {

                                // if (selectedData[j]) {
                                item = getByField(data, idField, selectedData[j][idField]);
                                // }

                                if (item) {
                                    item._checked = true;
                                } else {
                                    temp = {
                                        _checked: true
                                    };
                                    temp[idField] = selectedData[j][idField];
                                    data.push(temp);
                                }
                            }

                            // 安全整改后，要求前端不用再对输入的数据做处理，用户输入什么就提交什么
                            // 提交数据前需要把表格单元格中转义的html标签还原回来
                            for (j = 0, l = data.length; j < l; j++) {
                                item = data[j];

                                for (var key in item) {
                                    if ({}.hasOwnProperty.call(item, key)) {
                                        item[key] = mini.htmlUnescape(item[key]);
                                    }
                                }
                            }

                            // pagertree 控件的节点展开状态需要改在刷新数据时也要保持
                            if (control._getEcConfig) {
                                field.__ecconfig = control._getEcConfig();
                            }

                            field.data = data;

                        }

                        // 为了解决同时打开多个tab，都有验证码，并且bind同一个后台方法时，后台区分哪个验证码，加上了一个uuid
                        // 提交数据时将uuid带回去
                        if (control.type == 'verifycode') {
                            field.uuid = control.uuid;
                        }
                        fields[i] = field;
                    }
                }
            }

            if (!fields['_common_hidden_viewdata']) {
                fields['_common_hidden_viewdata'] = {
                    id: '_common_hidden_viewdata',
                    type: 'hidden',
                    value: this._getParentLoginId()
                };

            }

            if (hidden) {
                fields['_common_hidden_viewdata'].value = hidden.getValue();
            }

            if (original) {
                return fields;
            }

            data = [];

            for (i in fields) {
                data.push(fields[i]);
            }

            // return {
            //     commonDto: mini.encode(data, "yyyy-MM-dd HH:mm:ss").replace(/'/g, '_EpSingleQuotes_')
            // };

            // 框架安全模块功能变更，可以通过配置来决定是否对特殊字符进行编码
            data = mini.encode(data, "yyyy-MM-dd HH:mm:ss");

            if (Util.getFrameSysParam('enableFrontSpecialEncode')) {
                data = data.replace(/'/g, '_EpSingleQuotes_');
            }

            return {
                commonDto: data
            };
        },

        // 初始化页面上指定form下的所有控件
        init: function (opts) {
            var that = this,
                data = this.getData();

            if (opts.params) {
                if (Util.getFrameSysParam('enableFrontSpecialEncode')) {
                    // 外部参数不能统一处理尖括号、javascript关键字等，这些处理应该只针对富文本编辑器的内容
                    // 在方法里是无法判断传进来的参数的来源，所以只能在外部自己决定是是否处理尖括号、javascript关键字
                    data["cmdParams"] = opts.params.replace(/'/g, '_EpSingleQuotes_');
                } else {
                    data["cmdParams"] = opts.params;
                }
            }
            // 如果需要加密 替换为加密格式
            data = Util.encryptAjaxParams(opts.url, data);
            // 防止响应过快而添加遮罩又移除的卡顿感
            var miniMaskTimer;
            if (!opts.notShowLoading) {
                miniMaskTimer = setTimeout(function () {
                    mini.mask({
                        cls: 'mini-mask-loading'
                    });
                }, 200);
            }
            $.ajax({
                // url在传入前外部已处理
                url: opts.url,
                type: "post",
                dataType: 'json',
                data: data,
                statusCode: Util._handleStatusCode(),
                success: function (data) {
                    if(data[Util.BODY_ENCRYPT_PARAM_NAME]) {
                        data = Util.decrypt(data[Util.BODY_ENCRYPT_PARAM_NAME]);
                        data = mini.decode(data);
                    }
                    var status = data.status,
                        controls = data.controls,
                        custom = data.custom || '',

                        code = parseInt(status.code, 10),

                        text = status.text || '',
                        url = status.url,
                        tipTxt = (code === 1 || code === 200) ? '成功' : '失败',
                        tipType = (code === 1 || code === 200) ? 'success' : 'danger';

                    // custom 中是允许返回普通字符串的，所以不能用JSON.parse去处理
                    // if (custom && (typeof custom !== 'object')) {
                    //     custom = JSON.parse(custom);
                    // }

                    //有url，则先跳转
                    if (url) {
                        if (url.indexOf('http') !== 0) {
                            url = Util.getRightUrl(url);
                        }
                        var aimWindow = status.top ? top : window;
                        if (aimWindow.Util && aimWindow.Util.getSafeLocation) {
                            aimWindow.Util.getSafeLocation().setHref(url);
                        } else {
                            aimWindow.location.href = url;
                        }
                        return;
                    }
                    if (text) {
                        mini.showTips({
                            content: "<b>" + tipTxt + "</b> <br/>" + text,
                            state: tipType,
                            x: 'center',
                            y: 'top',
                            timeout: 3000
                        });
                    }

                    if ((code === 1 || code === 200)) {
                        // 在设置控件值前，提供一个全局的事件，方便外部做一些个性化处理
                        // 由panqing提出省OA中表格控件在drawcell事件中需要根据custom中返回的数据来生成单元格内容
                        // 在表格设置数据前，需要先处理custom中的数据
                        if (typeof epoint.onPreload === 'function') {
                            epoint.onPreload(controls, custom);
                        }

                        controls.length && that.setData(controls, custom);

                        // 条件区域中的checkboxlist数据加载完后，可能会被遮住，需重新调整content布局的高度
                        if (win.adjustContentHeight) {
                            adjustContentHeight();
                        }
                        opts.done && opts.done.call(that, custom);
                    } else {
                        //操作失败
                        text = text ? text : '操作失败';

                        mini.showTips({
                            content: "<b>错误提示</b> <br/>" + text,
                            state: 'danger',
                            x: 'center',
                            y: 'top',
                            timeout: 3000
                        });
                    }

                    // // 移除遮罩
                    // if (!opts.notShowLoading) {
                    //     miniMaskTimer && clearTimeout(miniMaskTimer);
                    //     mini.unmask();
                    // }

                },
                error: function () {
                    // // 移除遮罩
                    // if (!opts.notShowLoading) {
                    //     miniMaskTimer && clearTimeout(miniMaskTimer);
                    //     mini.unmask();
                    // }

                    Util._ajaxErr.apply(Util, arguments);
                },
                complete: function () {
                    if (!opts.notShowLoading) {
                        miniMaskTimer && clearTimeout(miniMaskTimer);
                        mini.unmask();
                    }
                }
            });
        },

        // 对form集合下的表单控件进行验证
        validate: function (notShowAlert) {
            var result = true,
                i, len,
                firstError,
                firstErrorLabel,
                $target,
                $scrollEl,
                errMsg = '有字段验证未通过，请再检查一下！';

            for (i = 0, len = this.forms.length; i < len; i++) {
                if (!this.forms[i].validate()) {
                    result = false;

                    var errors = this.forms[i].getErrors(),
                        target = errors[0].el,
                        scrollEl = Util.getFirstScrollEl(target),
                        scrollTop = 0;

                    $target = $(target);
                    $scrollEl = $(scrollEl);
                    if (scrollEl) {
                        scrollTop = $target.offset().top + $scrollEl.scrollTop() - $scrollEl.offset().top;

                        $scrollEl.animate({
                            scrollTop: scrollTop
                        }, 500);
                    }

                    // 有错误时需要将第一个错误提示出来，所以需要把第一个出错的控件记录下来
                    firstError = errors[0];
                    firstErrorLabel = firstError.ownerRowID !== undefined ? '' : ($target.parent().attr('label') || $target.parent().prev().text() || $target.prev().text()).replace(/[:：]$/, '');
                    break;
                }
            }

            len = this.extraValidateControl.length;

            if (result && len) {
                for (i = 0; i < len; i++) {
                    if (!this.extraValidateControl[i].isValid()) {
                        result = false;
                    }
                }
            }

            // 验证不通过，添加alert进行提示
            // 该优化需求由OA提出，并经过交互评审确定使用alert的形式：http://oa2.epoint.com.cn:8080/OA9/oa9/mail/mailreceivedetail?detailguid=e97b9548-0534-4d19-852c-ec5a1bc15505
            // 当前页面隐藏的情况下，alert弹窗的位置就计算不对，导致无法看到alert弹窗，所以在隐藏时就不要再弹了
            if (!notShowAlert && !result && mini.isWindowDisplay()) {
                firstError && (errMsg = firstErrorLabel + '验证失败：' + firstError.errorText);
                mini.showMessageBox({
                    title: "错误提示",
                    buttons: ["ok"],
                    message: errMsg,
                    iconCls: "mini-messagebox-warning"
                });
            }

            return result;
        },

        // 解析columns配置中的字段信息
        _parseColumn: function (columns) {
            var col = [],
                data;
            if (columns) {
                for (var j = 0; j < columns.length; j++) {
                    var column = columns[j];
                    if (column.field) {
                        data = {
                            fieldName: column.field,
                            code: column.code,
                            format: column.format
                        };
                        // 为了让后端实现按需返回字段（不返回所有字段）displayField属性需要传递给后端
                        if (column.displayField) {
                            data.displayField = column.displayField;
                        }
                        col.push(data);

                    } else if (column.columns) {
                        var cols = this._parseColumn(column.columns);

                        for (var i = 0, l = cols.length; i < l; i++) {
                            col.push(cols[i]);
                        }
                    }
                }
            }

            return col;
        },

        // 解析Tree实例的配置信息
        _parseTree: function (control) {
            var field = {
                idField: control.idField,
                textField: control.textField,
                imgField: control.imgField,
                iconField: control.iconField
            };
            // 嵌套的数据组织形式
            if (control.getResultAsTree()) {
                $.extend(field, {
                    type: "tree-nested",
                    nodesField: control.nodesField
                });

                // 扁平（array）的形式
            } else {
                $.extend(field, {
                    type: "tree-non-nested",
                    parentField: control.parentField
                });
            }

            if (control.url) {
                field.url = control.url.substr(control.url.lastIndexOf('/') + 1);
            }

            return field;
        },

        // 解析TreeGrid实例的配置信息
        _parseTreeGrid: function (control) {
            var field = {
                idField: control.idField,
                imgField: control.imgField,
                iconField: control.iconField,
                pageIndex: control.pageIndex,
                columns: this._parseColumn(control.columns)
            };
            if (control.getResultAsTree()) {
                $.extend(field, {
                    type: "treegrid-nested",
                    nodesField: control.nodesField
                });
            } else {
                $.extend(field, {
                    type: "treegrid-non-nested",
                    parentField: control.parentField
                });
            }

            if (control.showPager) {
                // 暂时先所有刷新都回到第一页
                if (this.isRefresh) {
                    field.pageIndex = 0;

                }

                // 修改 by liub 2017-11-28 (之前的修改遗漏了)
                // 9.2.8开始系统参数直接从jsboot中返回了，这边不需要做判断了
                // 如果pageSize是服务端配置的，就不需要把pageSize传递给服务端了
                // if(win.isInitPageFinished || control.pageSizeFromServer === false || (control.pageSizeFromServer === undefined && win.mini_attrValue_fromServer === false)) {
                field.pageSize = control.pageSize;
                // }
            } else {
                // 不分页则将pageSize设为-1
                field.pageSize = -1;
            }


            if (control.url) {
                field.url = control.url.substr(control.url.lastIndexOf('/') + 1);
            }

            return field;
        },

        // 解析DataGrid实例的配置信息
        _parseDataDrid: function (control) {
            var field = {
                idField: control.idField,
                pageIndex: control.pageIndex,
                sortField: control.sortField,
                sortOrder: control.sortOrder,
                columns: this._parseColumn(control.getColumns())
            };

            if (control.showPager) {
                // 暂时先所有刷新都回到第一页
                if (this.isRefresh) {
                    field.pageIndex = 0;
                }

                // 如果pageSize是服务端配置的，就不需要把pageSize传递给服务端了
                // if(control.pageSizeFromServer === false || (control.pageSizeFromServer === undefined && win.mini_attrValue_fromServer === false)) {
                field.pageSize = control.pageSize;
                // }
            } else {
                // 不分页则将pageSize设为-1
                field.pageSize = -1;
            }


            if (control.url) {
                field.url = control.url.substr(control.url.lastIndexOf('/') + 1);
            }


            return field;
        },

        _parsePagerTree: function (control) {
            var field = {
                idField: control.idField,
                imgField: control.imgField,
                iconField: control.iconField,
                pageIndex: control.pageIndex,
                pageSize: control.pageSize,
                sortField: control.sortField,
                sortOrder: control.sortOrder,
                columns: this._parseColumn(control.columns)
            };

            if (this.isRefresh) {
                field.pageIndex = 0;
            }

            $.extend(field, {
                type: "pagertree-non-nested",
                parentField: control.parentField
            });

            if (control.url) {
                field.url = control.url.substr(control.url.lastIndexOf('/') + 1);
            }

            return field;
        },
        // 获取父页面的loginId，解决切换登录身份后，在之前身份打开的页面中再打开新页面时，新页面能判断出是由之前身份页面打开的，从而进行提示
        _getParentLoginId: function () {
            var loginId = '',
                parent = win.parent || win.opener,
                parentViewData;

            if (parent) {
                try {
                    parentViewData = mini.decode(parent.mini.get('_common_hidden_viewdata').getValue());
                    // 用户的loginId会存放在隐藏域的 epoint_user_loginid 字段里
                    loginId = '{epoint_user_loginid: "' + parentViewData.epoint_user_loginid + '"}';
                } catch (e) {}
            }

            return loginId;
        }

    };

    win.DtoUtils = {
        getCommonDto: function (formId, action, isRefresh, initHook) {
            return new CommonDto(formId, action, isRefresh, initHook);
        },

        // 表格、树二次请求时在beforeload中通过该方法将请求数据组织成通用DTO格式
        // 参数formId为要附加的额外条件的控件所在区域
        // 参数e为beforeload的参数
        processBeforeLoad: function (e, formId) {
            var form, control = e.sender,
                id = control.getId(),
                field, node, isInclude = true;

            // 优化 by liub 217-08-16
            // 优化写法
            // if (formId === undefined) {
            //     form = new CommonDto(control.el);
            //     field = form.getData(true)[id];
            // } else {
            //     form = new CommonDto(formId);
            //     field = form.getField(id);
            // }

            form = new CommonDto(formId || control.el);

            field = form.getData(true)[id];

            // 如果发请求的控件不在form指定的区域里，则手动将其配置信息加入到form中
            if (!field) {
                field = new CommonDto(control.el).getData(true)[id];
                isInclude = false;
            }
            if (field) {
                // 树节点需要把节点上的所有信息都返回给后台
                if (control.type == 'tree' || control.type == 'treeselect' || control.type == 'treelistselect' || (control.type == 'tabstreeselect' && !e.data.activeTab) || control.type == 'filtertree' || (control.type == 'treegrid' && e.async)) {
                    node = e.node;
                    field.node = {};
                    for (var i in node) {
                        // 树节点会有存在后端个性化节点text，带有html标签，需要去除
                        if (i == 'text' && node[i]) {
                            field.node[i] = node[i].replace(/<\/?.+?>/g, "");
                        } else {
                            field.node[i] = node[i];
                        }
                    }

                    // 解决懒加载父子联动情况下加载节点时父子节点选中状态未联动的问题
                    // 加上checkRecursive字段，后台根据此字段来决定返回的子节点是否需要根据父节点来调整checked的值
                    if (control.checkRecursive) {
                        field.checkRecursive = true;
                    }
                } else {
                    if (e.data.pageIndex >= 0) {
                        field.pageIndex = e.data.pageIndex;
                    }
                    if (e.data.pageSize >= 0) {
                        field.pageSize = e.data.pageSize;
                    }
                    if (e.data.sortField !== undefined) {
                        field.sortField = e.data.sortField;
                    }
                    if (e.data.sortOrder !== undefined) {
                        field.sortOrder = e.data.sortOrder;
                    }
                }

                if (e.data.isSecondRequest) {
                    field.isSecondRequest = true;
                }

                if (e.data.search_condition !== undefined) {
                    field.search_condition = e.data.search_condition;
                }

                // pagerTree的展开参数
                if (e.data.__ecconfig) {
                    field.__ecconfig = e.data.__ecconfig;
                }

                if (!isInclude) {
                    form.addField(field);
                }
            }

            // 带上通用隐藏域
            var hidden = mini.get('_common_hidden_viewdata');
            form.addField({
                id: '_common_hidden_viewdata',
                type: 'hidden',
                value: hidden ? hidden.getValue() : ''
            });
            // 将组织好的符合通用DTO格式的数据附加到e.data中
            mini.copyTo(e.data, form.getData());
        },

        // 用于在弹出框中初始化时设置页面控件的值
        // 参数data格式为{name: 'jone', age: 20}，其中name和age对应于页面中的控件的id
        // 弹出框页面中必须有对应的控件
        setData: function (data) {
            var control = null;
            for (var i in data) {
                control = mini.get(i);

                if (control) {
                    control.setValue(data[i]);
                }
            }
        },

        // 用于给弹出框设值的参数的name加上tableName前缀
        // 例如row为{'name': 'jone', 'age': 20}，tableName为'User'，则返回{'User.name':
        // 'jone', 'User.age': 20}
        // 参数row一般为datagrid.getSelected()返回的选中行的数据
        formatData: function (row, tableName) {
            var data = {};
            if (!tableName) {
                return row;
            }

            for (var i in row) {
                data[tableName + '.' + i] = row[i];
            }

            return data;
        },

        addCommonViewData: function (data) {
            data = data || {};

            var hidden = mini.get('_common_hidden_viewdata');

            if (hidden) {
                data['_common_hidden_viewdata'] = {
                    id: '_common_hidden_viewdata',
                    bind: '_common_hidden_viewdata',
                    type: 'hidden',
                    value: hidden.getValue()
                };
            }

            return data;
        },

        // 向有二次请求的控件绑定beforeload事件，添加二次请求标识
        bindBeforeLoad: function (scope) {
            function addExtraData(e) {
                // extraId为控件二次请求时需要一起传回后台的控件id
                var control = e.sender;
                if (control.extraId) {
                    var commonData = mini.decode(e.data.commonDto),
                        extraData = DtoUtils.getCommonDto(control.extraId).getData(true);

                    for (var j in extraData) {
                        if (j !== "_common_hidden_viewdata") {
                            commonData.push(extraData[j]);

                        }
                    }

                    e.data.commonDto = mini.encode(commonData);
                }
            }

            // 页面中存在查询条件，则表格默认按加上查询条件的通用DTO格式
            var conditionForm = $('.fui-condition > .fui-form')[0],
                searchForm = $('.fui-search > .fui-form')[0];
            // 如果有toolbar，则把toolbar中的条件也加上
            var toolbar = $('.fui-toolbar')[0];
            if (toolbar) {
                if (!conditionForm) {
                    conditionForm = toolbar;
                } else {
                    conditionForm = [conditionForm, toolbar];
                }
            }

            if (conditionForm && !mini.isArray(conditionForm)) {
                conditionForm = [conditionForm];
            }
            // 添加高级搜索区域
            if (searchForm) {
                // conditionForm.push(searchForm);
                // 如果即没有 toolbar 也没有 fui-condition 直接push会报错
                if (!conditionForm) {
                    conditionForm = [searchForm];
                } else {
                    conditionForm.push(searchForm);
                }
            }
            // 自行触发请求的控件类型
            var SEC_AJAX_CONTROLS = ['datagrid', 'tree', 'treegrid', 'pagertree', 'autocomplete',
                'textboxlist', 'dataexport', 'tabstreeselect', 'treeselect', 'verifycode', 'filtertree', 'webuploader', 'largefileuploader'
            ];

            // 过滤出有二次请求的控件
            var controls = mini.findControls(function (control) {
                if (scope) {
                    if (!control.el || scope == control || !mini.isAncestor(scope, control.el)) {
                        return false;
                    }
                }
                return (SEC_AJAX_CONTROLS.indexOf(control.type) != -1);
            });

            var urlQuery = win.Util.getSafeLocation().search.substring(1);

            var i, len;
            for (i = 0, len = controls.length; i < len; i++) {
                if (controls[i].type == 'dataexport') {
                    controls[i].on('beforeexport', function (e) {
                        var control = e.sender,
                            extraId = control.getExtraId(),
                            ids = [control.el];
                        if (extraId) {
                            ids.push(extraId);
                        }
                        var form = DtoUtils.getCommonDto(ids);
                        if (form) {
                            // 将额外的属性加到data中
                            var field = form.getField(control.id);

                            mini.copyTo(field, e.data);

                            e.data = form.getData().commonDto;
                        }
                    });
                } else if (controls[i].type == 'webuploader') {
                    // 3个请求都需要加上额外数据
                    controls[i].on('beforemd5file', addExtraData);
                    controls[i].on('uploadbeforesend', addExtraData);
                    controls[i].on('beforemd5filefinished', addExtraData);

                } else if (controls[i].type == 'largefileuploader') {
                    controls[i].on('uploadbeforesend', function (e) {
                        var control = e.sender,
                            ntko = control._ntko;

                        if (control.extraId) {
                            var commonData = mini.decode(e.data.commonDto),
                                extraData = DtoUtils.getCommonDto(control.extraId).getData(true);

                            for (var j in extraData) {
                                if (j !== "_common_hidden_viewdata") {
                                    commonData.push(extraData[j]);

                                }
                            }

                            e.data.commonDto = mini.encode(commonData);

                            // ntok没有提供beforemd5file和beforemd5filefinished事件来添加额外数据，只能通过url来加了
                            // 但是该方式需注意url是有长度限制的，只能携带少量数据
                            ntko.QueryFileStatusURL = control._ntkoQueryFileStatusURL + '&commonDto=' + e.data.commonDto;
                            ntko.FinishedUploadURL = control._ntkoFinishedUploadURL + '&commonDto=' + e.data.commonDto;
                        }

                    });
                } else {
                    controls[i].on('beforeload', function (e) {
                        mini.copyTo(e.data, {
                            isSecondRequest: true
                        });

                        // extraId为控件二次请求时需要一起传回后台的控件id
                        var control = e.sender,
                            condition = ((control.type == 'datagrid' || control.type == 'pagertree' || control.type == 'treegrid') && conditionForm) ? conditionForm.slice(0) : [];
                        if (control.extraId) {
                            condition.push(control.extraId);
                        }

                        // 带上页面url上的条件
                        if (urlQuery && e.url.indexOf('?') == -1) {
                            e.url += ('?' + urlQuery);
                        }
                        DtoUtils.processBeforeLoad(e, condition);
                    });
                }

                if (controls[i].type == 'tabstreeselect' || controls[i].type == 'treeselect') {
                    controls[i].on('beforecheckload', function (e) {
                        var control = e.sender,
                            form = DtoUtils.getCommonDto([control.el]);
                        if (form) {
                            // 将额外的属性加到data中
                            var data = form.getData(true);

                            var controlData = data[control.id];

                            var node = e.data.node;
                            // 把node.text中的html标签去掉
                            // 树在搜索的时候，后端返回的text会把搜索关键字高亮，就会带上html标签
                            // 但是提交的时候时不需要html标签的
                            node.text = node.text.replace(/<[^>]+>/g, "");

                            mini.copyTo(controlData, {
                                node: node,
                                direction: e.data.direction,
                                eventType: e.data.eventType
                            });

                            delete e.data.direction;
                            delete e.data.node;
                            delete e.data.eventType;

                            // 加上搜索条件
                            // 解决在搜索结果中选择父节点后台不知道有搜索而返回所有子节点
                            if (control.filterMode == 'server') {
                                controlData.search_condition = control.tree._filterKey;
                            }

                            mini.copyTo(e.data, {
                                commonDto: mini.encode([controlData, data['_common_hidden_viewdata']], "yyyy-MM-dd HH:mm:ss")
                            });
                        }
                    });
                    controls[i].on('beforesortchanged', function (e) {
                        var control = e.sender,
                            form = DtoUtils.getCommonDto([control.el]);
                        if (form) {
                            // 将额外的属性加到data中
                            var data = form.getData(true);

                            var controlData = data[control.id];

                            mini.copyTo(controlData, {
                                direction: e.data.direction,
                                eventType: e.data.eventType
                            });

                            delete e.data.direction;
                            delete e.data.eventType;
                            delete e.data.value;

                            mini.copyTo(e.data, {
                                commonDto: mini.encode([controlData, data['_common_hidden_viewdata']], "yyyy-MM-dd HH:mm:ss")
                            });
                        }
                    });
                }

                // 二次请求发生错误的处理
                controls[i].on('loaderror', function (ex) {
                    var code = ex.errorCode,
                        data = ex.errorMsg,
                        status;

                    // 用于被安全模块拦截后返回503的处理
                    // 控件内部自己发的ajax请求也需要处理
                    if (code == 503) {
                        data = mini.decode(data);
                        status = data ? data.status : null;
                        if (status && status.text) {
                            mini.showMessageBox({
                                title: "错误提示",
                                buttons: ["ok"],
                                message: status.text,
                                iconCls: "mini-messagebox-error"
                            });
                        }
                    }

                });
            }

        }
    };
}(this, jQuery));

// 向有二次请求的控件绑定beforeload事件，添加二次请求标识
// 二次请求控件有：datagrid、tree、treegrid、autocomplete、textboxlist
(function (win, $) {

    mini.parse();

    window.DtoUtils.bindBeforeLoad();

}(this, jQuery));
if (!window.epoint) {
    window.epoint = {};
}

jQuery.extend(epoint, (function (win, $) {

    function dealUrl(url) {
        // action形式的url需要加上页面路径
        // 例如在 "/pages/login/login.xhtml"中，url为"login.autoLoad"
        // 则url会转换为 "/pages/login/login.autoLoad"
        url = getRequestMapping() + '/' + url;

        // 将"a.b"类型的url转化为"a/b"
        if (url.indexOf('.') != -1 && url.indexOf('.jspx') == -1) {
            url = url.replace('.', '/');

        }
        // 加上页面地址中的请求参数
        // var all = window.location.href;
        // var index = all.indexOf('?');
        // var hasParam = url.indexOf('?') > -1;

        // if (index != -1) {
        //     if (hasParam) {
        //         url += '&' + all.substring(index + 1);
        //     } else {
        //         url += '?' + all.substring(index + 1);
        //     }

        //     // 加上isCommondto标识
        //     // 用来给后台区分与其他不是通过epoint中的三个方法发送的请求
        //     url += '&isCommondto=true';
        // } else {
        //     if (hasParam) {
        //         url += '&isCommondto=true';
        //     } else {
        //         url += '?isCommondto=true';
        //     }
        // }

        var urlParams = Util.getUrlParams();
        urlParams.isCommondto = true;

        url = Util.addUrlParams(url, urlParams);

        url = Util.getRightUrl('rest/' + url);

        return url;
    }

    /**
     * 获取请求映射前缀
     *
     * @return /frame/sysconf/code/codemainlist
     */
    function getRequestMapping() {
        var url = window.location.protocol + '//' + window.location.host + window.location.pathname;
        var root = Util.getRootPath();
        return url.substring(root.length, url.lastIndexOf('/'));
    }

    function initDialogOptions(title, url, callback, settings, isTop) {
        // 为了避免对外部参数settings影响，这里需克隆一份新的出来
        var cfg = $.extend({}, settings || {}, {
            title: title
        });

        cfg.url = Util.getRightUrl(url, cfg.noEncryption);

        // 这里避免每个开发人员去写这种不友好的传参，在默认里面用全局变量进行了实现，
        // 前提是一个页面只能同时打开一个dialog，否则将会发生串的风险，
        // 最好是用另外的容器进行维护，就没有问题了
        if (!cfg.onload) {
            cfg.onload = function () {
                var iframe = this.getIFrameEl();
                // 防止弹出页面跨域而报错导致无法后续不响应
                try {
                    if (iframe.contentWindow.pageLoad) {
                        iframe.contentWindow.pageLoad(cfg.param);
                    }
                } catch (e) {
                    console.error('跨域了!' + e.message, 'font-size: 16px;');
                }
            };
        }
        if (!cfg.ondestroy) {
            cfg.ondestroy = function (action) {
                // 调用工作流页面设置的回调
                var iframe = this.getIFrameEl(),
                    setCallBack;
                // 防止弹出页面跨域而报错导致无法后续不响应
                try {
                    setCallBack = iframe.contentWindow.setCallBack;
                } catch (e) {
                    console.error('跨域了!' + e.message, 'font-size: 16px;');
                }

                if (setCallBack) {
                    setCallBack();
                }

                if (callback) {
                    action = mini.clone(action);
                    callback.call(this, action);
                }
            };
        }

        var winSize = (isTop && top.Util && top.Util.getWinSize) ? top.Util.getWinSize() : Util.getWinSize(),
            width = cfg.width,
            height = cfg.height,
            isMax = false;

        if (width) {
            width = parseInt(width, 10);
            if (width >= winSize.width || width <= 0) {
                width = winSize.width - 20;
            }
        } else {
            width = winSize.width - 20;
            isMax = true;
        }

        if (height) {
            height = parseInt(height, 10);
            if (height >= winSize.height || height <= 0) {
                height = winSize.height - 20;
            }
        } else {
            height = winSize.height - 20;
            isMax = true;
        }


        cfg.width = width;
        cfg.height = height;

        if (isMax) {
            cfg.allowDrag = false;
        }

        // mini中默认为true，在不传时设置其为false
        if (cfg.allowResize == undefined) {
            cfg.allowResize = false;
        }

        // add
        // 给url中加上一个参数作为Dialog的id 用以高效查找Dialog 解决IE8下高概率的崩溃问题。
        cfg.dialogId = Util.uuid();

        if (!cfg.url) cfg.url = '';

        // var urls = cfg.url.split('#');

        // url = urls[0];
        // if (url.indexOf('?') === -1) {
        //     url += '?_dialogId_=' + cfg.dialogId;
        // } else {
        //     url += '&_dialogId_=' + cfg.dialogId;
        // }
        // cfg.url = url + (urls[1] ? urls[1] : '');

        cfg.url = Util.addUrlParams(cfg.url, {
            _dialogId_: cfg.dialogId
        }, 'normal', cfg.noEncryption);
        // end


        return cfg;
    }

    function Str2Hex(s) {
        var c = "";
        var n;
        var ss = "0123456789ABCDEF";
        var digS = "";
        for (var i = 0; i < s.length; i++) {
            c = s.charAt(i);
            n = ss.indexOf(c);
            digS += Dec2Dig(eval(n));
        }
        // return value;
        return digS;
    }

    function Dec2Dig(n1) {
        var s = "";
        var n2 = 0;
        for (var i = 0; i < 4; i++) {
            n2 = Math.pow(2, 3 - i);
            if (n1 >= n2) {
                s += '1';
                n1 = n1 - n2;
            } else s += '0';

        }
        return s;
    }

    function Dig2Dec(s) {
        var retV = 0;
        if (s.length == 4) {
            for (var i = 0; i < 4; i++) {
                retV += eval(s.charAt(i)) * Math.pow(2, 3 - i);
            }
            return retV;
        }
        return -1;
    }

    function Hex2Utf8(s) {
        var retS = "";
        var tempS = "";
        var ss = "";
        if (s.length == 16) {
            tempS = "1110" + s.substring(0, 4);
            tempS += "10" + s.substring(4, 10);
            tempS += "10" + s.substring(10, 16);
            var sss = "0123456789ABCDEF";
            for (var i = 0; i < 3; i++) {
                retS += "%";
                ss = tempS.substring(i * 8, (eval(i) + 1) * 8);

                retS += sss.charAt(Dig2Dec(ss.substring(0, 4)));
                retS += sss.charAt(Dig2Dec(ss.substring(4, 8)));
            }
            return retS;
        }
        return "";
    }

    function fGetPEUtf8(sUtf8PE) {
        sUtf8PE = sUtf8PE.replace(/%/, "");
        // IWrite.write("<br/>sUtfPE: "+sUtf8PE);
        var Ar = sUtf8PE.split("%");
        for (var i = 0,
                j = Ar.length; i < j; i++) {
            Ar[i] = parseInt(Ar[i], 16).toString(2);
            var iZeroIndex = Ar[i].indexOf("0");
            Ar[i] = Ar[i].slice(iZeroIndex + 1);
        }
        var sBin = Ar.join("");
        var iCode = parseInt(sBin, 2);
        return String.fromCharCode(iCode);
    }

    function fGetPEUtf8Bound(cUtf8PE) {
        cUtf8PE = cUtf8PE.replace(/%/, "");
        var iCharCode = parseInt(cUtf8PE, 16);
        var iLBound = 0,
            iUBound = 0;
        // 00-7F
        iLBound = 0;
        iUBound = 0x7f;
        if (iCharCode >= iLBound && iCharCode <= iUBound) return 1;
        // C2-DF
        iLBound = 0xC2;
        iUBound = 0xDF;
        if (iCharCode >= iLBound && iCharCode <= iUBound) return 2;
        // E0-EF
        iLBound = 0xE0;
        iUBound = 0xEF;
        if (iCharCode >= iLBound && iCharCode <= iUBound) return 3;
        // F0-F4
        iLBound = 0xF0;
        iUBound = 0xF4;
        if (iCharCode >= iLBound && iCharCode <= iUBound) return 4;

        return 0;
    }

    function fGeneratingBoundStr(iPadBegin, iLen) {
        if (!iPadBegin) iPadBegin = 0;
        if (!iLen) iLen = 10;
        var Ar = [];
        var iLBound = 0,
            iUBound = 0;

        iLBound = 0 + iPadBegin;
        iUBound = iLBound + iLen;
        for (; iLBound < iUBound; iLBound++) {
            Ar.push(String.fromCharCode(iLBound));
        }

        iLBound = 0x000080 + iPadBegin;
        iUBound = iLBound + iLen;
        // IWrite.write("<br/>iLBound: "+iLBound);
        for (; iLBound < iUBound; iLBound++) {
            Ar.push(String.fromCharCode(iLBound));
        }

        iLBound = 0x000800 + 19000 + iPadBegin;
        iUBound = iLBound + iLen;
        // IWrite.write("<br/>iLBound: "+iLBound);
        for (; iLBound < iUBound; iLBound++) {
            Ar.push(String.fromCharCode(iLBound));
        }

        iLBound = 0x010000 + iPadBegin;
        iUBound = iLBound + iLen;
        // IWrite.write("<br/>iLBound: "+iLBound);
        for (; iLBound < iUBound; iLBound++) {
            Ar.push(String.fromCharCode(iLBound));
        }

        return Ar;
    }


    return {
        /**
         * 初始化页面
         *
         * @param url ajax请求地址(如果不传，默认为page_Load)
         * @param ids  要回传的页面元素id，是个数组['tree', 'datagrid1']
         * @param callback 回调事件
         * @param opt 其他参数
         *        isPostBack 是否是回传，默认为false
         *        keepPageIndex 是否停留在当前页码 默认为false
         *        initHook: 初始化时控件在setValue后的回调
         */
        initPage: function (url, ids, callback, fail, opt) {
            var initHook;
            if (typeof fail === 'object' && opt === undefined) {
                opt = fail;
                fail = undefined;
            }

            opt = opt || {};
            if (typeof opt == 'function') {
                initHook = opt;
                opt = {};
            } else {
                initHook = opt.initHook;
            }

            var urlArr = url.split('?'),
                subUrl = urlArr[0],
                urlParam = urlArr[1];

            var len = subUrl.indexOf('.'),
                action = (len > 0 ? subUrl.substr(0, len) : subUrl);

            if (!epoint.getCache('action')) {
                epoint.setCache('action', action);
                epoint.setCache('urlParam', urlParam)
                epoint.setCache('callback', callback);

            }
            // 数据模拟时不处理url
            if (!SrcBoot.mock) {
                if (len < 0) {
                    subUrl += ".page_load";
                }

                url = subUrl + (urlParam ? '?' + urlParam : '');
            }

            win.isInitPageFinished || mini.parse();

            var params = {};

            if (ids && jQuery.isPlainObject(ids)) {
                params = ids;
                ids = undefined;
            }

            /**
             * 框架访问日志记录的时候，需要记录模块名称，目前是通过action地址反推的，有的项目如果页面地址和action地址不规范的话，可能反推不了。
             * 所以需要在初始化请求的时候，自动带上页面地址
             */
            params.pageUrl = win.location.href;
            params = mini.encode(params);

            //加载页面数据(树,表格)
            var commonDto = DtoUtils.getCommonDto(ids, action, !opt.keepPageIndex, initHook);

            if (commonDto) {
                commonDto.init({
                    url: SrcBoot.mock ? url : dealUrl(url),
                    params: params,
                    done: function (data) {
                        if (epoint.onBeforeInit) {
                            epoint.onBeforeInit(data);
                        }
                        if (callback) {
                            callback.call(this, data);
                        }

                        if (epoint.onAfterInit) {
                            epoint.onAfterInit(data);
                        }

                        Util.hidePageLoading();

                        // 表示页面已初始化完成
                        // 该参数可用于防止父页面在子页面未初始化完就来操作子页面
                        win.isInitPageFinished = true;
                    },
                    fail: fail
                });
            }
        },

        /**
         * 刷新页面
         *
         * @param ids  要回传的页面元素id，是个数组['tree', 'datagrid1'],如果不传，默认为整个form
         * @param callback 回调事件
         */
        refresh: function (ids, callback, keepPageIndex) {
            var url = epoint.getCache('action');
            if (!SrcBoot.mock) {
                url += '.page_Refresh';
                var urlParam = epoint.getCache('urlParam');

                if (urlParam) {
                    url += '?' + urlParam;
                }
            }

            if (typeof ids == 'function') {
                callback = ids;
                ids = '@all';
            }

            callback = callback || epoint.getCache('callback');

            epoint.initPage(url, ids, callback, {
                keepPageIndex: keepPageIndex
            });
        },

        /**
         * 提交表单数据
         *
         * @param url ajax请求地址
         * @param ids  要回传的页面元素id，是个数组['tree', 'datagrid1'],如果不传，默认为整个form
         * @param callback 回调事件
         * @param notShowLoading 是否不显示loading效果
         */
        execute: function (url, ids, params, callback, notShowLoading) {
            var action,
                index = url.indexOf('.');
            // 数据模拟时不处理url
            if (!SrcBoot.mock) {
                // url不带'.'，则表示没带action，则自动加上initPage时的action
                if (index < 0) {
                    action = epoint.getCache('action');

                    url = action + '.' + url;
                } else {
                    action = url.substr(0, index);
                }
            }
            var commonDto = DtoUtils.getCommonDto(ids, action);
            if (typeof params == 'function') {
                callback = params;
                params = null;
            }

            commonDto.init({
                url: SrcBoot.mock ? url : dealUrl(url),
                params: (params ? (typeof params == 'string' ? params : mini.encode(params)) : null),
                done: callback,
                notShowLoading: notShowLoading
            });
        },

        /**
         * 验证表单
         *
         * @param {string|array} ids  要验证的范围，是个数组['tree', 'datagrid1'],如果不传，默认为整个form
         * @param {boolean} notShowAlert 是否不要弹出提示
         * 验证成功，则返回true，失败返回false
         */
        validate: function (ids, notShowAlert) {
            if (typeof ids === 'boolean') {
                notShowAlert = ids;
                ids = '@all';
            }
            var action = epoint.getCache('action');
            var form = DtoUtils.getCommonDto(ids, action);

            return form.validate(notShowAlert);
        },

        /**
         * 获取组织成commonDto格式的数据
         *
         * @param ids  范围，是个数组['tree', 'datagrid1'],如果不传，默认为整个body
         *
         * commonDto格式的数据
         */
        getCommonDtoData: function (ids) {
            var action = epoint.getCache('action');
            var form = DtoUtils.getCommonDto(ids, action);

            return form.getData();
        },

        /**
         * 渲染datagrid的列
         *
         * @param e 渲染事件
         * @param cls 列的样式
         * @param func 事件名称
         * @param fieldName 要跟到func函数里面的参数，默认为行对象的idField值，你可以手动指定其他字段名称,支持多个以,分割，如果设置epoint_total,那么将传递所有
         */
        renderCell: function (e, cls, func, fieldName) {
            var param = '',
                isJson = false;

            if (fieldName) {
                //如果是total，处理成json
                if (fieldName == 'epoint_total') {
                    param = epoint.encodeJson(e.row);
                    isJson = true;
                }
                //如果是多个，处理成json
                else if (fieldName.indexOf(',') != -1) {
                    var pp = {};
                    var names = fieldName.split(',');
                    for (var i = 0, l = names.length; i < l; i++) {
                        var r = names[i];
                        pp[r] = e.row[r];
                    }
                    param = epoint.encodeJson(pp);
                    isJson = true;
                } else {
                    param = e.row[fieldName];
                }
            } else {
                fieldName = e.sender.idField;
                param = e.row[fieldName];
            }

            if (isJson) {
                param = param.replace(/\"/g, "\'");
                return '<i onclick="' + func + "(" + param + ")\" class=\"" + cls + '"></i>';
            } else {
                if (typeof param == 'string') {
                    param = param.replace(/'/g, "\\'");
                    param = param.replace(/\\/g, "/");
                }
                return '<i onclick="' + func + "('" + param + "')\" class=\"" + cls + '"></i>';
            }

        },

        // 将多个操作图标渲染到一列中
        renderIconsCell: function (e, arr) {
            if (!$.isArray(arr)) {
                return '';
            }
            var cellHtml = $.map(arr, function (item) {
                return epoint.renderCell(e, item.cls, item.func, item.fieldName);
            }).join('');
            // TODO : 增加一些交互 如默认显示为主题色 个数过多时 自动...等

            return cellHtml;
        },

        /**
         * 清理某块区域
         *
         * @param id  一般为form的id
         *
         */
        clear: function (formId) {
            var form = new mini.Form('#' + formId);

            form.clear();
        },

        /**
         * 打开dialog窗口
         *
         * @param url ajax请求地址
         * @param title 弹出框的标题
         * @param callback 关闭时的回调方法
         * var settings = {
                param: Object,              //要传递给弹出页面的参数
                width: String,              //宽度
                height: String,             //高度
                iconCls: String,            //标题图标
                allowResize: Boolean,       //允许尺寸调节
                allowDrag: Boolean,         //允许拖拽位置
                showCloseButton: Boolean,   //显示关闭按钮
                showMaxButton: Boolean,     //显示最大化按钮
                showModal: Boolean,         //显示遮罩
                loadOnRefresh: false,       //true每次刷新都激发onload事件
                onload: function () {       //弹出页面加载完成
                    var iframe = this.getIFrameEl();
                    var data = {};
                    //调用弹出页面方法进行初始化
                    iframe.contentWindow.SetData(data);

                },
                ondestroy: function (action) {  //弹出页面关闭前
                    if (action == "ok") {       //如果点击“确定”
                        var iframe = this.getIFrameEl();
                        //获取选中、编辑的结果
                        var data = iframe.contentWindow.GetData();
                        data = mini.clone(data);    //必须。克隆数据。
                        ......
                    }
                }
           };
         *
         */
        openDialog: function (title, url, callback, settings) {
            settings = initDialogOptions(title, url, callback, settings);

            url = settings.url;
            if (!url) url = "";

            var urls = url.split("#");
            url = urls[0];

            if (url && url.indexOf("_winid") == -1) {
                var t = "_winid=" + mini._WindowID;
                if (url.indexOf("?") == -1) {
                    url += "?" + t;
                } else {
                    url += "&" + t;
                }
                if (urls[1]) {
                    url = url + "#" + urls[1];
                }
            }

            settings.url = url;

            settings.Owner = window;
            //调用底层mini的api打开窗口
            // return mini._doOpen(settings);

            // 自动给url上加上Dialog的id，用于高效查找Dialog，解决在IE8下高概率的崩溃问题。
            var dialog = mini._doOpen(settings);
            dialog.setId(settings.dialogId);
            return dialog;
            // end
        },

        /**
         * 在顶层打开dialog窗口
         *
         */
        openTopDialog: function (title, url, callback, settings) {
            settings = initDialogOptions(title, url, callback, settings, true);

            //调用底层mini的api打开窗口
            // return mini.open(settings);

            // 自动给url上加上Dialog的id，用于高效查找Dialog，解决在IE8下高概率的崩溃问题。
            var dialog = mini.open(settings);
            dialog.setId(settings.dialogId);
            return dialog;
            // end
        },

        /**
         * 关闭dialog窗口
         *
         * @param action 要传递的参数
         */
        closeDialog: function (action) {
            if (win.CloseOwnerWindow) {
                // 给按钮绑定onclick="epoint.closeDialog"时参数action为miniui自动生成的一个事件参数
                // 这种情况其实参数action应该为空
                if (action && action.htmlEvent) {
                    action = undefined;
                }
                return win.CloseOwnerWindow(action);
            } else {
                win.close();
            }
        },

        /**
         * 在Dialog子页面中获取Dialog实例
         */
        getOwnerDialog: function () {
            if (!parent || !parent.mini) {
                return null;
            }
            // 自动从url中查找此Dialog的id 如果有就可以直接从父页面中反馈
            var dialogId = Util.getUrlParams('_dialogId_');
            if (dialogId) {
                return parent.mini.get(dialogId);
            }
            // end
            var cmps = parent.mini.getComponents();
            for (var i = 0, l = cmps.length; i < l; i++) {
                var o = cmps[i];
                if (o.getIFrameEl) {
                    var iframe = o.getIFrameEl();
                    if (iframe && iframe.contentWindow == window) {
                        return o;
                    }
                }
            }
        },

        setDialogTitle: function (title) {
            var dialog = epoint.getOwnerDialog();

            if (dialog) {
                dialog.setTitle(title);
            }
        },

        /**
         * 打开不带头部标题的dialog
         * @param {string} url 
         * @param {function} callback 
         * @param {object} settings 
         */
        openLightDialog: function (url, callback, settings) {
            settings = initDialogOptions('', url, callback, settings);

            var dialog = Util.openLightDialog(settings);

            return dialog;
        },
        /**
         * 在顶层打开不带头部标题的dialog
         * @param {string} url 
         * @param {function} callback 
         * @param {object} settings 
         */
        openTopLightDialog: function (url, callback, settings) {
            settings = initDialogOptions('', url, callback, settings, true);

            var dialog = Util.openTopLightDialog(settings);

            return dialog;
        },
        /**
         * 打开div窗口
         *
         * @param id  div窗口id
         * @param formId  要清空数据的form的id，默认为div的id，如果不需要内部默认清理，传递none
         */
        openDiv: function (id, formId) {
            var editWindow = mini.get(id);
            if (editWindow) {
                if (formId === undefined) {
                    formId = id;
                }
                if (formId != "none") {
                    new mini.Form('#' + formId).clear();
                }
                editWindow.show();
            }
        },

        /**
         * 关闭div窗口
         *
         * @param id  div窗口id
         *
         */
        closeDiv: function (id) {
            var editWindow = mini.get(id);
            if (editWindow) {
                editWindow.hide();
            }
        },

        /**
         * 打开信息提示框
         *
         * @param message  提示信息
         * @param title  标题,默认为系统提示
         * @param callback  回调事件
         * @param icon  显示的图标，可选值为 'success', 'info','warning' ,'question' ,'deny','error'，默认为'info'
         *
         */
        alert: function (message, title, callback, icon, forceAlert) {
            // 优化框架的提示信息的用户体验
            // alert 方法默认转化为更轻量的 showTips 形式
            // 转化需满足下面条件：
            // 1.系统参数开启支持showTips模式，即系统参数 alertToTips 为 true
            // 2.callback 为空
            // 3.icon 为 success、info或者空
            if (!forceAlert && Util.getFrameSysParam('alertToTips') && !callback) {
                if (!icon || 'success,info'.indexOf(icon) > -1) {
                    this.showTips(message, {
                        state: icon || 'info'
                    });
                    return;
                }
            }

            mini.showMessageBox({
                minWidth: 250,
                title: title || mini.MessageBox.alertTitle,
                buttons: ["ok"],
                message: message,
                iconCls: "mini-messagebox-" + (icon || "info"),
                callback: callback
            });
        },

        /**
         * 打开confirm确认提示框
         *
         * @param message  提示信息
         * @param title  标题,默认为系统提示
         * @param callback  回调事件
         *
         */
        confirm: function (message, title, okCallback, cancelCallback) {
            mini.confirm(message, title, function (action) {
                if (action == 'ok') {
                    if (okCallback) {
                        okCallback();
                    }
                } else {
                    if (cancelCallback) {
                        cancelCallback();
                    }
                }
            });
        },

        /**
         * 打开alert提示框,点击确定后关闭当前窗口(用于保存并关闭按钮)
         *
         * @param message  提示信息
         * @param title  标题,默认为系统提示
         * @param callback  回调事件
         * @param options.backParam  回传到父页面的参数
         * @param options.chkMsg  检查信息(当该参数有值时，会判断message中是否包含该参数值，如果包含才真正关闭窗口，否则仅做alert,默认为成功)
         * @param options.needCheck 是否必须对chkMsg进行检查，默认为false
         * @param iconCls 显示的图标，可选值为 'success', 'info','warning' ,'question' ,'deny','error'，默认为'info'
         *
         */
        alertAndClose: function (message, title, callback, options, iconCls) {

            options = jQuery.extend({}, {
                chkMsg: '成功',
                backParam: 'ok',
                needCheck: false
            }, options);

            var close = true;

            // 如果传递了需要检查条件的参数,并且条件没有满足的话,不允许关闭
            if (options.needCheck && message.indexOf(options.chkMsg) < 0) {
                close = false;
            }
            // 只有在需要关闭的时候，才调用关闭回调
            if (close) {
                epoint.alert(message, title, function () {
                    epoint.closeDialog(options.backParam);
                }, iconCls);
            } else {
                epoint.alert(message, title, callback, iconCls);
            }
        },

        /**
         * 打开alert消息提示框并刷新父页面(用于保存并刷新按钮)
         *
         * @param message  提示信息
         * @param title  标题,默认为系统提示
         * @param iconCls 显示的图标，可选值为 'success', 'info','warning' ,'question' ,'deny','error'，默认为'info'
         */
        alertAndRefresh: function (message, title, iconCls) {
            //getDialog(dialogId).getOptions('callback')('ok');
            epoint.alert(message, title, function (action) {
                epoint.refresh();
            }, iconCls);
        },

        showTips: function (content, options) {
            var opt = {
                state: 'info',
                x: 'center',
                y: 'top',
                // 默认位置改为离顶端30%处
                offset: [10, Util.getWinSize().height * 0.3],
                timeout: 3000
            };

            opt.content = content;

            if (options) {
                // 如果参数指定了y方向，则需要将默认的偏移去除
                if (options.y) {
                    opt.offset = undefined;
                }
                jQuery.extend(opt, options);
            }
            // state 兼容
            opt.state = opt.state.toLowerCase();
            if (opt.state == 'error' || opt.state == 'deny') {
                opt.state = 'danger';
            }

            mini.showTips(opt);
        },

        /**
         * 禁用页面上的所有按钮
         */
        disableAllButtons: function () {
            this.allButtons = mini.findControls(function (control) {
                if (control.type == 'button' && control.enabled) {
                    return true;
                }
                return false;
            });

            for (var i = this.allButtons.length - 1; i >= 0; i--) {
                this.allButtons[i].disable();
            }
        },

        enableAllButtons: function () {
            if (this.allButtons) {
                for (var i = this.allButtons.length - 1; i >= 0; i--) {
                    this.allButtons[i].enable();
                }
            }
        },

        /**
         * [validateDateInterval 验证结束时间与开始时间的间隔是否满足要求]
         * @param  {[type]} start    [description]
         * @param  {[type]} end      [description]
         * @param  {[type]} interval [description]
         * @return {[Boolean]}          [description]
         */
        validateDateInterval: function (start, end, interval) {
            interval = parseInt(interval) || 0;

            var time = end.getValue() - start.getValue();

            if (time >= (interval * 86400000)) {
                return true;
            }
            return false;
        },

        showLoading: function () {
            mini.mask({
                el: document.body,
                cls: 'mini-mask-loading'
            });
        },

        hideLoading: function () {
            mini.unmask(document.body);
        },
        /**
         * 自定义编码函数
         *
         * @param input  要编码的数据
         */
        // encode: function (input) {
        //     // 先进行utf-8编码,解决中文问题
        //     input = epoint.encodeUtf8(input);
        //     // 对%做replace替换
        //     input = input.replace(/%/g, "_PERCENT_");

        //     // 对所有字符做ascii码转换
        //     var output = "",
        //         chr1 = "",
        //         i = 0,
        //         l =input.length;
        //     do {
        //         // 取字符的ascii码
        //         chr1 = input.charCodeAt(i++);
        //         // 偏移比较复杂，这里做个递减
        //         chr1 -= i;
        //         // =分割便于后台解析
        //         output = output + "=" + (chr1);
        //     } while (i < l);

        //     return output;
        // },
        /**
         * utf-8编码函数,并且会替换%为_PERCENT_
         *
         * @param s1  要编码的数据
         */
        encodeUtf: function (s1) {
            if (s1) {
                // s1 = EncodeUtf8(s1);
                // s1 = s1.replace("/%/g", "_PERCENT_");
                // cause 没有EncodeUtf8方法，使用将报错 后面应是正则表达式
                // modify by chendongshun at 2017.05.23
                s1 = this.encodeUtf8(s1);
                s1 = s1.replace(/%/g, "_PERCENT_");
            }
            return s1;
        },

        /**
         * utf-8编码函数
         *
         * @param s1  要编码的数据
         */
        encodeUtf8: function (s1) {
            var s = escape(s1);
            var sa = s.split("%");
            var retV = "";
            if (sa[0] !== "") {
                retV = sa[0];
            }
            for (var i = 1; i < sa.length; i++) {
                if (sa[i].substring(0, 1) == "u") {
                    retV += Hex2Utf8(Str2Hex(sa[i].substring(1, 5)));
                    if (sa[i].length > 5) {
                        retV += sa[i].substring(5);
                    }

                } else retV += "%" + sa[i];
            }

            return retV;
        },

        /**
         * utf-8解码函数
         *
         * @param sUtf8PE  经过utf-8编码的数据
         */
        decodeUtf8: function (sUtf8PE) {
            var TempStr,
                sHexExt;

            if (sUtf8PE === undefined) {
                return;
            }
            if (sUtf8PE.indexOf("%") === -1) return sUtf8PE;
            sUtf8PE = sUtf8PE.replace(/\+/g, " ");

            for (var i = 0, j = sUtf8PE.length; i < j; i++) {
                var iIndex = sUtf8PE.indexOf("%", i);
                if (iIndex === -1) break;
                i = iIndex + 1;

                var iBound = fGetPEUtf8Bound(sUtf8PE.slice(i, i + 2));
                switch (iBound) {
                    case 1:
                        sHexExt = sUtf8PE.slice(i, i + 2);
                        TempStr = String.fromCharCode(parseInt(sHexExt, 16));
                        sUtf8PE = [sUtf8PE.slice(0, i - 1), TempStr, sUtf8PE.slice(i + 2)].join("");
                        i -= 1;
                        break;

                    case 2:
                        sHexExt = sUtf8PE.slice(i + 2, i + 5);
                        if (/%../.test(sHexExt)) {
                            TempStr = sUtf8PE.slice(i - 1, i + 5);
                            TempStr = fGetPEUtf8(TempStr);
                            sUtf8PE = [sUtf8PE.slice(0, i - 1), TempStr, sUtf8PE.slice(i + 5)].join("");
                            i -= 1;
                        }
                        break;

                    case 3:
                        sHexExt = sUtf8PE.slice(i + 2, i + 8);
                        if (/\%..\%/.test(sHexExt)) {
                            TempStr = sUtf8PE.slice(i - 1, i + 8);
                            TempStr = fGetPEUtf8(TempStr);
                            sUtf8PE = [sUtf8PE.slice(0, i - 1), TempStr, sUtf8PE.slice(i + 8)].join("");
                            i -= 1;
                        }
                        break;
                }
            }
            return sUtf8PE;
        },

        /**
         * 将某个对象转换成json字符串
         *
         * @param obj  对象
         * @param dateFormat  日期格式,默认为yyyy-MM-dd HH:mm:ss
         */
        encodeJson: function (obj, dateFormat) {
            return mini.encode(obj, dateFormat);
        },

        /**
         * 将json字符串转换为对象
         *
         * @param json  要转换的json字符串
         * @param parseDate  是否自动将日期字符串转换为日期类型，默认为true
         */
        decodeJson: function (json, parseDate) {
            return mini.decode(json, parseDate);
        },


        /**
         * 将某个网址加入收藏夹
         *
         * @param sURL  网址
         * @param sTitle  标题
         */
        addFavorite: function (sURL, sTitle) {
            try {
                window.external.addFavorite(sURL, sTitle);
            } catch (e) {
                try {
                    window.sidebar.addPanel(sTitle, sURL, "");
                } catch (e) {
                    alert("加入收藏失败，请使用Ctrl+D进行添加");
                }
            }
        },

        /**
         * 设置为首页
         *
         * @param obj  浏览器对象
         * @param vrl  网址
         */
        setHome: function (obj, vrl) {
            try {
                obj.style.behavior = 'url(#default#homepage)';
                obj.setHomePage(vrl);
            } catch (e) {
                if (window.netscape) {
                    try {
                        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                    } catch (e) {
                        alert("此操作被浏览器拒绝！\n请在浏览器地址栏输入“about:config”并回车\n然后将[signed.applets.codebase_principal_support]设置为'true'");
                    }
                    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch);
                    prefs.setCharPref('browser.startup.homepage', vrl);
                }
            }
        },

        // 在epoint上增加缓存操作
        _cache: {},

        setCache: function (key, value) {
            this._cache[key] = value;
        },

        getCache: function (key) {
            return this._cache[key];
        },

        delCache: function (key) {
            this._cache[key] = null;
            delete this._cache[key];
        },

        // 调整content区域表格的pageSize
        // 使得表格每页显示的行数可以撑满content区域
        // 该方法必须使用在标准的框架contentPage布局，且content区域只能有一个表格，不能有其他任何东西
        adjustDataGridPageSize: function () {
            var grid = mini.get('datagrid');
            var $content = $('.fui-content');
            if (grid && $content.length && $content.is(':visible')) {
                var thead_h = win.mini_grid_head_h || 42,
                    tr_h = win.mini_grid_tr_h || 41,
                    pager_h = grid.showPager ? (win.mini_grid_pager_h || 46) : 0,

                    // win_h = $(win).height(),

                    // toolbar_h = $('.fui-toolbar').outerHeight() || 0,
                    // toolbar_h2 = $('.fui-toolbar-bottom').outerHeight() || 0,
                    // condition_h = $('.fui-condition').outerHeight() || 0,
                    // search_h = $('.fui-search[opened="true"]').outerHeight() || 0,

                    grid_h = $content.height(),

                    content_h = grid_h - thead_h - pager_h,

                    pageSize = parseInt(content_h / tr_h, 10);

                if (pageSize > 0) {

                    if (pageSize * tr_h > content_h) {
                        pageSize -= 1;
                    }
                    grid.setPageSize(pageSize);
                    grid.setSizeList([pageSize, pageSize * 2, pageSize * 5, pageSize * 10]);
                }
            }
        },

        // 处理页面参数配置中的地址
        // 给地址加上"rest"前缀
        dealRestfulUrl: function (url) {
            var index;

            // 对于未指定方法（即没有"/"）的自动加上"page_load"方法
            if (url.indexOf('/') == -1) {
                index = url.indexOf('?');
                if (index == -1) {
                    url += '/page_load';
                } else {
                    url = url.substr(0, index) + '/page_load' + url.substr(index);
                }
            }

            // 是否是相对路径
            var isRelative = url.indexOf('./') != -1 || url.indexOf('../') != -1;
            // 全路径则不再处理
            if (!/^(http|https|ftp)/g.test(url)) {
                if (isRelative) {
                    index = url.lastIndexOf('./');

                    url = url.substr(0, index + 2) + 'rest/' + url.substr(index + 2);
                } else {
                    url = 'rest/' + getRequestMapping() + '/' + url;
                }
            }

            // // 加上isCommondto标识，以保证通过epoint处理的方法都有这个标识
            // if (url.indexOf('?') !== -1) {
            //     url += '&isCommondto=true';
            // } else {
            //     url += "?isCommondto=true";
            // }

            // // 加上页面地址中的请求参数
            // var all = window.location.href;
            // var pIndex = all.indexOf('?');

            // if(pIndex > -1) {
            //     url += '&' + all.substring(pIndex + 1);
            // }

            var urlParams = Util.getUrlParams();
            urlParams.isCommondto = true;

            url = Util.addUrlParams(url, urlParams);

            return url;
        },
        /**
         * 对字符串进行特殊编码，以便可以跳过框架安全模块的拦截
         * @param {String} input 要编码的字符串
         * @return {String} 编码后的字符串
         */
        escape: function (input) {
            return input.replace(/>/g, '_EpRightBracket_').replace(/</g, '_EpLeftBracket_').replace(/javascript/gi, 'Java&Scr&ipt');
        }
    };

}(this, jQuery)));

// 对页面的通用处理
(function (win, $) {
    if (Util.getFrameSysParam('adjustGridPageSize')) {
        epoint.adjustDataGridPageSize();
    }

    // 兼容之前零散的事件API命名
    $(function () {
        epoint.onBeforeInit = epoint.onBeforeInit || win.epoint_beforeInit;

        epoint.onAfterInit = epoint.onAfterInit || win.epoint_afterInit;

        epoint.onBeforeDealWebeditor = epoint.onBeforeDealWebeditor || win.epoint_deal_webeditor;

        epoint.onPreload = epoint.onPreload || win.epoint_preload;
    });

}(this, jQuery));