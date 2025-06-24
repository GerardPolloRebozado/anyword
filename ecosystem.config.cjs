module.exports = {
  apps: [
    {
      name: 'word-game',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
