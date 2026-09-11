'use strict';
(function (win) {
    var utils = win.companyProfileModuleUtils;

    win.companyProfileModules = win.companyProfileModules || {};
    win.companyProfileModules.topology = {
        label: '企业图谱',
        render: function (company) {
            var data = win.companyProfileDataProvider.getTopology(company);
            return '<div class="enterprise-topology-wrap"><iframe class="enterprise-topology-iframe" src="' + utils.escapeHtml(data.url) + '" title="企业图谱" frameborder="0"></iframe></div>';
        }
    };
})(window);

