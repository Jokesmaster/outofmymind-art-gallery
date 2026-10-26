# Ray Aponte — Dark Artist Gallery (Fresh Starter)

A complete, clean-slate dark artist gallery with ten locally bundled photos supplied for Ray Aponte's class website and a private artist dashboard. Built for the Web Systems group project using **plain HTML, CSS, JavaScript, GitHub Pages, and Supabase**.

**Important:** This is a starter project, not a fully deployed live site. In **demo mode**, the gallery displays the ten artwork photos supplied for the class project; their temporary Study 01–10 labels, categories, and descriptions are not artist-approved catalog information. Real login, image uploads, prices, drafts, and publishing require a configured Supabase project and an approved artist account. No payments or checkout are implemented.

## Included files

| File | Purpose |
| --- | --- |
| `index.html` | Public gallery homepage, artist info, contact, artwork details dialog |
| `site.css` | Full dark styling for the public gallery |
| `style.css` | Shared styling relied on by the admin dashboard |
| `admin-dark.css` | Dark styling overrides for the admin dashboard |
| `assets/artwork/` | Ten images, each in display and smaller thumbnail WebP versions |
| `app.js` | Public gallery loading, demo previews, category filters, details |
| `admin.html` | Private artist sign-in and artwork management interface |
| `admin.js` | Login, uploads, add/edit/delete, availability, price, draft/publish |
| `config.js` | Your **public** Supabase URL/key and approved contact details |
| `supabase-setup.sql` | Database, security policies, and image storage setup |
| `.nojekyll` | Helps GitHub Pages serve the site as static files |


## Start from scratch — no old files needed

1. Extract the ZIP into a folder named `ray-aponte-gallery`.
2. Open `index.html` in a browser, or serve the folder from VS Code **Live Server**. The public gallery displays the ten included example entries immediately, with no accounts or server required.
3. Open `admin.html` to view the artist studio setup screen. Editing and login become available only after connecting Supabase following section 2.
4. To upload to GitHub, create a new empty repository. Upload **the contents of this extracted folder** (all root HTML/CSS/JS/SQL files plus the `assets` directory), not the ZIP itself. Enable GitHub Pages once the site is ready.

**Do not combine this package with the previous light starter.** The necessary CSS, JavaScript, artwork, and SQL are all included. You do not have to paste any earlier code into it.

## 1. Preview locally right now

Open `index.html` in Chrome (or launch the folder through VS Code Live Server). The ten entries display the supplied artwork photos; their titles, categories, and descriptions remain **provisional**, pending Ray's review. Browse the categories, open the artwork detail dialogs, and check the responsive layout.

Click **ARTIST LOGIN** in the footer to view `admin.html`. Before Supabase setup, it clearly explains why login is not yet active.

## 2. Set up Supabase (one time)

