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
  let beforeTpl: string;
  let theTpl: string;
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
        // for now, we have to replace **only** the non-space charater(s)
        // after we will have a trimmed version of **beforeTpl**
        beforeTpl = match.replace(/\S/gm, " ");
      }

      // the **template** part `([\s\S]*?)`
      if (groupIndex === 2) {
        theTpl = match;
      }

      // the **backtick** `(`)` at the end of the template
      if (groupIndex === 3) {
        // if **theTpl** starts on new line then remove **all** the whitespaces in the beforeTpl
        // else remove the whitespaces but leave the ones at the end:
        // -> we need the right whitespaces to have the correct indentation
        beforeTpl = (theTpl.match(/^\n/)) ? beforeTpl.replace(/[ ]/gm, '') : beforeTpl.replace(/[ ]*(?=\n+)/gm, '');
        
        // if **theTpl** ends with a new line + whitespaces, we have to remove the whitespaces 
        // -> **right trim**
        if (theTpl.match(/\n[ ]+$/)) {
          theTpl = theTpl.replace(/(?!\n)[ ]+$/gm, '');
        }
        
        inlineTemplate += beforeTpl + theTpl;
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