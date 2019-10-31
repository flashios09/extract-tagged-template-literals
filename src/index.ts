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

  const regex = new RegExp("([\\s\\S]*?(?:" + tag + ")`)([\\s\\S]*?[^\\\\])(?:`)", "gm");
  let m;
  let beforeTpl: string = "";
  let theTpl: string = "";
  let inlineTemplates: string = "";
  while ((m = regex.exec(documentContent)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // the **before** part `([\s\S]*?hbs`)` from anything to *hbs`*
      if (groupIndex === 1) {
        // we need **theTpl** to know how to trim the **beforeTpl** part.
        beforeTpl = match;
      }

      // the **template** part `([\s\S]*?[^\\])`
      if (groupIndex === 2) {
        beforeTpl = _trimBeforeTpl(beforeTpl, match); 
        theTpl = _trimTheTpl(match);
      
        inlineTemplates += beforeTpl + theTpl;
      }
    });
  }

  return inlineTemplates;
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

/**
 * Trim the **beforeTpl** part **([\s\S]*?hbs`)** from anything to **hbs`**.
 * 
 * First we need to replace the non-whitespace characters `\S` with a space `" "` then we check the template itself:
 * - If **theTpl** starts on new line then remove **all** the whitespaces in the **beforeTpl**.
 * - Else remove the whitespaces **but leave the ones at the end**, we need the to have the correct **indentation**.
 *
 * @param {string} beforeTpl The before template part **([\s\S]*?hbs`)** from anything to **hbs`**.
 * @param {string} theTpl The **raw** template itself.
 * @returns {string} The trimmed **beforeTpl**, without the non-space caracters and without the trailing spaces.
 */
function _trimBeforeTpl(beforeTpl: string, theTpl: string): string {
  const beforeTplWhitespaced = beforeTpl.replace(/\S/gm, " ");
  const beforeTplTrimmed = (theTpl.match(/^\n/)) ? 
    beforeTplWhitespaced.replace(/[ ]/gm, '') : 
    beforeTplWhitespaced.replace(/[ ]*(?=\n+)/gm, '');

  return beforeTplTrimmed;
}

/**
 * Trim **theTpl** part `([\s\S]*?[^\\])`.
 * 
 * Check if **theTpl** ends with a new line + trailing whitespaces, then we have to remove the trailing whitespaces 
 * on the last(new)line(**right trim**) to avoid `trainling-spaces` template lint error.
 *
 * @param {string} theTpl The **raw** template.
 * @returns {string} The trimmed **tpl**
 */
function _trimTheTpl(theTpl: string): string {
  if (theTpl.match(/\n[ ]+$/)) {
    const theTplTrimmed = theTpl.replace(/(?!\n)[ ]+$/gm, '');
    
    return theTplTrimmed;
  }
  
  return theTpl;
}