1. Visit [Supabase](https://supabase.com/) and create a project belonging to whoever will maintain the gallery. Use a unique database password and keep it private.
2. In your project's **SQL Editor**, paste and run all of `supabase-setup.sql` **once**. This creates the `artworks` table, `artist_admins` allowlist, public-image storage bucket, and row-level security (RLS) policies.
3. In **Authentication → Users**, use the dashboard to create or invite an account for Ray using **his own email address**. He chooses/receives his password through the Auth workflow; **never commit his password or share it with the class**. The person who manages Supabase should retain administrative access. If your chosen dashboard flow requires email confirmation, complete that step before testing sign-in.
4. Copy the new user's UUID from the Authentication Users table. Back in the SQL Editor, run the following, replacing the example UUID:

   ```sql
   insert into public.artist_admins (user_id)
   values ('PASTE_RAYS_REAL_AUTH_USER_UUID_HERE');
   ```

5. If you want classmates to test uploads, give each one a **separate** authenticated account and add each UUID to the allowlist via the same SQL. Don't use Ray's login for the whole team. Remove temporary team members' allowlist entries after handing off.
6. Since visitors shouldn't create dashboard accounts, disable public sign-ups in the Supabase Authentication settings where available. The site does not provide public sign-up regardless.
7. Open **Project Settings → API** (or the project's Connect/API Keys section). Copy the **Project URL** and the **publishable/anon key** into `config.js`:

   ```js
   window.RAY_CONFIG = {
     SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
     SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_YOUR_PUBLIC_KEY',
     CONTACT_EMAIL: '',
     INSTAGRAM_URL: ''
   };
   ```

8. **Never use a service-role or secret key in `config.js`.** A browser publishable/anon key is expected to be visible; database and storage RLS rules protect editing. Don't weaken or turn off RLS.
9. Visit `admin.html`. Sign in as an approved user, add a title, upload a JPG/PNG/WebP image (up to 8 MB), describe it using the accessibility field, and check **Publish this artwork**. After saving, reload the gallery in `index.html` to see the piece.

### Drafts, prices, and sold artwork

- Leave **Publish** unchecked to save a private draft; the public gallery hides it.
- Leave **Price** blank to show `Price on request`, or enter a dollar amount.
- Change **Availability** to `Sold` or `Not for sale` to update the public label.
- To replace a photograph, edit the entry and choose a new file; otherwise its current photo remains.
- Deleting artwork permanently removes its database row and requests removal of the uploaded image.
- Visitors can filter artwork, open details, and start an inquiry. **There is no shopping cart, payment processor, or checkout** in this version.

**Storage privacy:** The `art-images` bucket is public because published artwork needs public image URLs. Uploads and deletions require an approved account, but **anyone with a public image URL may view that image**, including an image attached to a draft. Don't use this bucket for private/sensitive content or unpublished images that must be confidential.

## 3. Add artist-approved content

Ask Ray for: (a) his preferred artwork photos and titles; (b) the proper medium, dimensions, year, description, price, and sold status; (c) his artist statement and optionally an artist photo; (d) permission to publish his preferred email and Instagram handle.

- Replace the **About Ray** placeholder in `index.html` with his actual words and approved photograph.
- Fill `CONTACT_EMAIL` and/or `INSTAGRAM_URL` in `config.js` only when he approves displaying them publicly.
- Confirm with Ray that the supplied images can be published, especially the winged-creature drawing used in the homepage hero and the red/orange painting in the feature section.
- Add useful alt text to every artwork photo so screen-reader users have a description beyond the title.

## 4. Publish with GitHub Pages

1. Create a GitHub repository for your group (e.g. `ray-aponte-gallery`). Decide who owns it and grant appropriate collaborator access. Note: GitHub Free Pages generally requires a public repository for publication; you can collaborate privately while developing and deploy when ready.
2. Put these files in the repository root. For a typical class project, keep separate Git branches for each teammate and review changes before merging.
3. In the GitHub repository open **Settings → Pages**, select **Deploy from a branch**, choose your main branch and `/ (root)`, and save.
4. The gallery should appear at `https://YOUR-USERNAME.github.io/ray-aponte-gallery/` and the private dashboard at the same URL with `admin.html` appended.
5. GitHub Pages hosts **static files**. The dynamic editing capabilities live in Supabase and must be configured and maintained separately.
6. Test the public URL on mobile and desktop; check links, images, sign-in, upload permissions, publishing, category filters, and sign-out.

The `.nojekyll` file is included because no Jekyll build is needed. GitHub Pages and Supabase both require an internet connection for the live features.

## 5. Suggested team responsibilities

- **Teammate 1 — Visual design / front end:** refine `index.html` and `site.css`, replace provisional text with approved artwork details.
- **Teammate 2 — Public gallery JavaScript:** maintain `app.js`, filters, artwork details, loading/error states.
- **Teammate 3 — Dashboard / database:** set up Supabase, manage `admin.js` and `supabase-setup.sql`, test RLS.
- **You — Client coordination and integration:** collect requirements/approved content from Ray, review pull requests, test releases and report progress.

Keep a brief changelog and retain screenshots of requirements, design stages, testing, and the finished working site for class submissions.

## Testing / security checklist before real launch

- [ ] Artist confirms content and contact permissions.
- [ ] Only allowlisted users can sign in to the dashboard (test an unapproved account).
- [ ] Anonymous visitors cannot insert/update/delete `artworks` rows or upload images.
- [ ] Draft artwork isn't displayed in the public gallery.
- [ ] Draft artwork images aren't treated as confidential (public bucket limitation).
- [ ] Published image, title, description, price, and sold label all work.
- [ ] Upload rejects unsupported image types and files over 8 MB.
- [ ] Keyboard navigation, filter labels, dialog close, image descriptions and mobile layout work.
- [ ] No secret/service-role keys or passwords appear anywhere in the repository.
- [ ] GitHub Pages URL opens correctly and Supabase policies remain enabled.

## A few design decisions

- No React, bundler, local server backend, or payment provider required, so the code is approachable for a web programming group.
- Public pages query only published rows; authorized accounts can see draft rows.
- The dashboard URL is not secret. Security comes from Supabase Authentication + row-level security policies, not from hiding the link.
- Contact details were intentionally left empty pending artist approval.

Useful references: [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Supabase JavaScript documentation](https://supabase.com/docs/reference/javascript/initializing), [Supabase Storage security](https://supabase.com/docs/guides/storage/security/access-control).
