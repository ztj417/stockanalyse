 // rem适配代码
 window.setBasicSize = function () {
     var docEl = top.document.documentElement,
         clientWidth = docEl.clientWidth;
     if (clientWidth < 1366) clientWidth = 1366;
     document.documentElement.style.fontSize = (50 / 683 * clientWidth) + 'px';
 };

 var pageResizeTimer = null;
 window.addEventListener('resize', function () {
     if (pageResizeTimer) clearTimeout(pageResizeTimer);
     pageResizeTimer = this.setTimeout(setBasicSize, 50);
 });

 document.addEventListener('DOMContentLoaded', function () {
     setBasicSize();
 });