'use strict';
var THEME_CONFIG = {
    idea: {
        layout: 'simple',
        defaultSkin: 'cyanine',
        skins: [
            {
                name: 'cyanine',
                cname: '天青石',
                color: '#2f6be5'
            },
            {
                name: 'grassblue',
                cname: '露草蓝',
                color: '#36a0ea'
            },
            {
                name: 'pomegranatered',
                cname: '榴花红',
                color: '#f45051'
            },
            {
                name: 'graphiteblack',
                cname: '石墨黑',
                color: '#323449'
            }
        ]
    },
    aide: {
        layout: 'simple',
        skins: [
            {
                name: 'default',
                cname: '露草蓝',
                color: '#2884d9'
            },
            {
                name: 'red',
                cname: '海棠红',
                color: '#ef6366'
            },
            {
                name: 'green',
                cname: '松柏绿',
                color: '#02b9b5'
            }
        ]
    },
    breeze: {
        layout: 'simple',
        skins: [
            {
                name: 'default',
                color: '#52aed6'
            },
            {
                name: 'paas',
                cname: 'PaaS',
                color: '#2a2a36'
            }
        ]
    },
    grace: {
        layout: 'simple',
        skins: [
            {
                name: 'default',
                cname: '露草蓝',
                color: '#2884d9'
            },
            {
                name: 'red',
                cname: '海棠红',
                color: '#ef6366'
            },
            {
                name: 'green',
                cname: '松柏绿',
                color: '#02b9b5'
            },
            {
                name: 'blue',
                cname: '天空蓝',
                color: '#268ae2',
                disabled: true
            },
            {
                name: 'dark',
                cname: '深夜黑',
                color: '#14204f',
                disabled: true
            }
        ]
    }
};
document.write(
    '<style>.page-loading{position:fixed;z-index:1000;top:0;right:0;bottom:0;left:0;background-color:#fff}</style>'
);
var _rootPath = typeof window._rootPath === 'string' ? window._rootPath : (function () {
    var path = location.pathname.replace(/\\/g, '/');
    var marker = '/frame/';
    var markerIndex = path.indexOf(marker);

    if (markerIndex !== -1) {
        return path.substring(0, markerIndex);
    }

    if (path.indexOf('/') === 0) {
        path = path.substring(1);
    }

    return '/' + path.split('/')[0] + '/' + path.split('/')[1];
})();

// 框架版本号
var _v = '9.5.0';

// 时间戳
// 在静态资源有更新时需要修改下值，以解决缓存问题
var _t = '202103261619';

// default 字体大小下 html 的fontsize
var HtmlBaseFontSize = 100;
// default 字体大小下 body 的fontsize
var BodyBaseFontSize = 14;
// default 字体大小下的缩放比例
var fontSizeRatio = 1;

