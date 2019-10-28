import { searchAndExtract } from "../index";
const documentContentOne = `
  import GlimmerComponent from '@glimmer/component';
  // @ts-ignore
  import hbs from 'ember-cli-htmlbars-inline-precompile';

  const template = hbs\`
    <div class="input {{this.type}}">
      <label>{{yield}}</label>
      <input type={{this.type}} value={{this.value}}>
    </div>
  \`;

  interface IComponentArgs {
    type: string;
    value?: any;
  }

  class MyInputComponent extends GlimmerComponent<IComponentArgs> {
    type: string = 'text';
  };

  // @ts-ignore
  export default Ember._setComponentTemplate(template, MyInputComponent);
`;
const expectedResultOne = `





    <div class="input {{this.type}}">
      <label>{{yield}}</label>
      <input type={{this.type}} value={{this.value}}>
    </div>
`;
const tagOne = 'hbs';

test('with one tagged template literals', () => {
  expect(searchAndExtract(documentContentOne, tagOne)).toBe(expectedResultOne);
});

const documentContentTwo = `
  import GlimmerComponent from '@glimmer/component';
  // @ts-ignore
  import hbs from 'ember-cli-htmlbars-inline-precompile';

  const template = hbs\`
    <div class="input {{this.type}}">
      <label>{{yield}}</label>
      <input type={{this.type}} value={{this.value}}>
    </div>
  \`;

  const myButtonTemplate = handlebars\`<button type="button">{{yield}}</button>\`;
  const myYieledTemplate = hbs\`{{yield}}\`;
  interface IComponentArgs {
    type: string;
    value?: any;
  }

  class MyInputComponent extends GlimmerComponent<IComponentArgs> {
    type: string = 'text';
    layout = dotted.string\`This is just an example with **dotted.string** as a tag name and **escaped backtick** char \\\` inside the literal template\`;
  };

  // @ts-ignore
  export default Ember._setComponentTemplate(template, MyInputComponent);
`;
const expectedResultTwo = `





    <div class="input {{this.type}}">
      <label>{{yield}}</label>
      <input type={{this.type}} value={{this.value}}>
    </div>


                                      <button type="button">{{yield}}</button>
                               {{yield}}







                           This is just an example with **dotted.string** as a tag name and **escaped backtick** char \\\` inside the literal template`;
const tagTwo = 'hbs|handlebars|dotted.string';

test('with more than one tagged template literals and `hbs`, `handlebars`, `dotted.string` as a tag name', () => {
  expect(searchAndExtract(documentContentTwo, tagTwo)).toBe(expectedResultTwo);
});