'use strict';
(function (win) {
    win.getMockCompanyTopologyData = function (company) {
        return {
            url: '../equity-penetration/equity-penetration.html?company=' + encodeURIComponent(company.name || '')
        };
    };
})(window);
