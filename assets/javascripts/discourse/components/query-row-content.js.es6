

import { categoryLinkHTML } from 'discourse/helpers/category-link';
import { autoUpdatingRelativeAge } from 'discourse/lib/formatter';

function icon_or_image_replacement(str, ctx) {
  str = Ember.get(ctx.contexts[0], str);
  if (Ember.isEmpty(str)) { return ""; }

  if (str.indexOf('fa-') === 0) {
    return new Handlebars.SafeString("<i class='fa " + str + "'></i>");
  } else {
    return new Handlebars.SafeString("<img src='" + str + "'>");
  }
}

function category_badge_replacement(str, ctx) {
  const category = Ember.get(ctx.contexts[0], str);
  return categoryLinkHTML(category, {
    allowUncategorized: true,
  });
}

function bound_date_replacement(str, ctx) {
  const value = Ember.get(ctx.contexts[0], str);
  return new Handlebars.SafeString(autoUpdatingRelativeAge(new Date(value), {title: true }));
}

const esc = Handlebars.Utils.escapeExpression;

const QueryRowContentComponent = Ember.Component.extend({
  tagName: "tr",

  render: function(buffer) {
    const self = this;
    const row = this.get('row');
    const parent = self.get('parent');
    const fallback = parent.get('fallbackTemplate');
    const helpers = {
      "icon-or-image": icon_or_image_replacement,
      "category-link": category_badge_replacement,
      "reltime": bound_date_replacement,
    };

    const parts = this.get('columnTemplates').map(function(t, idx) {
      const value = row[idx],
        id = parseInt(value);

      const ctx = {value, id, baseuri: Discourse.BaseUri === '/' ? '' : Discourse.BaseUri };
      const params = {};

      if (row[idx] === null) {
        return "NULL";
      } else if (t.name === "text") {
        return esc(row[idx]);
      }

      const lookupFunc = parent[`lookup${t.name.capitalize()}`];
      if (lookupFunc) {
        ctx[t.name] = parent[`lookup${t.name.capitalize()}`](id);
      }

      if (t.name === "category" || t.name === "badge" || t.name === "reltime") {
        // only replace helpers if needed
        params.helpers = helpers;
      }

      try {
        return new Handlebars.SafeString((t.template || fallback)(ctx, params));
      } catch (e) {
        console.error(e);
        debugger;
        return "error";
      }
    });

    buffer.push("<td>" + parts.join("</td><td>") + "</td>");
  }
});

export default QueryRowContentComponent;
