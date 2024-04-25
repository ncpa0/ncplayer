const appliedStylesheets = new Map<string, HTMLStyleElement>();

export function mountStylesheet(css: string) {
  const head = document.head;
  if (head == null) {
    return { remove() {} };
  }

  if (appliedStylesheets.has(css)) {
    return {
      remove() {
        const style = appliedStylesheets.get(css);
        if (style != null) {
          style.remove();
          appliedStylesheets.delete(css);
        }
      },
    };
  }

  const style = document.createElement("style");
  style.textContent = css;
  head.appendChild(style);
  appliedStylesheets.set(css, style);

  return {
    remove() {
      style.remove();
      appliedStylesheets.delete(css);
    },
  };
}
