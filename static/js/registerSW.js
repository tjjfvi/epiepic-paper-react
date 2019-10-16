
import React from "react";
import { observable } from "./hobo";
import rightClick from "./rightClick";

const showUpload = observable(false);
const uploadDone = observable(false);

const upload = e => {
  uploadDone(false);
  let { files } = e.target;
  Promise.all([...files].map(file => fetch(`/upload/${file.name}`, {
    method: "POST",
    body: file
  }))).then(() => uploadDone(true));
};
const resetImages = () => fetch("/resetImages");

if("serviceWorker" in navigator)
  navigator.serviceWorker.register("/sw.js").then(reg => {
    console.log("SW Registered", reg);
    showUpload(true);
  }).catch(console.error);

const UploadButton = () =>
  <label className={
    (showUpload.use()() ? "show" : "") +
    " UploadButton " +
    (uploadDone.use()() ? "done" : "")
  } {...rightClick([{ name: "Wipe Images", func: resetImages, class: "evil" }])}>
    <input type="file" multiple onChange={upload} accept=".jpg"/>
  Apply Images
  </label>

export { UploadButton };