(function (win) {
    // 主题界面的url规则
    var themeReg = /^https?:\/\/.*\/fui\/pages\/themes\/(\w+)\/\1/i;
    // 当前页面的url
    var curUrl = win.location.toString();
    // 当前页是否是主界面
    var isThemePage = themeReg.test(curUrl);

    var theme, skin;

    if (isThemePage) {
        theme = curUrl.match(themeReg)[1];

        setCookie('_theme_', theme, 365);
    }

    // 非主界面页面从cookie中读取主题名、 风格、皮肤
    theme = theme || getCookie('_theme_') || 'grace';
    skin =
        getCookie('_' + theme + '_skin_') || (THEME_CONFIG[theme] && THEME_CONFIG[theme]['defaultSkin']) || 'default';

    function getCookie(sName) {
        var aCookie = document.cookie.split('; ');
        var lastMatch = null;
        for (var i = 0; i < aCookie.length; i++) {
            var aCrumb = aCookie[i].split('=');
            if (sName == aCrumb[0]) {
                lastMatch = aCrumb;
                break;
            }
        }
        if (lastMatch) {
            var v = lastMatch[1];
            if (v === undefined) {
                return v;
            }
            return decodeURI(v);
        }
        return null;
    }

    function setCookie(name, value, expires, domain) {
        var largeExpDate = new Date();
        if (expires !== null) {
            largeExpDate = new Date(largeExpDate.getTime() + expires * 1000 * 3600 * 24); //expires天数
        }

        document.cookie =
            name +
            '=' +
            escape(value) +
            (expires === null ? '' : '; expires=' + largeExpDate.toGMTString()) +
            ';path=' +
            (_rootPath ? _rootPath : '/;') +
            (domain ? '; domain=' + domain : '');
    }

    var SrcBoot = {
        setCookie: setCookie,
        getCookie: getCookie,
        isIE8: !!document.all && document.querySelector && !document.addEventListener,
        curTheme: theme,
        curSkin: skin,
        getPath: function (path) {
            // 全路径
            if (/^(http|https|ftp)/g.test(path)) {
                return path;
            }

            // 用于测试本地mockjs测试用例js，约定以_test最为前缀，debug为false时不在页面输出
            if (path.indexOf('_test') != -1 && !this.debug) {
                return false;
            }

            // 是否是相对路径
            var isRelative = path.indexOf('./') === 0 || path.indexOf('../') === 0;

            path = (isRelative ? '' : _rootPath + '/') + path;

            return path;
        },

        getExt: function (path) {
            if (path.indexOf('?') != -1) {
                path = path.split('?')[0];
            }

            var dotPos = path.lastIndexOf('.'),
                ext = path.substring(dotPos + 1);

            return ext;
        },

        // 处理资源路径
        handleResPath: function (res) {
            res = this.getPath(res);

            // 增加时间戳
            return [res, '?_=', _v, '_', _t].join('');
        },

        // 批量输出css|js
        output: function (arr) {
            var i = 0,
                len = arr.length,
                id,
                path,
                ext;

            for (; i < len; i++) {
                if (Object.prototype.toString.call(arr[i]) === '[object Array]') {
                    id = arr[i][0];
                    path = this.handleResPath(arr[i][1]);
                } else {
                    path = this.handleResPath(arr[i]);
                }

                if (path) {
                    ext = this.getExt(path);

                    if (ext === 'css') {
                        document.writeln(
                            '<link ' + (id ? 'id="' + id + '"' : '') + ' rel="stylesheet" href="' + path + '">'
                        );
                    } else {
                        document.writeln(
                            '<script ' + (id ? 'id="' + id + '"' : '') + ' src="' + path + '"></sc' + 'ript>'
                        );
                    }
                }
                id = path = null;
            }
        },
        getThemeConfig: function (themeName) {
            return (
                THEME_CONFIG[themeName] || {
                    layout: 'simple',
                    skins: [
                        {
                            name: 'default',
                            cname: '露草蓝',
                            color: '#2884d9'
                        }
                    ]
                }
            );
        },

        getThemeSkins: function (themeName, withDisabled) {
            var skins = this.getThemeConfig(themeName).skins;

            return withDisabled
                ? skins
                : skins.filter(function (item) {
                      return item.disabled ? false : true;
                  });
        },

        _linkTpl: '<link ${id} rel="stylesheet${alternate}" name="${type}" data-name="${name}" ${title} href="${href}" ${disabled}>',
        genderLink: function (data) {
            return this._linkTpl
                .replace(/\${id}/, data.id ? 'id="' + data.id + '"' : '')
                .replace(/\${alternate}/, data.alternate)
                .replace(/\${disabled}/, data.alternate ? "disabled" : "")
                .replace(/\${title}/, data.title)
                .replace(/\${type}/, data.type)
                .replace(/\${name}/, data.name)
                .replace(/\${href}/, data.href);
        },
        /**
         * 输出皮肤资源
         * @param {Boolean} isTheme 是否主界面
         * @param {string} themeName 主题名称
         * @param {array<skin>} skins 皮肤数组
         * @param {string} currSkin 应用中的皮肤
         * @dep
         */
        outputSkin: function (isTheme, themeName, skins, currSkin) {
            var i = 0,
                l = skins.length,
                skin,
                uiSkinPrefix = 'frame/fui/mutableui/skins/',
                themeSkinPrefix = 'frame/fui/pages/themes/' + themeName + '/skins/',
                delayArr = [],
                isCurr = false,
                linkStr = '',
                alternate = '',
                title = '';
            for (; i < l; i++) {
                skin = skins[i];
                if (skin.disabled) {
                    continue;
                }
                isCurr = skin.name === currSkin;
                title = isCurr ? '' : 'title="' + (skin.cname || skin.name) + '"';
                alternate = isCurr ? '' : ' alternate';
                linkStr = this.genderLink({
                    id: isCurr ? 'common-skin' : '',
                    type: 'fui-ui-style',
                    name: skin.name,
                    title: title,
                    alternate: alternate,
                    href: this.handleResPath(uiSkinPrefix + skin.name + '/skin.css')
                });
                if (isTheme) {
                    linkStr += this.genderLink({
                        type: 'fui-theme-style',
                        name: skin.name,
                        title: title,
                        alternate: alternate,
                        href: this.handleResPath(themeSkinPrefix + skin.name + '/skin.css')
                    });
                }
                // 当前使用的直接输出 其他皮肤迟延加载
                if (isCurr) {
                    output(linkStr);
                } else {
                    delayArr.push(linkStr);
                }
            }

            if (delayArr.length) {
                setTimeout(
                    function () {
                        document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', delayArr.join(''));
                    },
                    isTheme ? 1000 : 500
                );
            }

            function output(str) {
                document.writeln(str);
            }
        },

        outputCustomSkin: function (skinPath) {
            var skins = this.getThemeSkins(theme),
                cskin,
                delayArr = [],
                isCurr = false,
                linkStr = '',
                i = 0,
                l = skins.length,
                alternate = '',
                title = '';

            for (; i < l; i++) {
                cskin = skins[i];
                if (skin.disabled) {
                    continue;
                }
                isCurr = cskin.name === skin;
                title = isCurr ? '' : 'title="' + (cskin.cname || cskin.name) + '"';
                alternate = isCurr ? '' : ' alternate';
                // linkStr = '<link rel="stylesheet' + (isCurr ? '' : ' alternate') + '" name="' + name + '" data-name="' + cskin.name + '" title="' + (cskin.cname || cskin.name) + '" href="' + this.handleResPath(skinPath + cskin.name + '/skin.css') + '"/>';

                linkStr = this.genderLink({
                    type: 'fui-ui-style',
                    name: cskin.name,
                    title: title,
                    alternate: alternate,
                    href: this.handleResPath(skinPath + cskin.name + '/skin.css')
                });

                // 当前使用的直接输出 其他皮肤迟延加载
                if (isCurr) {
                    document.writeln(linkStr);
                } else {
                    delayArr.push(linkStr);
                }
            }

            if (delayArr.length) {
                setTimeout(function () {
                    document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', delayArr.join(''));
                }, 500);
            }
        },

        /*
         * 是否调试环境
         * 当debug为false，则全部使用压缩代码，适合生产环境
         * 当debug为true时，
         *   1. develop为false，则使用有除miniui外的未压缩代码，适合项目开发环境
         *   2. develop为true， 则全部使用未压缩代码，适合框架开发环境
         */
        debug: true,

        /*
         * 是否开发环境。
         * 只有当debug为true时该配置才有效
         * 拥有完全未压缩代码的权限才能使用该配置
         * 框架发布时需将该配置改为false
         */
        develop: true,
        /*
         * 是否开启数据模拟。
         * 开启后不会对epoint.execute和epoint.initPage请求的url进行处理。
         */
        mock: false
    };

    // 字体大小放大效果实现
    var _fontSizeRatio = getCookie('_font_size_ratio_');
    if (_fontSizeRatio) {
        fontSizeRatio = _fontSizeRatio;
    }

    var setBaseFontSize = function () {
        document.addEventListener('DOMContentLoaded', function () {
            document.documentElement.style.fontSize = calcFontSize(HtmlBaseFontSize, fontSizeRatio);
            document.body.style.fontSize = calcFontSize(BodyBaseFontSize, fontSizeRatio);
        });
    };

    var calcFontSize = function (base, ratio) {
        return (base * ratio).toFixed(6) + 'px';
    };
    var arr = [
        // 操作图标
        'frame/fui/mutableui/action/action.css',

        // 模块图标
        'frame/fui/css/modicons.min.css'
    ];

    if (!SrcBoot.isIE8) {
        setBaseFontSize();
    }
    // 检查皮肤 确定皮肤是有效值 避免无效 cookie 导致页面完全无法显示
    !(function fixSkin() {
        var list = SrcBoot.getThemeSkins(theme);
        if (
            !list.some(function (item) {
                return item.name === skin;
            })
        ) {
            if (THEME_CONFIG[theme] && THEME_CONFIG[theme]['defaultSkin']) {
                skin = THEME_CONFIG[theme]['defaultSkin'];
            } else {
                skin = list[0].name;
            }
        }
    })();

    // 如果是主界面，则输出主界面的css样式
    if (isThemePage) {
        // 主界面css文件
        arr.push('frame/fui/pages/themes/' + theme + '/' + theme + (SrcBoot.debug ? '' : '.min') + '.css');
    }
    // 页面预埋一个 style 标签 用于懒加载皮肤的样式文件
    var lazyLoadStyle = document.createElement('style');
    lazyLoadStyle.id = 'lazy-load-style';
    lazyLoadStyle.setAttribute('type', 'text/css');
    document.getElementsByTagName('head')[0].appendChild(lazyLoadStyle);

    SrcBoot.output(arr);
    // 输出控件皮肤 主界面皮肤
    SrcBoot.outputSkin(isThemePage, theme, SrcBoot.getThemeSkins(theme, true), skin);

    win.SrcBoot = SrcBoot;
})(this);

