'use strict';

/* <tabs-view>: one <button role=tab> per file in a scrollable strip,
   one scrolling <div role=tabpanel> panel per tab filling the remaining
   vertical space, plus an overlay empty state (data-msg) when no tab is open */

const componentCss = `
:host {
  display: flex;
  flex-direction: column;
  position: relative;
  height: calc(100vh - 16px);
  background-color: #fff;
}
[hidden] {
  display: none !important;
}
.tablist {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: thin;
  flex: none;
  border-bottom: solid 2px var(--dark-one, #e4e4e4);
  padding-block-end: 2px;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: calc(var(--gap, 10px) / 2) var(--gap, 10px);
  background-color: var(--dark-one, #e4e4e4);
  border: 0;
  border-radius: 6px 6px 0 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  flex: none;
  max-width: 280px;
}
.tab:hover {
  filter: brightness(0.95);
}
.tab[aria-selected="true"] {
  background-color: var(--dark-one, #e4e4e4);
  font-weight: 600;
  transform: translate(0px, 1px);
}
.tab .title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab .close {
  border: 0;
  padding: 0;
  background-color: transparent;
  color: inherit;
  font: inherit;
  line-height: 1;
  cursor: pointer;
}
.tab .close:hover {
  color: #d00;
}
.panels {
  flex: 1;
  min-height: 0;
}
.panel {
  display: none;
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
}
.panel.active {
  display: block;
}
.empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  font-size: 20px;
  overflow: hidden;
  background-color: #fffbf3;
  padding: 10px;
  text-align: center;
  white-space: pre-wrap;
}
`;

const sheetsReady = fetch('index.css').then(r => r.text()).catch(() => '').then(text => {
  // page-level rules cannot apply inside the shadow tree; keep content-level ones only
  const content = text.replace(/(^|\})\s*(:root|html|body)\s*(?=[,{])[^{]*\{[^{}]*\}/g, '$1');
  const contentSheet = new CSSStyleSheet();
  contentSheet.replaceSync(content);
  const uiSheet = new CSSStyleSheet();
  uiSheet.replaceSync(componentCss);
  return [contentSheet, uiSheet];
});

class TabsView extends HTMLElement {
  static observedAttributes = ['data-msg'];

  #uid = 0;
  #tabs = new Map();
  #tablist;
  #panels;
  #empty;

  constructor() {
    super();
    const root = this.attachShadow({mode: 'open'});

    root.innerHTML = `
      <div class="tablist" role="tablist" aria-label="Opened files"></div>
      <div class="panels"></div>
      <div class="empty"></div>
    `;
    this.#tablist = root.querySelector('.tablist');
    this.#panels = root.querySelector('.panels');
    this.#empty = root.querySelector('.empty');
    this.#empty.textContent = this.getAttribute('data-msg') || '';

    this.#tablist.addEventListener('keydown', e => this.#onKey(e));
    sheetsReady.then(sheets => {
      root.adoptedStyleSheets = sheets;
    });
    this.#sync();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-msg') {
      this.#empty.textContent = newValue || '';
    }
  }

  get ids() {
    return [...this.#tabs.keys()];
  }

  get active() {
    for (const [id, {tab}] of this.#tabs) {
      if (tab.getAttribute('aria-selected') === 'true') {
        return id;
      }
    }
    return null;
  }

  add({title, content}) {
    const id = 'tab-' + (++this.#uid);

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab';
    tab.setAttribute('role', 'tab');
    tab.dataset.id = id;
    tab.addEventListener('click', () => this.activate(id));

    const title1 = document.createElement('span');
    title1.className = 'title';
    title1.textContent = title;
    title1.title = title;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'close';
    close.textContent = '\u00d7';
    close.title = 'Close';
    close.setAttribute('aria-label', 'Close ' + title);
    close.addEventListener('click', e => {
      e.stopPropagation();
      this.close(id);
    });

    tab.append(title1, close);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.setAttribute('role', 'tabpanel');
    panel.dataset.id = id;
    panel.append(content);

    this.#tablist.append(tab);
    this.#panels.append(panel);
    this.#tabs.set(id, {tab, panel});
    this.#sync();

    this.activate(id);
    return id;
  }

  activate(id, {focus = false} = {}) {
    const o = this.#tabs.get(id);
    if (!o) {
      return;
    }
    for (const [key, {tab, panel}] of this.#tabs) {
      const selected = key === id;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
      panel.classList.toggle('active', selected);
    }
    o.tab.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth'
    });
    if (focus) {
      o.tab.focus();
    }
    this.dispatchEvent(new CustomEvent('tab-activate', {
      detail: {id}
    }));
  }

  close(id) {
    const o = this.#tabs.get(id);
    if (!o) {
      return false;
    }
    const event = new CustomEvent('tab-close', {
      detail: {id},
      cancelable: true
    });
    if (!this.dispatchEvent(event)) {
      return false;
    }
    const ids = this.ids;
    const wasActive = o.tab.getAttribute('aria-selected') === 'true';
    const index = ids.indexOf(id);

    o.tab.remove();
    o.panel.remove();
    this.#tabs.delete(id);

    if (wasActive) {
      const nextId = ids[index + 1] || ids[index - 1];
      if (nextId) {
        this.activate(nextId);
      }
    }
    this.#sync();
    if (!this.#tabs.size) {
      this.dispatchEvent(new CustomEvent('tabs-empty'));
    }
    return true;
  }

  replaceContent(id, content) {
    const o = this.#tabs.get(id);
    if (!o) {
      return;
    }
    o.panel.replaceChildren(content);
  }

  #sync() {
    const has = this.#tabs.size > 0;
    this.#tablist.hidden = !has;
    this.#empty.hidden = has;
  }

  #onKey(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      return;
    }
    const ids = this.ids;
    if (!ids.length) {
      return;
    }
    let index = ids.indexOf(this.active);
    index += e.key === 'ArrowLeft' ? -1 : 1;
    this.activate(ids[(index + ids.length) % ids.length], {focus: true});
    e.preventDefault();
  }
}

customElements.define('tabs-view', TabsView);
