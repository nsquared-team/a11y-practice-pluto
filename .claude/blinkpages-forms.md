<!-- GENERATED — do not edit. Source of truth: managed-skills/FORMS.md (blinkpages-platform).
     Overwritten on every platform sync; your own notes belong in CLAUDE.md. -->

# Forms on a BlinkPages site — BlinkForms by default

This site has **BlinkForms** built in: native forms that the platform receives, records, emails and
forwards. The owner's agent reads this file before writing or changing **any** form. The short version of
the rule is in [`blinkpages.md`](blinkpages.md); this is the whole of it.

## Which kind of form to build

**Default: a BlinkForm.** A request for a contact form, a quote or enquiry form, a signup, an application,
a "get in touch" or "request a call" box, or any form the owner doesn't tie to another product, is a
BlinkForm. Don't ask which kind they want. Just build it, using the recipe below.

- **Never hand-write a form handler.** Don't add a route in `src/blink-routes.js`, a mail-sending
  endpoint, a `mailto:` form, or a third-party form service the owner didn't name. A BlinkForm already
  records every submission, emails it and shows it in the site console, with spam protection.
- **An existing form that posts to `/api/contact` or `/api/newsletter`** becomes a BlinkForm by adding
  `src/forms/contact.json` (or `newsletter.json`). Its markup keeps working as it is
  ([The definition](#the-definition--srcformsslugjson)).

**Keep the vendor's form** when the owner is clearly talking about one:

- they name the product: HubSpot, GoHighLevel / HighLevel / LeadConnector, Mailchimp, Kit (ConvertKit),
  Flodesk, beehiiv, Klaviyo, Typeform, Jotform, Google Forms, Calendly or another booking tool, a
  payment or donation form, a chat widget;
- or they paste the vendor's embed code.

Then use that vendor's **official embed** for the owner's own account and form, styled as far as the
vendor allows. Never rebuild a vendor's form by copying how it posts, and never post to a vendor from
the page with a key: anything in page code is public. Booking, payment and chat widgets always stay
embeds.

### When the owner wants an embedded form restyled

Do what the vendor's own styling options allow first (theme settings, the CSS hooks the vendor
documents). An embed usually can't fully match the site: an iframe can't be styled from outside at
all, and a script-rendered form brings its own markup. When the request goes past that (*"make the
HubSpot form match our fonts"*, *"can the signup look like the rest of the page?"*), **offer the native
rebuild in one plain sentence**, in the owner's words:

> *"Your HubSpot form can only be styled so far. I can rebuild it as a native form that matches your
> site exactly and still sends every lead straight into HubSpot. Want me to do that?"*

Follow their answer. If they say yes, build the BlinkForm below and connect it to their CRM
([Sending each submission to a CRM](#sending-each-submission-to-a-crm)). Before you replace the
embed, tell them what changes:
- Leads now also appear in the site console.
- The CRM record arrives a moment after the visitor submits, not from the visitor's browser.
- **HubSpot**: the contact keeps its page-visit history only if the page passes HubSpot's `hubspotutk`
  cookie along (the handler example below does). That works only where the HubSpot tracking code is on
  the site.
- Any workflow in the CRM that triggers on the *vendor form* being submitted still fires, but only when
  the handler submits to that same form, as the HubSpot example does. A handler that creates the contact
  directly does not fire it.

## Building a BlinkForm

Every BlinkForm has two parts: **a definition file** (what the fields are, who is emailed, what the
visitor sees afterwards) and **the form's markup** on the page. A new form is a change like any other,
so it ships as a draft with a preview link.

### Reuse what the site already has

Before writing markup, look for an existing form on the site: `src/forms/*.json`, `data-blink-form` in
`src/`, a form component in `src/components/`, or a form script in `public/`. Copy its markup and
script, and its look. Build the fields from the site's design system (`DESIGN.md`, `tokens.css`, the
existing input and button components), like any other section. Use real `<label>`s, the right `type`
and `autocomplete` on each input, `required` where the definition says `isRequired`, and a visible focus
state.

### The definition — `src/forms/<slug>.json`

The file name is the form's id and its address: `src/forms/contact.json` takes posts at
`/api/forms/contact`. Committing the file is what switches the form on. The format is a Gravity Forms
form object, plus a `blink` block. A complete minimal contact form:

```json
{
  "blink": { "v": 1, "id": "contact", "honeypot": "website", "adminEmail": "owner@example.com" },
  "title": "Contact",
  "fields": [
    { "id": 1, "type": "text", "label": "Name", "isRequired": true, "inputName": "name" },
    { "id": 2, "type": "email", "label": "Email", "isRequired": true, "inputName": "email" },
    { "id": 3, "type": "phone", "label": "Phone", "inputName": "phone" },
    { "id": 4, "type": "textarea", "label": "Message", "isRequired": true, "inputName": "message", "maxLength": 5000 }
  ],
  "notifications": [
    { "id": "admin", "name": "Admin Notification", "isActive": true, "event": "form_submission",
      "toType": "email", "to": "{admin_email}", "replyTo": "{Email:2}",
      "subject": "New message from {Name:1}", "message": "{all_fields}\n\nView it in the site console: {entry_url}" }
  ],
  "confirmations": [
    { "id": "default", "name": "Default Confirmation", "isDefault": true, "type": "message",
      "message": "Thanks — we'll be in touch soon." }
  ],
  "feeds": []
}
```

- **`blink.id`** must equal the file name. **`honeypot`** names the hidden trap input: `"website"` for
  `contact` and `newsletter`, `"_hp"` for any other form.
- **Field types**: `text`, `email`, `phone`, `textarea`, `select`, `radio`, `checkbox`, `number`,
  `date`, `name` (First/Last as inputs `1.3` and `1.6`), `hidden`. `select`, `radio` and `checkbox`
  take `"choices": [{ "text": "Sales", "value": "sales" }]`.
- **Who is emailed.** `{admin_email}` is `blink.adminEmail`, or else the `to` address in
  `config/email.yml`. Use the owner's address if you know it (`config/email.yml`, `reference/`, the
  site's contact page). Ask only when you can't find it, because a form that emails nobody still loses
  leads. Change who receives a form's email, or where its data is sent, **only when the owner asked**,
  and say so in the commit message.
- **What the visitor sees**: a `"message"` confirmation, or `"type": "redirect"` with `"url":
  "/thank-you/"` (a page on this site; useful for conversion tracking).
- **Routing** (sales vs support to different inboxes), conditional logic and merge tags follow Gravity
  Forms exactly. A mistake in the file never breaks the build: the bad part is dropped and the site
  console shows a warning.

**`config/email.yml`** sets the site-wide sender and default recipient. Add it if it's missing:

```yaml
from: "forms@blinkpages.ai"        # the shared verified sender — keep it unless the team set up another
to: "owner@example.com"            # the default recipient ({admin_email})
subjectPrefix: "[example.com]"     # optional
```

It is flat `key: value` only, and it is read at deploy time. Email also needs the site to be connected
to BlinkPages' mail service. Until it is, every submission is still recorded in the console, but the
email shows **"not configured"**. If the console says that, ask the BlinkPages team to switch on form
email for the site.

### The markup

Post to `/api/forms/<slug>` with each input named by the field's `inputName` (or `input_<id>`, and
`input_<id>.<n>` for one part of a name or checkbox field). Put the honeypot inside the form. A
`fetch()` gets back JSON; a plain browser post (no JavaScript) gets the confirmation page or redirect,
so the form works either way:

```astro
<form method="post" action="/api/forms/contact" data-blink-form="contact" class="contact-form">
  <label>Name <input name="name" required autocomplete="name" /></label>
  <label>Email <input name="email" type="email" required autocomplete="email" /></label>
  <label>Phone <input name="phone" type="tel" autocomplete="tel" /></label>
  <label>Message <textarea name="message" required></textarea></label>
  <input name="website" tabindex="-1" autocomplete="off" hidden aria-hidden="true" />
  <button type="submit">Send</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>

<script>
  for (const form of document.querySelectorAll<HTMLFormElement>("form[data-blink-form]")) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      const button = form.querySelector<HTMLButtonElement>("[type=submit]");
      if (button) button.disabled = true;
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) throw new Error(String(res.status));
        const c = body.confirmation || {};
        if (c.type === "redirect" && c.url) return location.assign(c.url);
        form.reset();
        if (status) status.innerHTML = c.message || "Thanks — we got your message.";
      } catch {
        if (status) status.textContent = "Sorry, that didn't send. Please try again, or email us directly.";
      } finally {
        if (button) button.disabled = false;
      }
    });
  }
</script>
```

If the site already has a form script or component, use that instead of adding this one: two scripts on
one form both send it.

### Testing on the preview

A submission made on the **preview** is recorded but sends nothing: no email, no webhook, no CRM call.
The owner can see it in the site console under **Forms → the form → Entries**, with *Include test
submissions from previews* ticked. Tell the owner that, so a quiet inbox doesn't worry them. Emails
and CRM sync start once the draft is published.

## Sending each submission to a CRM

There are two ways. **Use the first one if the CRM supports it.**

### 1. The CRM gives you a URL to send leads to → a webhook (no code)

Zapier and Make catch hooks, n8n, a GoHighLevel workflow's **Inbound Webhook** trigger, and most CRMs'
"incoming webhook" features each give the owner a URL. Every submission can be posted there with all of
its answers under readable names. The easiest path is for the owner to add it in the site console:
**Forms → the form → Settings → Webhooks → Add new**, then paste the URL. Or you add the feed to the
definition:

```json
"feeds": [
  { "id": 1, "addon_slug": "gravityformswebhooks", "is_active": true, "feed_order": 0,
    "meta": { "feedName": "Send to GoHighLevel", "requestMethod": "POST", "requestFormat": "json",
              "requestBodyType": "all_fields" },
    "blink": { "requestURLSecret": "FEED_GHL_LEADS" } }
]
```

Prefer `requestURLSecret` (a URL kept as a secret, named `FEED_…`) over pasting the URL into the file,
because a lead-intake URL in a public repository lets anyone post fake leads. Secrets are set by the
**BlinkPages team**: ask them to store the URL under that exact name. Never put the URL, or any key, in
a commit, an issue or a pull request.

### 2. The CRM needs code (a login, a field mapping) → a custom-code handler

The **snippet that runs on every BlinkForm submission** is a function your site exports from
`src/blink-routes.js` as `formHandlers.<name>`. A `code` feed on the form names it. It runs on the
server after the submission is recorded, so a key it uses never reaches the visitor's browser. It gets
the answers as `submission.data` under readable keys (`{ name, email, phone, message, … }`, plus any
extra inputs the page posted), and `submission.replyTo`, `submission.form` and `submission.entry`
(`page`, `createdAt`).

```js
// src/blink-routes.js
export const formHandlers = {
  // Submits each lead to the owner's existing HubSpot form, so HubSpot's own
  // notifications, lists and workflows for that form keep working.
  hubspot: async (submission, env) => {
    const d = submission.data;
    const [firstname, ...rest] = String(d.name || "").trim().split(/\s+/);
    const res = await fetch(
      // portalId and formGuid are the two ids in the owner's HubSpot embed code.
      "https://api.hsforms.com/submissions/v3/integration/submit/PORTAL_ID/FORM_GUID",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: [
            { objectTypeId: "0-1", name: "email", value: d.email },
            { objectTypeId: "0-1", name: "firstname", value: firstname || "" },
            { objectTypeId: "0-1", name: "lastname", value: rest.join(" ") },
            { objectTypeId: "0-1", name: "phone", value: d.phone || "" },
            { objectTypeId: "0-1", name: "message", value: d.message || "" },
          ],
          context: { hutk: d.hutk || undefined, pageUri: submission.entry.page || undefined },
        }),
      },
    );
    if (!res.ok) return { ok: false, error: `HubSpot answered ${res.status}` };
  },
};
```

```json
"feeds": [
  { "id": 2, "addon_slug": "code", "is_active": true, "feed_order": 0,
    "meta": { "feedName": "Send to HubSpot", "handler": "hubspot" } }
]
```

For the HubSpot visit history (`hutk` above), add `<input type="hidden" name="hutk" />` to the form, and
in the form's script fill it from the `hubspotutk` cookie before sending.

**Credentials.** A CRM that needs a key (HubSpot's contacts API, Pipedrive, Salesforce, a GoHighLevel
API key, …) reads it from `env` in the handler, never from the code:
- **If the CRM is one of the owner's BlinkMetrics connections, use a Gatekeeper key**: send the CRM's own
  request to `https://gatekeeper.blinkmetrics.com` with `env["<secret_name>"]` as the bearer token
  (see *Gatekeeper* in [`blinkpages.md`](blinkpages.md)). The CRM's real credential then never leaves
  BlinkMetrics, and the owner can see and revoke every call the site makes.
- Otherwise use the CRM's own token, stored by the BlinkPages team as a secret on the site
  (`HUBSPOT_TOKEN`, say).

**Before it can run, the BlinkPages team switches site code on for this site** (and stores any secret
the handler reads). Write the handler and the feed in the draft, then ask the team for both in one
message, naming each secret exactly. Until then the console shows the integration as *Won't run*, with
the reason. Leads are still recorded and emailed in the meantime.

**Rules for a handler:**
- Return `{ ok: false, error: "…" }` (or throw) when the CRM refuses. The message is shown to the owner,
  so never put a key or the CRM's raw response in it.
- Work within 10 seconds. There are no retries, so create the record in one call where you can.
- It never runs on a preview, only on the live site. Test the CRM side after publishing, with one real
  submission, and check its Delivery card in the console.
