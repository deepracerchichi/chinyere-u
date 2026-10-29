# Chinyere Ukpong | Portfolio

Personal portfolio built with React, GSAP and Tailwind CSS.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run lint
```

## Edit your content

Almost everything you'd want to change lives in one file: `src/constants/index.js`
(name, role, projects, experience, tools, articles, services, footer links).

- Project screenshots go in `public/projects/` and are referenced by the `image` field.
- Your CV is `public/ChinyereUkpong-CV.pdf`.

## Contact form (EmailJS)

Copy `.env.example` to `.env` and fill in the three `VITE_EMAILJS_*` values.
On Vercel, add the same three variables under Project Settings > Environment Variables.
Without them, the form falls back to opening the visitor's email app.

## Structure

```
src/
  App.jsx          page order, page-wide scroll motion
  components/      one file per section (Hero, Projects, About, ...)
  hooks/           useInView
  constants/       all of the site's content
  index.css        all styles
```
