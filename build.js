const esbuild = require('esbuild');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build JavaScript/TypeScript
esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  loader: { 
    '.tsx': 'tsx',
    '.ts': 'tsx',
    '.jsx': 'jsx',
    '.js': 'jsx',
  },
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"development"'
  },
}).catch(() => process.exit(1));

// Process CSS with PostCSS and Tailwind
const css = fs.readFileSync('src/index.css', 'utf8');
postcss([
  tailwindcss,
  autoprefixer,
])
  .process(css, { 
    from: 'src/index.css', 
    to: 'dist/output.css'
  })
  .then(result => {
    fs.writeFileSync('dist/output.css', result.css);
  });