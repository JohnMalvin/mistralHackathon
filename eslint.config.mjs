import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
    ...nextVitals,
    prettierConfig,
    {
        plugins: {
            prettier,
        },
        rules: {
            'prettier/prettier': 'error',
        },
    },
]);
