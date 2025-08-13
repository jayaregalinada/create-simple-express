# Create Simple Express App

A simple CLI tool to scaffold [Express](https://expressjs.com) projects with minimal setup. Choose from predefined templates to quickly get started with your backend development.

## Getting Started

You can use `npx` to run the CLI directly without installing it globally:

```sh
npx create-simple-express@latest [-t template] [folder-name]
```

Just follow the prompts

- Replace `template` with the [🔗 Template](#template) you want to generate
- Replace `folder-name` with the desired name for your new project folder.

## Options

The CLI accepts additional flags to customize project generation

### Template

```sh
--template, -t <template-name>
```

Specify which template to use when creating your project.

#### Available Templates

- `basic` - Minimal Express setup (default)
- `api` REST API-ready template with structured routing and controllers

#### Example

```sh
npx create-simple-express@latest --template api my-folder
```

or using the shorthand:

```sh
npx create-simple-express@latest -t api my-folder
```

---

Created and maintained by [Jay Are Galinada](https://jayaregalinada.github.io)
