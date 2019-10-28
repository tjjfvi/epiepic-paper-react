
import $ from "jquery";
import ws from "./ws";

ws.on("message", ([type, css]) => {
  if(type !== "style")
    return;
  $(".__style").remove();
  $("<style>").addClass("__style").text(css).appendTo("body");
})
