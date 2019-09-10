/**
 * Search and extract the tagged template literals from javascript/typescript file.
 *
 * It's possible to use more than one tag via the `|` (regex **or** separator), valid tags:
 * - `hbs`
 * - `hbs|handlebars`
 * - `hbs|handlebars|dotted.string`
 *
 * ### Example
 *
 * from:
 * ```ts
 * import GlimmerComponent from '@glimmer/component';
 * import hbs from 'ember-cli-htmlbars-inline-precompile';
 * const template = hbs`
 * <button
 *  type={{this.type}}
 * >
 *    {{yield}}
 * </button>
 * `;
 *
 * class MyButtonComponent extends GlimmerComponent {
 *   type: string = 'button';
 * };
 *
 * export default Ember._setComponentTemplate(template, MyButtonComponent);
 * ```
 *
 * to:
 * ```hbs
 *
 *
 *
 * <button
 *  type={{this.type}}
 * >
 *    {{yield}}
 * </button>
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @param {string} documentContent The document content.
 * @param {string} tag The tag to use, e.g `hbs`, `hbs|handlebars`, `hbs|handlebars|dotted.string`.
 * @returns {string|never} The extracted literal template(s) or an error if an invalid tag is passed.
 */
export function searchAndExtract(documentContent: string, tag: string): string | never {
  const tagRegex = /^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*(?:\|[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)*$/g;
  if (tag.match(tagRegex) === null) {
    throw new Error(`Invalid passed tag \`${tag}\`, see the \`searchAndExtract\` documentation for valid format !`);
  }

  const regex = new RegExp("([\\s\\S]*?(?:" + tag + ")`)([\\s\\S]*?)((?<=[^\\\\])`)", "gm");
  let m;
  let inlineTemplate = "";
  while ((m = regex.exec(documentContent)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // the **before** part `([\s\S]*?hbs`)` from anything to *hbs`*
      if (groupIndex === 1) {
        // replace **only** the space character(s) or the non-space charater(s)
        // don't touch the `\n`, `\t`, `r`, `\f`, `v`, we need them to have the correct indentation
        inlineTemplate += match.replace(/[ ]|\S/gm, " ");
      }

      // the **template** part `([\s\S]*?)`
      if (groupIndex === 2) {
        inlineTemplate += match;
      }

      // the **backtick** `(`)` at the end of the template
      if (groupIndex === 3) {
        inlineTemplate += match.replace("`", " ");
      }
    });
  }

  return inlineTemplate;
}

/**
 * A wrapper for `searchAndExtract` with default tag `hbs|handlebars`.
 *
 * @param {string} documentContent The document content.
 * @returns {string} The extracted literal template(s).
 */
export function searchAndExtractHbs(documentContent: string): string {
  return searchAndExtract(documentContent, 'hbs|handlebars');
}