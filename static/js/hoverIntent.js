
import $ from "jquery";

$("*")
  .on("mouseover", e => setTimeout(() => {
    $(e.target)
      .parents()
      .addBack()
      .filter($(":hover"))
      .addClass("hoverIntent")
  }, 200))
  .on("mouseout", () => $(".hoverIntent:not(:hover)").removeClass("hoverIntent"))
