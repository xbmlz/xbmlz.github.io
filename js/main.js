// open-menu
$(document).ready(function () {
  // 移动端导航
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
          $("#header-title")
            .css("opacity", "0")
            .css("transform", "translate(0, -100%)")
            .css("transition", "all 0.3s");
        } else {
          $("#header-title")
            .css("opacity", "1")
            .css("transform", "translate(0, 0)")
            .css("transition", "all 0.3s");
        }
      });
    }
    // { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  observer.observe(document.querySelector("#article-title"));

  // go up show
  $(window).scroll(function () {
    if ($(window).scrollTop() > 200) {
      // 添加动画过度
      $("#go-up")
        .css("opacity", "1")
        .css("transform", "translateX(0) rotate(0)")
        .css("transition", "all 0.3s");
    } else {
      $("#go-up")
        .css("opacity", "0")
        .css("transform", "translateX(50px) rotate(180deg)")
        .css("transition", "all 0.3s");
    }
  });
  // go up
  $("#go-up").click(function () {
    $("html,body").animate({ scrollTop: 0 }, 500);
  });

  // code copy 在 figure.highlight 中添加复制按钮
  $("figure.highlight").each(function () {
    const copyIcon = $(
      "<iconify-icon id='copy-icon' width='20' icon='carbon:copy'></iconify-icon>"
    );
    const leftOffset = 25;
    // left
    const left = $(this).width() - leftOffset;
    // set style
    $(copyIcon).css("position", "absolute");
    $(copyIcon).css("left", `${left}px`);
    $(copyIcon).css("top", "15px");
    $(copyIcon).css("cursor", "pointer");
    // add icon
    $(this).append(copyIcon);
    // copy code
    $(copyIcon).click(function () {
      // .code .line
      const code = [...$(this).parent().find(".code .line")]
        .map((line) => line.innerText)
        .join("\n");
      // begin copy
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      var ta = document.createElement("textarea");
      ta.style.top = window.scrollY + "px"; // Prevent page scrolling
      ta.style.position = "absolute";
      ta.style.opacity = "0";
      ta.readOnly = true;
      ta.value = code;
      document.body.append(ta);
      const selection = document.getSelection();
      const selected =
        selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
      ta.select();
      ta.setSelectionRange(0, code.length);
      ta.readOnly = false;
      var result = document.execCommand("copy");
      // change icon
      $(this).attr("icon", result ? "carbon:checkmark" : "carbon:error");
      ta.blur(); // For iOS
      // blur
      $(copyIcon).blur();
      if (selected) {
        selection.removeAllRanges();
        selection.addRange(selected);
      }
      document.body.removeChild(ta);
      // setTimeout change icon
      setTimeout(() => {
        $(this).attr("icon", "carbon:copy");
      }, 1000); // 1s
    });

    // listen overflow-x change icon left
    $(this).scroll(function () {
      const scrollLeft = $(this).scrollLeft();
      const iconLeft = $(this).width() - leftOffset + scrollLeft;
      if (iconLeft > 0) {
        $(copyIcon).css("left", `${iconLeft}px`);
      }
    });
  });
});