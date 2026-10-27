# Ray Aponte — Artist Gallery Website - **Note** --------> This READ.ME has pretty much the full layout of steps for our project but we should for sure do some planning soon!!!!!!! -EP

This repository contains our Web Systems group project: a dark-themed portfolio and art gallery for Ray Aponte. The website includes a public gallery and an artist dashboard that will allow Ray to manage his artwork once we finish setting up Supabase.

We are using **HTML, CSS, JavaScript, GitHub Pages, and Supabase**. The project includes ten photographs of Ray's artwork in both full-size and thumbnail formats.

**Current project status:** The public gallery works in demo mode, but the live site and artist dashboard are not fully set up yet. The sample entries use temporary titles (`Study 01` through `Study 10`), categories, and descriptions. We need to review those details with Ray before treating them as final. Login, uploads, prices, drafts, and publishing require a configured Supabase project and an approved artist account. We are not including online payments or checkout in this version.

## Project files

| File | What it's used for |
| --- | --- |
| `index.html` | Public homepage, gallery, artist information, contact section, and artwork details popup |
| `site.css` | Dark theme and layout for the public website |
| `style.css` | Shared styling used by the artist dashboard |
| `admin-dark.css` | Additional dark styling for the artist dashboard |
| `assets/artwork/` | Ten artwork images, each with a display-size and smaller thumbnail WebP file |
| `app.js` | Public gallery loading, demo entries, category filters, and artwork details |
| `admin.html` | Artist sign-in page and artwork management interface |
| `admin.js` | Login, image uploads, adding/editing/deleting artwork, availability, prices, drafts, and publishing |
| `config.js` | Public Supabase project URL and key, plus artist-approved contact information |
| `supabase-setup.sql` | Database tables, security policies, and image storage configuration |
| `.nojekyll` | Tells GitHub Pages to serve the static site without a Jekyll build |

## Getting started with the project

1. Extract the project ZIP into a folder called `ray-aponte-gallery`.
2. Open `index.html` in a browser or run the folder using **Live Server** in VS Code. The public gallery should immediately display the ten sample artwork entries; no login or backend setup is needed to preview it.
3. Open `admin.html` to see the artist dashboard setup screen. Login and editing will not work until we connect Supabase in Section 2.
4. When setting up the GitHub repository, create an empty repository and upload **everything inside the extracted folder**, including the root HTML, CSS, JavaScript, and SQL files and the `assets` directory. Do not upload only the ZIP. We can enable GitHub Pages when the site is ready to publish.

This folder is our **new starting point**. It already contains the CSS, JavaScript, artwork, and SQL files we need, so there is no reason to copy files or code from the earlier light-themed version into this project.

## 1. Preview the website locally

Start by opening `index.html` in Chrome or using VS Code Live Server. The page should display all ten artwork photographs. Their titles, categories, and descriptions are placeholders until Ray confirms the final information.

While reviewing the public site, test the category filters, open a few artwork detail popups, and resize the browser to check the responsive layout.

The **ARTIST LOGIN** link in the footer opens `admin.html`. Until Supabase has been configured, that page explains why sign-in is not available yet.

## 2. Connect Supabase (one-time setup)

Supabase will handle artist accounts, artwork records, and uploaded images. Whoever takes responsibility for the backend should complete the following steps and coordinate access with the rest of the group.

