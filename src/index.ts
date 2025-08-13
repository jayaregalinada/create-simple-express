import * as prompts from '@clack/prompts';
import mri from 'mri';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import colors from 'picocolors';

type TemplateType = 'api' | 'basic';

type Argv = {
  template?: TemplateType;
  help?: boolean;
  overwrite?: boolean;
};

type PkgInfo = {
  name: string;
  version: string;
};

const { green, yellow } = colors;

type Color = (color: string | number) => string;

type Template = {
  type: TemplateType;
  label: string;
  color: Color;
};

const TEMPLATES: Template[] = [
  {
    type: 'basic',
    label: 'Great for absolute beginners',
    color: green,
  },
  {
    type: 'api',
    label: 'For building real-world APIs',
    color: yellow,
  },
];

const TEMPLATE_TYPES: TemplateType[] = TEMPLATES.map(
  (template) => template.type
);

const argv = mri<Argv>(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'template',
  },
  boolean: ['help', 'overwrite'],
  string: ['template'],
});
const cwd = process.cwd();

const helpMessage = `
Usage: create-simple-express [OPTION] [DIRECTORY]

Create a new Express API project.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME       use a specific template

Available templates:
${green('basic')}
${yellow('api')}
`;

function formatTargetDirectory(directory: string) {
  return directory.trim().replace(/\/+$/g, '');
}

const DEFAULT_TARGET_DIRECTORY = 'express-app';

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
  _prettierrc: '.prettierrc',
  _gitattributes: '.gitattributes',
  _env_example: '.env.example',
};

async function init() {
  const argvTargetDirectory = argv._[0]
    ? formatTargetDirectory(String(argv._[0]))
    : undefined;
  const argvTemplate = argv.template;
  const argvOverwrite = argv.overwrite;

  const help = argv.help;
  if (help) {
    console.log(helpMessage);
    return;
  }

  const cancel = () => prompts.cancel('Operation cancelled');

  let targetDirectory = argvTargetDirectory;

  if (!targetDirectory) {
    const projectName = await prompts.text({
      message: 'Project name:',
      defaultValue: DEFAULT_TARGET_DIRECTORY,
      placeholder: DEFAULT_TARGET_DIRECTORY,
      validate: (value: string) => {
        return value.length === 0 || formatTargetDirectory(value).length > 0
          ? undefined
          : 'Invalid project name';
      },
    });
    if (prompts.isCancel(projectName)) {
      return cancel();
    }

    targetDirectory = formatTargetDirectory(projectName);
  }

  if (fs.existsSync(targetDirectory) && !isEmpty(targetDirectory)) {
    const overwrite = argvOverwrite
      ? 'yes'
      : await prompts.select({
          message:
            (targetDirectory === '.'
              ? 'Current directory'
              : `Target directory "${targetDirectory}"`) +
            ` is not empty. Please choose how to proceed:`,
          options: [
            {
              label: 'Cancel operation',
              value: 'no',
            },
            {
              label: 'Remove existing files and continue',
              value: 'yes',
            },
            {
              label: 'Ignore files and continue',
              value: 'ignore',
            },
          ],
        });

    if (prompts.isCancel(overwrite)) {
      return cancel();
    }

    switch (overwrite) {
      case 'yes':
        emptyDir(targetDirectory);
        break;

      case 'no':
        cancel();
        return;
    }
  }

  let packageName = path.basename(path.resolve(targetDirectory));
  if (!isValidPackageName(packageName)) {
    const packageNameResult = await prompts.text({
      message: 'Package name:',
      defaultValue: toValidPackageName(packageName),
      placeholder: toValidPackageName(packageName),
      validate(directory) {
        if (!isValidPackageName(directory)) {
          return 'Invalid package.json name';
        }
      },
    });

    if (prompts.isCancel(packageNameResult)) {
      return cancel();
    }

    packageName = packageNameResult;
  }

  let template = argvTemplate;
  let hasInvalidTemplate = false;
  if (argvTemplate && !TEMPLATE_TYPES.includes(argvTemplate)) {
    template = undefined;
    hasInvalidTemplate = true;
  }

  if (!template) {
    const selectedTemplate = await prompts.select({
      message: hasInvalidTemplate
        ? `"${argvTemplate}" isn't a valid template. Please choose from below: `
        : 'Select a template:',
      options: TEMPLATES.map(({ color, label, type }) => ({
        label: color(label),
        value: type,
      })),
    });

    if (prompts.isCancel(selectedTemplate)) {
      return cancel();
    }

    template = selectedTemplate;
  }

  const root = path.join(cwd, targetDirectory);
  fs.mkdirSync(root, { recursive: true });

  prompts.log.step(`Scaffolding project in ${root}...`);

  const templateDirectory = path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
    `templates/${template}`
  );

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDirectory, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDirectory);
  const filterFiles = files.filter((file: string) => file !== 'package.json');
  for (const file of filterFiles) {
    if (file.includes('.template')) {
      const content = fs.readFileSync(path.join(templateDirectory, file));
      const replacedContent = content.replaceAll('{{name}}', packageName);
      write(file.replace('.template', ''), replacedContent);
      continue;
    }

    write(file);
  }

  const packageJsonFile = fs.readFileSync(
    path.join(templateDirectory, `package.json`),
    'utf-8'
  );
  const packageJson = JSON.parse(
    packageJsonFile.replaceAll('{{name}}', packageName)
  );

  packageJson.name = packageName;

  write('package.json', JSON.stringify(packageJson, null, 2) + '\n');

  let doneMessage = '';
  const cdProjectName = path.relative(cwd, root);
  doneMessage += `Done. Now run:\n`;
  if (root !== cwd) {
    doneMessage += `\n  cd ${
      cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
    }`;
  }

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  switch (pkgManager) {
    case 'yarn':
      doneMessage += '\n  yarn';
      doneMessage += '\n  yarn dev';
      break;
    default:
      doneMessage += `\n  ${pkgManager} install`;
      doneMessage += `\n  ${pkgManager} run dev`;
      break;
  }
  prompts.outro(doneMessage);
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path);

  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName
  );
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function pkgFromUserAgent(userAgent: string | undefined): PkgInfo | undefined {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

init().catch((error) => {
  console.error(error);
});
