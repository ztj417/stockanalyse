/*
 * @Author: wuzhou
 * @Date: 2021-03-29 09:01:27
 * @LastEditTime: 2021-04-30 09:09:03
 * @LastEditors: wuzhou
 * @Description: 
 */
'use strict';
/* global */

/**!
 * 知识图谱
 * author: fxyue
 * date:2021-03-01
 */

// (function (win, $) {
var $main = $('#main'),
  $tabview = $('.tabview', $main),
  $hd = $('.choose-note', $tabview),
  $bd = $('.choose-content', $tabview);

/**
 * tab切换
 * @param {tab切换dom对象} $dom 
 * @param {配置项} opts 
 */
function getTabView($dom, opts) {
  $dom.Tab($.extend({
    hd: '.hdl',
    bd: '.bdl',
    event: 'click',
    target: 'target',
    after: function ($hitem) {
      var key = $hitem.children('.item-name').data('key');
      key = !key ? '' : key;
      sessionStorage.setItem('abkeys', [key].join(','));
    }
  }, opts));
}
getTabView($tabview);

// 21319yx新增
// 默认画布名称赋值
var keyword = sessionStorage.getItem('keyword');
$('#item-name').text(keyword);


// 关闭tab
$main.on('click', '.choose-note-close', function () {
  var cLen = $hd.children().length,
    key = $(this).parent('.choose-note-item').data('target'),
    $hitems = $hd.children('.choose-note-item[data-target="' + key + '"]'),
    $bitems = $bd.children('.choose-content-list[data-target="' + key + '"]');
  if (cLen > 1) {
    $hitems.remove();
    $bitems.remove();
    $hd.children('.choose-note-item').eq(0).click();
    getTabView($tabview);
  }
});

// })(this, jQuery);
