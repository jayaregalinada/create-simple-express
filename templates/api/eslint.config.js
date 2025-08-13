import globals from 'globals';
import pluginJs from '@eslint/js';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    languageOptions: { globals: globals.node },
  },
  pluginJs.configs.recommended,
  sonarjs.configs.recommended,
];
