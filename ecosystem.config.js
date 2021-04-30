module.exports = {
  apps: [
    {
      name: 'app',
      script: 'npm',
      args: 'develop',
      interpreter: '/bin/bash',
      env: {
        NODE_ENV: 'development'
      }
    },
  ],
};