1. Go to [Supabase](https://supabase.com/) and create a project under the account of whoever will maintain the gallery long-term. Choose a unique database password and keep it private.
2. Open the project's **SQL Editor**. Copy the entire contents of `supabase-setup.sql` into it and run the script **once**. This creates the `artworks` table, the `artist_admins` list of approved users, a public image storage bucket, and the row-level security (RLS) policies.
3. Go to **Authentication → Users** and use the Supabase dashboard to create or invite Ray's account with **his own email address**. Ray should set or receive his password through the authentication process. **Do not put his password in GitHub or share it with the group.** The person managing Supabase should also keep administrative access. If Supabase asks for email confirmation, complete that before testing the login.
4. Copy Ray's user UUID from **Authentication → Users**. Return to the SQL Editor and run the following command, replacing the placeholder with his actual UUID:

   ```sql
   insert into public.artist_admins (user_id)
   values ('PASTE_RAYS_REAL_AUTH_USER_UUID_HERE');
   ```

5. If other group members need to test uploads, create **individual accounts** for them and add their UUIDs to `artist_admins` using the same SQL command. Everyone should use their own login rather than sharing Ray's. Remove any temporary team accounts from the approved list when we hand the site over.
6. In the Supabase Authentication settings, disable public sign-ups where that option is available. Visitors should not be able to create their own dashboard accounts. The website itself does not include a public sign-up form.
7. Open **Project Settings → API**, or the equivalent **Connect / API Keys** section. Find the **Project URL** and the **publishable/anon key**, then update `config.js` with those values:

   ```javascript
   window.RAY_CONFIG = {
     SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
     SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_YOUR_PUBLIC_KEY',
     CONTACT_EMAIL: '',
     INSTAGRAM_URL: ''
   };
   ```

8. **Do not put a service-role key, secret key, or password in `config.js`.** The browser's publishable/anon key is allowed to be visible publicly. Supabase's database and storage RLS policies are what prevent unauthorized editing, so leave those policies enabled.
9. Test the setup at `admin.html` using an approved account. Add a title, upload a JPG, PNG, or WebP image **no larger than 8 MB**, complete the accessibility description field, and select **Publish this artwork**. Save it, then reload `index.html` to make sure the new piece appears in the public gallery.

### Managing drafts, prices, and availability

Once the dashboard is connected, Ray will be able to update his work without editing the website's code.

- To save an entry without showing it publicly, leave **Publish** unchecked. This stores it as a draft that the public gallery does not display.
- Leave **Price** empty if the artwork should say `Price on request`, or enter an amount in dollars to display a price.
- Change **Availability** to `Sold` or `Not for sale` when needed. The gallery label updates to match.
- To replace an artwork photograph, edit the existing entry and select a new image file. If no new file is selected, the current photograph remains.
- Deleting an artwork removes its database record permanently and requests deletion of its uploaded image.
- Visitors can filter the collection, read artwork details, and start an inquiry. **There is no shopping cart, payment processor, or checkout** in this version.

**Important note about image privacy:** The `art-images` storage bucket is public so that visitors can view published artwork. Only approved accounts can upload or delete files, but **anyone with a public image URL can view that file—even if the artwork entry is still a draft**. Do not upload sensitive content or an unpublished image that must remain confidential to this bucket.

## 3. Get the final artwork information from Ray

Before we publish the finished site, we need to confirm the content with Ray rather than relying on the temporary gallery entries. We should ask him for:

- His preferred artwork photographs and the correct titles.
- Each piece's medium, dimensions, year, description, price, and whether it has sold.
- An artist statement or short biography, and an artist photograph if he wants one included.
- Permission to display his preferred contact email and Instagram account publicly.

After getting his feedback, we should make these updates:

- Replace the placeholder text in the **About Ray** section of `index.html` with his own story and an approved photograph, if provided.
- Add his approved email address to `CONTACT_EMAIL` and/or his approved Instagram link to `INSTAGRAM_URL` in `config.js`. Do not publish those details until he agrees.
- Confirm that we have permission to publish the supplied artwork photographs, especially the winged-creature drawing used in the homepage hero and the red/orange painting in the feature section.
- Write useful **alt text** for every artwork photograph so screen-reader users can understand the image beyond its title.

## 4. Publish the site with GitHub Pages

1. Create a GitHub repository for the group, such as `ray-aponte-gallery`. Agree on who owns the repository and invite everyone with the appropriate collaborator access. **GitHub Free generally requires the repository to be public to publish with GitHub Pages.** We can keep it private while developing and make it public when we're ready to deploy.
2. Keep the website files in the **root of the repository**. Group members should work on separate Git branches where possible, then submit changes for review before merging into the main branch.
3. In the repository, go to **Settings → Pages**. Select **Deploy from a branch**, choose the main branch and `/ (root)`, then save.
4. The website should be available at `https://YOUR-USERNAME.github.io/ray-aponte-gallery/`. The artist dashboard uses the same address with `admin.html` added to the end.
5. Remember that GitHub Pages only serves **static website files**. Artist accounts, database records, uploads, and other editing features are handled through Supabase, which we must configure and maintain separately.
6. Once published, test the actual website link on both a phone and computer. Check navigation, image loading, artist sign-in, upload permissions, publishing, gallery filters, and sign-out.

The included `.nojekyll` file means GitHub Pages doesn't need to run a Jekyll build. The published GitHub Pages site and its connected Supabase features both require an internet connection.

## 5. Dividing up the group work

These are suggested areas of responsibility. We can adjust them based on what everyone wants to work on and what still needs to be finished.

- **Front-end design:** Work on `index.html` and `site.css`, improve the layout and styling, and update the temporary text once Ray approves the artwork details.
- **Gallery functionality:** Work on `app.js`, the artwork filters, detail views, and loading or error messages.
- **Artist dashboard and database:** Set up Supabase, work on `admin.js` and `supabase-setup.sql`, and test the row-level security rules.
- **Client communication and project integration:** Gather requirements and approved content from Ray, review pull requests, coordinate testing and releases, and keep track of project progress.

We should keep a short **changelog** as we make updates. Save screenshots showing the requirements, different design stages, testing, and the finished website so we have documentation for our class submissions.

## Testing and security checklist before launch

Before calling the website finished, we should go through this checklist together:

- [ ] Ray has approved the artwork content and any contact information being published.
- [ ] Only users on the approved list can access dashboard functionality; test with an unapproved account.
- [ ] Visitors who are not signed in cannot add, edit, or delete records in `artworks` or upload images.
- [ ] Draft artwork entries do not appear in the public gallery.
- [ ] Everyone working on the site understands that images in the public bucket are not confidential, even when attached to drafts.
- [ ] Published artwork shows the correct image, title, description, price, and sold/availability label.
- [ ] The upload form rejects unsupported image formats and files larger than 8 MB.
- [ ] Keyboard navigation, filter labels, closing artwork dialogs, image descriptions, and mobile layouts all work.
- [ ] No passwords, service-role keys, or secret keys have been committed to the repository.
- [ ] The GitHub Pages URL works and the Supabase security policies are still enabled.

## Project design and technical notes

- We are using plain HTML, CSS, and JavaScript rather than React or a bundler. No separate local server backend or payment service is required. This keeps the project manageable for our web programming group.
- The public gallery requests **published artwork only**. Approved accounts can also view saved draft entries in the dashboard.
- `admin.html` is a public URL, not a hidden or secret page. Access control comes from **Supabase Authentication and row-level security**, not from concealing the link.
- Contact fields are currently blank because we need Ray's approval before displaying that information.

### References

- [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Supabase JavaScript documentation](https://supabase.com/docs/reference/javascript/initializing)
- [Supabase Storage security](https://supabase.com/docs/guides/storage/security/access-control)
