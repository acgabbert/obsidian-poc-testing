# My Obsidian Proof of Concept Testing Plugin

This is a testing plugin for Obsidian (https://obsidian.md).

The code was derived from the Obsidian Sample Plugin (https://github.com/obsidianmd/obsidian-sample-plugin).

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## API Documentation

See https://github.com/obsidianmd/obsidian-api

## Ideas for Later On
- Leverage [Obsidian's URI protocol](https://help.obsidian.md/Extending+Obsidian/Obsidian+URI) via Chrome to take actions
  - Search Vault: `obsidian://search?vault=my_vault&query=%s`
  - Create a note: `obsidian://new?vault=my_vault&silent=true&name=%s`
  - Save a link to a note: `obsidian://new?vault=my_vault&silent=true&name=Links&append=true&content=%s%0D%0A`
  - Save a to-do to a note: `obsidian://new?vault=my_vault&silent=true&name=TODOs&append=true&content=-%20[%20]%20%s%0D%0A`

NOTE: allow Chrome to open Obsidian without asking by running the following command:
```
defaults write com.google.Chrome URLAllowlist -array 'obsidian://*'
```

