import { mergeAttributes, Node } from '@tiptap/core';

function getElAttrs(el: HTMLElement): Record<string, string> {
  const o: Record<string, string> = {};
  if (el?.attributes) {
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      o[a.name] = a.value;
    }
  }
  return o;
}

function parseHtmlAttrs(val: unknown): Record<string, string> {
  if (typeof val === 'string') {
    try {
      const o = JSON.parse(val);
      return typeof o === 'object' && o !== null ? o : {};
    } catch {
      return {};
    }
  }
  return typeof val === 'object' && val !== null && !Array.isArray(val) ? (val as Record<string, string>) : {};
}

function renderHtmlAttrs(attrs: { htmlAttrs?: string | Record<string, string> }): Record<string, string> {
  const v = attrs.htmlAttrs;
  return parseHtmlAttrs(v);
}

function blockWithAttrs(tag: string) {
  return Node.create({
    name: tag,
    group: 'block',
    content: 'block*',
    parseHTML() {
      return [{ tag, getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
    },
    addAttributes() {
      return {
        htmlAttrs: {
          default: '{}',
          parseHTML: (el) => JSON.stringify(getElAttrs(el)),
          renderHTML: renderHtmlAttrs,
        },
      };
    },
    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes), 0];
    },
  });
}

function inlineWithAttrs(tag: string) {
  return Node.create({
    name: tag,
    group: 'inline',
    content: 'inline*',
    inline: true,
    parseHTML() {
      return [{ tag, getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
    },
    addAttributes() {
      return {
        htmlAttrs: {
          default: '{}',
          parseHTML: (el) => JSON.stringify(getElAttrs(el)),
          renderHTML: renderHtmlAttrs,
        },
      };
    },
    renderHTML({ HTMLAttributes }) {
      return [tag, mergeAttributes(HTMLAttributes), 0];
    },
  });
}

export const EmailDiv = blockWithAttrs('div');
export const EmailForm = blockWithAttrs('form');
export const EmailFieldset = blockWithAttrs('fieldset');

export const EmailSpan = inlineWithAttrs('span');
export const EmailLabel = inlineWithAttrs('label');

export const EmailLegend = Node.create({
  name: 'legend',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'legend', getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
  },
  addAttributes() {
    return {
      htmlAttrs: { default: '{}', parseHTML: (el) => JSON.stringify(getElAttrs(el)), renderHTML: renderHtmlAttrs },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['legend', mergeAttributes(HTMLAttributes), 0];
  },
});

export const EmailButton = Node.create({
  name: 'emailButton',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'button', getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
  },
  addAttributes() {
    return {
      htmlAttrs: { default: '{}', parseHTML: (el) => JSON.stringify(getElAttrs(el)), renderHTML: renderHtmlAttrs },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['button', mergeAttributes(HTMLAttributes), 0];
  },
});

export const EmailInput = Node.create({
  name: 'emailInput',
  group: 'inline',
  atom: true,
  addAttributes() {
    return {
      htmlAttrs: { default: '{}', parseHTML: (el) => JSON.stringify(getElAttrs(el)), renderHTML: renderHtmlAttrs },
    };
  },
  parseHTML() {
    return [{ tag: 'input', getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['input', mergeAttributes(HTMLAttributes)];
  },
});

export const EmailTextarea = Node.create({
  name: 'emailTextarea',
  group: 'block',
  content: 'text*',
  parseHTML() {
    return [{ tag: 'textarea', getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
  },
  addAttributes() {
    return {
      htmlAttrs: { default: '{}', parseHTML: (el) => JSON.stringify(getElAttrs(el)), renderHTML: renderHtmlAttrs },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['textarea', mergeAttributes(HTMLAttributes), 0];
  },
});

export const EmailOption = Node.create({
  name: 'emailOption',
  group: 'option',
  content: 'text*',
  parseHTML() {
    return [{ tag: 'option', getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
  },
  addAttributes() {
    return {
      htmlAttrs: { default: '{}', parseHTML: (el) => JSON.stringify(getElAttrs(el)), renderHTML: renderHtmlAttrs },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['option', mergeAttributes(HTMLAttributes), 0];
  },
});

export const EmailSelect = Node.create({
  name: 'emailSelect',
  group: 'block',
  content: 'option*',
  parseHTML() {
    return [{ tag: 'select', getAttrs: (dom) => ({ htmlAttrs: JSON.stringify(getElAttrs(dom as HTMLElement)) }) }];
  },
  addAttributes() {
    return {
      htmlAttrs: { default: '{}', parseHTML: (el) => JSON.stringify(getElAttrs(el)), renderHTML: renderHtmlAttrs },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['select', mergeAttributes(HTMLAttributes), 0];
  },
});

export const EmailSection = blockWithAttrs('section');
export const EmailHeader = blockWithAttrs('header');
export const EmailFooter = blockWithAttrs('footer');
export const EmailMain = blockWithAttrs('main');
export const EmailArticle = blockWithAttrs('article');
export const EmailAside = blockWithAttrs('aside');
export const EmailNav = blockWithAttrs('nav');

export const emailHtmlNodes = [
  EmailDiv,
  EmailSpan,
  EmailForm,
  EmailInput,
  EmailButton,
  EmailTextarea,
  EmailLabel,
  EmailFieldset,
  EmailLegend,
  EmailSelect,
  EmailOption,
  EmailSection,
  EmailHeader,
  EmailFooter,
  EmailMain,
  EmailArticle,
  EmailAside,
  EmailNav,
];
