// Apply the theme before React and styles load to avoid a light-mode flash.
(() => {
  let saved;
  try {
    saved = localStorage.getItem("solvault.theme");
  } catch {
    /* Storage may be unavailable. */
  }
  const theme =
    saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.dataset.theme = theme;
})();
