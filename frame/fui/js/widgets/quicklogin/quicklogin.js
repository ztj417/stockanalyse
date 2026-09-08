(function (win, $) {
    var $shortLogin = $('#shortcut-login'),
        $loginType = $shortLogin.find('.login-type'),
        $loginTypeTrigger = $shortLogin.find('.login-type-trigger'),
        $inputType = $shortLogin.find('.login-input'),

        $userInput = $inputType.find('.user-input'),
        $usbInput = $inputType.find('.usb-input'),

        $loginBtn = $shortLogin.find('.login-btn');


    var $name = $('#r-user-name'),
        $pwd = $('#r-user-pw'),
        $usbpsd = $('#r-usb-pw');

    // 检测usb
    function checkUsbKey() {
        var str;
        try {
            str = document.all('EliteIVGetSerialNumber').SERIAL_NUMBER();
        } catch (e) {
            // epoint.alert("当前浏览器不支持");
            return false;
        }
        return str;
    }

    var initEvent = function () {
        // 聚焦时清除错误 重置按钮可用性
        $userInput.find('input').on('focus', function () {
            var $this = $(this);

            $this.parent().removeClass('haserror');
            if ($this.hasClass('r-user-name')) {
                $this.attr('placeholder', '请输入用户名');
            } else if ($this.hasClass('r-user-pw')) {
                $this.attr('placeholder', '请输入密码');
            }
            $loginBtn.prop('disabled', false).removeClass('unable');
        });
        $usbInput.find('input').on('focus', function () {
            var $this = $(this);

            $this.parent().removeClass('haserror');

            if ($this.hasClass('r-usb-pw')) {
                $this.attr('placeholder', '请输入密码');
            }
            $loginBtn.prop('disabled', false).removeClass('unable');
        });

        //  登录类型切换
        $loginTypeTrigger.on('click', function () {
            // 类型切换
            relogin.switchLoginType();
        });

        // 登录
        $loginBtn.on('click', function () {
            encryUserMsg();
        });

        // var securityKey;

        // // 获取加密key
        // epoint.execute("loginaction.autoLoad", "", function(data) {
        //     if (win.RSAUtils !== undefined) {
        //         securityKey = RSAUtils.getKeyPair(data.publicExponent, "", data.modulus);
        //     } else {
        //         Util.loadJs('js/security.js', function() {
        //             securityKey = RSAUtils.getKeyPair(data.publicExponent, "", data.modulus);

        //         });
        //     }
        // });


        var userName;
        var passWord;
        var viewData,
            loginId = '';

        try {
            viewData = mini.get('_common_hidden_viewdata').getValue();
            if (viewData) {
                viewData = mini.decode(viewData);
                loginId = viewData.epoint_user_loginid || '';
            }
        } catch (e) {}
        var encryUserMsg = function () {

            // var result = true;
            if ('0' == relogin.loginType) {
                userName = $.trim($name.val());
                passWord = $.trim($pwd.val());
                if (!(userName && passWord)) {
                    // result = false;
                    // epoint.alert('用户名和密码不能为空!');
                    $userInput.addClass('haserror');

                    $pwd.attr('placeholder', '密码错误');
                    // 禁用按钮
                    $loginBtn.prop('disabled', true).addClass('unable');
                    return false;
                }
            } else if ('10' == relogin.loginType) {
                userName = checkUsbKey();
                passWord = $.trim($usbpsd.val());
                if (!(userName && passWord)) {
                    // result = false;
                    // epoint.alert('未检测到CA锁，请插入CA锁!');

                    $usbInput.addClass('haserror');

                    $usbpsd.attr('placeholder', '密码错误');
                    // 禁用按钮
                    $loginBtn.prop('disabled', true).addClass('unable');
                    return false;
                }
            }


            //避免中文登录名的问题，先进行utf-8编码
            userName = epoint.encode(userName);
            passWord = epoint.encode(passWord);
            epoint.execute('loginaction.login', '@none', [
                userName, passWord, '499', loginId
            ], checkMultipleLogin);

        };

        var checkMultipleLogin = function (args) {
            if (args.systemMessages) {
                if (args.systemMessages.indexOf('此账号') != -1) {
                    var msgs = args.systemMessages.split('?');
                    epoint.confirm(msgs[0] + '?', '', function () {
                        epoint.execute('loginaction.login', '@none', [userName,
                            passWord, '498', loginId
                        ], checkMultipleLogin);
                    });
                } else if (args.systemMessages.indexOf('IsDefaultOU') != -1) {
                    // 轻量级登录 不考虑这这两种情况的具体实现了
                    // 具体细节可参考login页面中的代码
                    relogin.hide();
                } else {
                    epoint.alert(args.systemMessages);
                }
            } else {
                // 没有表示成功了 隐藏快捷登录框
                relogin.hide();
            }

        };

    };
    /**
     * [getValueFromCookie 根据指定的key重cookie中读取值]
     * @param  {[string]} key [key]
     * @return {[string]}     [value]
     */
    // function getValueFromCookie(key) {
    //     var cookieArr = document.cookie.split(';');

    //     var value;
    //     for (var i = 0, l = cookieArr.length; i < l; i++) {
    //         if (cookieArr[i].indexOf(key) != -1) {
    //             value = cookieArr[i].split('=')[1];
    //             break;
    //         }
    //     }

    //     return value;
    // }

    var PASSWORD_MT = 0,
        USB_MT = -50;

    var relogin = {
        // 是否已经初始化
        isInit: false,
        // 默认登录类型 0为用户名 10为usbkey
        loginType: '0',
        // 切换登录类型 （设置登录类型并进行切换）
        // 不传参数则进行切换
        // "0"则切换到用户名登录 "10"切换到usekey登录
        // 返回更改(切换)后的登录类型 "0" 或 "10"
        switchLoginType: function (type) {
            //获取usbkey
            var usbkey = checkUsbKey();
            // 不传参数则进行切换
            if (type === undefined) {
                if (this.loginType == '0') {
                    $loginType.stop(true).animate({
                            marginTop: USB_MT
                        }, 300);
                    $inputType.stop(true).animate({
                        marginTop: USB_MT
                    }, 300);

                    this.loginType = '10';


                    if (usbkey) {
                        $usbInput.removeClass('haserror');
                    } else {
                        $usbInput.addClass('haserror');
                        $usbpsd.attr('placeholder', '当前浏览器不支持').prop('disabled', true);
                        // $usbpsd.attr('value','当前浏览器不支持').prop('disabled', true);
                    }


                } else {
                    $loginType.stop(true).animate({
                            marginTop: PASSWORD_MT
                        }, 300);
                    $inputType.stop(true).animate({
                        marginTop: PASSWORD_MT
                    }, 300);

                    this.loginType = '0';

                }
            }
            // 指定类型则切换到
            // 切换到用户名登录
            if (type == '0') {
                $loginType.stop(true).animate({
                        marginTop: PASSWORD_MT
                    }, 300);
                $inputType.stop(true).animate({
                    marginTop: PASSWORD_MT
                }, 300);

                this.loginType = '0';


                // 切换到密码登录
            } else if (type == '10') {
                $loginType.stop(true).animate({
                        marginTop: USB_MT
                    }, 300);
                $inputType.stop(true).animate({
                    marginTop: USB_MT
                }, 300);

                this.loginType = '10';

                if (usbkey) {
                    $usbInput.removeClass('haserror');
                } else {
                    $usbInput.addClass('haserror');
                    $usbpsd.attr('placeholder', '当前浏览器不支持').prop('disabled', true);
                    // $usbpsd.attr('value','当前浏览器不支持').prop('disabled', true);
                }

            }
            // 控制登录按钮可用性
            if (relogin.loginType == '0') {
                if ($userInput.hasClass('haserror')) {
                    $loginBtn.prop('disabled', true).addClass('unable');
                } else {
                    $loginBtn.prop('disabled', false).removeClass('unable');
                }
            } else if (relogin.loginType == '10') {
                if ($usbInput.hasClass('haserror')) {
                    $loginBtn.prop('disabled', true).addClass('unable');
                } else {
                    $loginBtn.prop('disabled', false).removeClass('unable');
                }
            }
            return this.loginType;
        },
        // 显示快捷登录框
        show: function () {
            if (!this.isInit) {
                initEvent();
                this.isInit = true;
            }

            // 显示的层级统一使用miniui的来管理
            $shortLogin.css('z-index', mini.getMaxZIndex()).removeClass('hidden');

            // 读本地 切换类型 并在用户名登录下自动填充用户名
            if (win.localStorage) {
                var reLoginType = localStorage.getItem('_loginType_');
                var reUsername = localStorage.getItem('_loginUsername_');
                if (reLoginType) {
                    this.switchLoginType(reLoginType);
                }
                // 如果是用户名输入 则设置用户名
                if (this.loginType == '0' && reUsername) {
                    $name[0].value = reUsername;
                }
            }

        },
        // 登录成功后隐藏快捷登录框
        hide: function () {
            $shortLogin.addClass('hidden');
            // 成功后应该把密码清空
            $pwd.val('');
        }
    };
    // initEvent();

    // 兼容下之前不合理的命名quicklyLogin
    win.quickLogin = win.quicklyLogin = relogin;

})(window, jQuery);