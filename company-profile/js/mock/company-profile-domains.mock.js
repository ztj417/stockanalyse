'use strict';
(function (win) {
    win.getMockCompanyDomainData = function (company) {
        var rawDomain = (company.website || 'www.unionecredit.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
        var baseDomain = rawDomain.indexOf('www.') === 0 ? rawDomain.substring(4) : rawDomain;
        var rows = [
            { domain: 'www.' + baseDomain, icp: '滇ICP备2023012345号-1', homeUrl: 'https://www.' + baseDomain + '/', ownerType: '企业', checkDate: '2026-05-22' },
            { domain: 'm.' + baseDomain, icp: '滇ICP备2023012345号-2', homeUrl: 'https://m.' + baseDomain + '/', ownerType: '企业', checkDate: '2026-05-22' },
            { domain: 'static.' + baseDomain, icp: '滇ICP备2023012345号-3', homeUrl: 'https://static.' + baseDomain + '/assets/', ownerType: '企业', checkDate: '2026-05-22' }
        ];
        return { total: rows.length, rows: rows };
    };
})(window);
