// open-menu
$(document).ready(function () {
  $("#open-menu").click(function () {
    // set height auto
    $("#menu-panel").css("height", "auto");
    // set translate y 0
    $("#menu-content").css(
      "transform",
      "translate(0, 0) rotate(0) skew(0) scaleX(1) scaleY(1)"
    );
    $("#open-menu").css("display", "none");
    $("#close-menu").css("display", "block");
  });

  $("#close-menu").click(function () {
    // set height 0
    $("#menu-panel").css("height", "0");
    // set translate y -100%
    $("#menu-content").css(
      "transform",
      "translate(0, -100%) rotate(0) skew(0) scaleX(1) scaleY(1)"
    );
    $("#open-menu").css("display", "block");
    $("#close-menu").css("display", "none");
  });

  // 监听文章标题消失时，在header中显示文章标题
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio > 0) {
          $("#header-title").css("display", "none").css("opacity", "0");
        } else {
          $("#header-title").css("display", "block").css("opacity", "1");
        }
      });
    }
    // { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  observer.observe(document.querySelector("#article-title"));
});
